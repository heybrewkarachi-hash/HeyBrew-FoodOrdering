import type { CreateOrderInput, CartValidateInput } from "@heybrew/shared";
import {
  DEMO_BRANCHES,
  DEMO_MENU,
  DEMO_SETTINGS,
  DEMO_ZONES,
  unitPriceForSelection,
} from "./demo-catalog";
import type {
  Branch,
  CartLineLocal,
  DeliveryZone,
  MenuResponse,
  PlaceOrderResult,
  Product,
  PublicSettingsClient,
  TrackedOrder,
  ValidatedCart,
} from "./types";

const API_BASE = () =>
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(
    /\/$/,
    ""
  );

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, code = "UNKNOWN", status = 0, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function request<T>(
  path: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const { timeoutMs = 8000, ...rest } = init ?? {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${API_BASE()}${path}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(rest.body ? { "Content-Type": "application/json" } : {}),
        ...rest.headers,
      },
    });

    const text = await res.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
    }

    if (!res.ok) {
      const errBody = body as {
        error?: { code?: string; message?: string; details?: unknown };
      } | null;
      throw new ApiError(
        errBody?.error?.message || `Request failed (${res.status})`,
        errBody?.error?.code || "HTTP_ERROR",
        res.status,
        errBody?.error?.details
      );
    }

    return body as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof Error && e.name === "AbortError") {
      throw new ApiError("Request timed out", "TIMEOUT", 0);
    }
    throw new ApiError(
      e instanceof Error ? e.message : "Network error",
      "NETWORK",
      0
    );
  } finally {
    clearTimeout(timer);
  }
}

function unwrapData<T>(body: unknown): T {
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

/** Soft check â€” true if API responded recently */
let apiHealthy: boolean | null = null;

export function isUsingDemoFallback(): boolean {
  return apiHealthy === false;
}

export async function probeApi(): Promise<boolean> {
  try {
    await request("/health", { timeoutMs: 3000 });
    apiHealthy = true;
    return true;
  } catch {
    try {
      await request("/api/v1/settings/public", { timeoutMs: 3000 });
      apiHealthy = true;
      return true;
    } catch {
      apiHealthy = false;
      return false;
    }
  }
}

export async function fetchPublicSettings(): Promise<PublicSettingsClient> {
  try {
    const data = unwrapData<Omit<PublicSettingsClient, "source">>(
      await request("/api/v1/settings/public")
    );
    apiHealthy = true;
    return { ...data, source: "api" };
  } catch {
    apiHealthy = false;
    return DEMO_SETTINGS;
  }
}

export async function fetchBranches(): Promise<Branch[]> {
  try {
    const raw = await request<{ items?: Branch[] } | Branch[]>("/api/v1/branches");
    const list = Array.isArray(raw) ? raw : raw.items ?? [];
    apiHealthy = true;
    return list.map((b) => ({
      id: b.id,
      name: b.name,
      addressLabel:
        (b as Branch & { address?: { line1?: string } }).addressLabel ||
        (b as { address?: { line1?: string } }).address?.line1 ||
        "Configure in admin",
      isActive: (b as { isActive?: boolean }).isActive !== false,
      hoursNote: (b as Branch).hoursNote,
    }));
  } catch {
    apiHealthy = false;
    return DEMO_BRANCHES;
  }
}

export async function fetchDeliveryZones(
  branchId?: string
): Promise<DeliveryZone[]> {
  try {
    const q = branchId ? `?branchId=${encodeURIComponent(branchId)}` : "";
    const raw = await request<{ items?: DeliveryZone[] } | DeliveryZone[]>(
      `/api/v1/delivery-zones${q}`
    );
    const list = Array.isArray(raw) ? raw : raw.items ?? [];
    apiHealthy = true;
    return list.map((z) => ({
      id: z.id,
      name: z.name,
      branchId: z.branchId,
      feeMinor: z.feeMinor,
      isActive: (z as { isActive?: boolean }).isActive !== false,
      etaNote: z.etaNote,
    }));
  } catch {
    apiHealthy = false;
    return branchId
      ? DEMO_ZONES.filter((z) => z.branchId === branchId)
      : DEMO_ZONES;
  }
}

function mapApiProduct(p: Record<string, unknown>): Product {
  const images = (p.images as Array<{ url?: string; alt?: string }>) || [];
  const variants = (p.variants as Product["variants"]) || [];
  const priceMinor = Number(p.priceMinor ?? p.basePriceMinor ?? 0);
  return {
    id: String(p.id),
    name: String(p.name ?? ""),
    slug: String(p.slug ?? ""),
    description: String(p.description ?? ""),
    categoryId: String(p.categoryId ?? ""),
    imageUrl: images[0]?.url || String(p.imageUrl ?? ""),
    basePriceMinor: priceMinor,
    isPopular: Boolean(p.featured || p.isPopular),
    isAvailable: p.isAvailable !== false,
    variants:
      variants.length > 0
        ? variants
        : [{ id: "default", name: "Regular", priceMinor, isDefault: true }],
    modifierGroups: (p.modifierGroups as Product["modifierGroups"]) || [],
    tags: (p.keywords as string[]) || (p.tags as string[]) || [],
  };
}

export async function fetchMenu(params?: {
  branchId?: string | null;
  deliveryZoneId?: string | null;
}): Promise<MenuResponse> {
  try {
    const sp = new URLSearchParams();
    if (params?.branchId) sp.set("branchId", params.branchId);
    if (params?.deliveryZoneId) sp.set("deliveryZoneId", params.deliveryZoneId);
    const q = sp.toString() ? `?${sp}` : "";
    const data = await request<{
      categories?: Array<Record<string, unknown>>;
      products?: Array<Record<string, unknown>>;
    }>(`/api/v1/catalog/menu${q}`);
    apiHealthy = true;
    const products = (data.products ?? []).map(mapApiProduct);
    const categories = (data.categories ?? []).map((c, i) => ({
      id: String(c.id),
      name: String(c.name ?? ""),
      slug: String(c.slug ?? ""),
      sortOrder: Number(c.displayOrder ?? c.sortOrder ?? i),
    }));
    return {
      categories,
      products,
      popularProductIds: products.filter((p) => p.isPopular).map((p) => p.id),
      source: "api",
    };
  } catch {
    apiHealthy = false;
    return DEMO_MENU;
  }
}

export async function fetchProduct(idOrSlug: string): Promise<Product | null> {
  try {
    const data = unwrapData<Product>(
      await request(`/api/v1/catalog/products/${encodeURIComponent(idOrSlug)}`)
    );
    return data;
  } catch {
    return (
      DEMO_MENU.products.find(
        (p) => p.id === idOrSlug || p.slug === idOrSlug
      ) ?? null
    );
  }
}

function demoValidateCart(
  input: CartValidateInput,
  lines: CartLineLocal[],
  products: Product[]
): ValidatedCart {
  const zone = DEMO_ZONES.find((z) => z.id === input.deliveryZoneId);
  const deliveryFee =
    input.type === "delivery" ? zone?.feeMinor ?? 15000 : 0;

  const items = lines.map((line) => {
    const product = products.find((p) => p.id === line.productId);
    const unit =
      product != null
        ? unitPriceForSelection(product, line.variantId, line.modifiers)
        : line.unitPriceMinor;
    return {
      ...line,
      unitPriceMinor: unit,
      lineTotalMinor: unit * line.quantity,
    };
  });

  const subtotalMinor = items.reduce((s, i) => s + i.lineTotalMinor, 0);
  let discountMinor = 0;
  let couponMessage: string | null = null;
  const code = input.couponCode?.trim().toUpperCase();
  if (code === "DEMO10") {
    discountMinor = Math.round(subtotalMinor * 0.1);
    couponMessage = "DEMO10 applied (Development seed â€” 10% off)";
  } else if (code) {
    couponMessage = "Coupon not available in DEVELOPMENT FALLBACK mode";
  }

  const taxMinor = 0;
  const grandTotalMinor = Math.max(
    0,
    subtotalMinor + deliveryFee - discountMinor + taxMinor
  );

  return {
    items,
    subtotalMinor,
    deliveryFeeMinor: deliveryFee,
    discountMinor,
    taxMinor,
    grandTotalMinor,
    couponCode: code || null,
    couponMessage,
    warnings: [
      "DEVELOPMENT FALLBACK â€” totals computed locally. Prefer live API validation.",
    ],
    source: "demo",
  };
}

export async function validateCart(
  input: CartValidateInput,
  lines: CartLineLocal[],
  products: Product[] = DEMO_MENU.products
): Promise<ValidatedCart> {
  try {
    const data = unwrapData<ValidatedCart>(
      await request("/api/v1/cart/validate", {
        method: "POST",
        body: JSON.stringify(input),
      })
    );
    apiHealthy = true;
    return { ...data, source: "api" };
  } catch {
    apiHealthy = false;
    return demoValidateCart(input, lines, products);
  }
}

export async function validateCoupon(payload: {
  code: string;
  type: string;
  branchId: string;
  subtotalMinor: number;
}): Promise<{ valid: boolean; discountMinor?: number; message?: string }> {
  try {
    return unwrapData(
      await request("/api/v1/coupons/validate", {
        method: "POST",
        body: JSON.stringify(payload),
      })
    );
  } catch {
    const code = payload.code.trim().toUpperCase();
    if (code === "DEMO10") {
      return {
        valid: true,
        discountMinor: Math.round(payload.subtotalMinor * 0.1),
        message: "DEMO10 â€” Development seed coupon",
      };
    }
    return {
      valid: false,
      message: "Coupon validation unavailable (DEVELOPMENT FALLBACK)",
    };
  }
}

export async function placeOrder(
  input: CreateOrderInput,
  idempotencyKey?: string
): Promise<PlaceOrderResult> {
  try {
    const key =
      idempotencyKey ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `hb-${Date.now()}`);
    const raw = await request<{ order?: PlaceOrderResult } & PlaceOrderResult>(
      "/api/v1/orders",
      {
        method: "POST",
        body: JSON.stringify(input),
        timeoutMs: 15000,
        headers: { "Idempotency-Key": key },
      }
    );
    apiHealthy = true;
    return (raw.order ?? raw) as PlaceOrderResult;
  } catch (e) {
    if (e instanceof ApiError && e.status >= 400 && e.status < 500) throw e;
    apiHealthy = false;
    const orderId = `demo-${Date.now()}`;
    const orderNumber = `HB-DEMO-${Math.floor(Math.random() * 9000 + 1000)}`;
    const accessToken = `demo-token-${crypto.randomUUID()}`;
    const demoOrder: TrackedOrder = {
      id: orderId,
      orderNumber,
      status: "pending",
      type: input.type,
      paymentMethod: input.paymentMethod,
      paymentStatus: "unpaid",
      customerName: input.customer.name,
      items: input.items.map((i) => ({
        name: `Item ${i.productId} (Development seed)`,
        quantity: i.quantity,
        lineTotalMinor: 0,
        notes: i.notes,
      })),
      totals: {
        subtotalMinor: 0,
        deliveryFeeMinor: 0,
        discountMinor: 0,
        taxMinor: 0,
        grandTotalMinor: 0,
      },
      statusHistory: [
        {
          status: "pending",
          at: new Date().toISOString(),
          note: "DEVELOPMENT FALLBACK order - not persisted to server",
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      etaNote: "Configure in admin - ETA not a real promise",
      branchName: "Demo branch",
      addressSummary:
        input.type === "delivery"
          ? input.address
            ? `${input.address.line1}, ${input.address.area}`
            : null
          : "Pickup - Configure in admin",
    };
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        `heybrew:demo-order:${orderNumber}:${accessToken}`,
        JSON.stringify(demoOrder)
      );
    }
    return {
      orderId,
      orderNumber,
      accessToken,
      status: "pending",
      type: input.type,
      grandTotalMinor: 0,
      trackUrl: `/orders/${orderNumber}?token=${accessToken}`,
    };
  }
}

export async function trackOrder(
  orderNumber: string,
  token: string
): Promise<TrackedOrder> {
  try {
    const raw = await request<{ order?: TrackedOrder } & TrackedOrder>(
      `/api/v1/orders/track/${encodeURIComponent(orderNumber)}?token=${encodeURIComponent(token)}`
    );
    return (raw.order ?? raw) as TrackedOrder;
  } catch (e) {
    if (typeof window !== "undefined") {
      const raw = sessionStorage.getItem(
        `heybrew:demo-order:${orderNumber}:${token}`
      );
      if (raw) return JSON.parse(raw) as TrackedOrder;
    }
    throw e instanceof ApiError
      ? e
      : new ApiError("Order not found", "NOT_FOUND", 404);
  }
}

