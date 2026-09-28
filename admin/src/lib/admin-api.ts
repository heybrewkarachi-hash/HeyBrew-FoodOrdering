import { api, apiFetch, clearCsrf, UI_COOKIE, withId, mapIds, unwrapList } from "./api";
import type {
  AdminSettings,
  AdminUser,
  Branch,
  Category,
  CloudinarySignResponse,
  Coupon,
  DashboardStats,
  DeliveryZone,
  Order,
  OrderStatus,
  Paginated,
  Product,
} from "@/types";

function normalizeOrder(raw: Record<string, unknown>): Order {
  const o = withId(raw) as unknown as Order & { _id?: string };
  const items = Array.isArray(o.items)
    ? o.items.map((item) => {
        const it = withId(item as unknown as Record<string, unknown>);
        return it as unknown as Order["items"][number];
      })
    : [];
  return { ...o, items };
}

function normalizeProduct(raw: Record<string, unknown>): Product {
  return withId(raw) as unknown as Product;
}

// ─── Auth ───────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<AdminUser> {
  // Login is unauthenticated — server does not require CSRF on this route
  const data = await apiFetch<{ user: Record<string, unknown> } | Record<string, unknown>>(
    "/api/v1/admin/auth/login",
    { method: "POST", body: { email, password }, skipCsrf: true }
  );
  const userRaw =
    data && typeof data === "object" && "user" in data
      ? (data.user as Record<string, unknown>)
      : (data as Record<string, unknown>);
  setUiAuthCookie(true);
  return withId(userRaw) as unknown as AdminUser;
}

export async function logout(): Promise<void> {
  try {
    await api.post("/api/v1/admin/auth/logout");
  } finally {
    clearCsrf();
    setUiAuthCookie(false);
  }
}

export async function getMe(): Promise<AdminUser> {
  const data = await api.get<{ user: Record<string, unknown> } | Record<string, unknown>>(
    "/api/v1/admin/auth/me"
  );
  const userRaw =
    data && typeof data === "object" && "user" in data
      ? (data.user as Record<string, unknown>)
      : (data as Record<string, unknown>);
  return withId(userRaw) as unknown as AdminUser;
}

export function setUiAuthCookie(present: boolean) {
  if (typeof document === "undefined") return;
  if (present) {
    document.cookie = `${UI_COOKIE}=1; path=/; SameSite=Lax; max-age=${60 * 60 * 24 * 14}`;
  } else {
    document.cookie = `${UI_COOKIE}=; path=/; SameSite=Lax; max-age=0`;
  }
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

export async function getDashboard(params: {
  from?: string;
  to?: string;
  branchId?: string;
}): Promise<DashboardStats> {
  const data = await api.get<DashboardStats & { recentOrders?: Record<string, unknown>[] }>(
    "/api/v1/admin/dashboard",
    params
  );
  return {
    ...data,
    recentOrders: (data.recentOrders ?? []).map((o) =>
      normalizeOrder(o as unknown as Record<string, unknown>)
    ),
    salesNote:
      data.salesNote ??
      "Sales include delivered & collected orders only. Cancelled orders are excluded.",
  };
}

// ─── Orders ─────────────────────────────────────────────────────────────────

export type OrderListParams = {
  page?: number;
  limit?: number;
  q?: string;
  search?: string;
  status?: string;
  branchId?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  type?: string;
  from?: string;
  to?: string;
};

export async function listOrders(params: OrderListParams = {}): Promise<Paginated<Order>> {
  const query = {
    ...params,
    q: params.q ?? params.search,
  };
  const data = await api.get<
    Order[] | { items: Record<string, unknown>[]; page?: number; limit?: number; total?: number }
  >("/api/v1/admin/orders", query);
  const unwrapped = unwrapList(data as Order[] | { items: Record<string, unknown>[] });
  const items = unwrapped.items.map((o) =>
    normalizeOrder(o as unknown as Record<string, unknown>)
  );
  return {
    items,
    page: unwrapped.page ?? params.page ?? 1,
    limit: unwrapped.limit ?? params.limit ?? 20,
    total: unwrapped.total ?? items.length,
  };
}

export async function getOrder(id: string): Promise<Order> {
  const data = await api.get<Record<string, unknown> | { order: Record<string, unknown> }>(
    `/api/v1/admin/orders/${id}`
  );
  const raw =
    data && typeof data === "object" && "order" in data
      ? (data.order as Record<string, unknown>)
      : (data as Record<string, unknown>);
  return normalizeOrder(raw);
}

export async function updateOrderStatus(
  id: string,
  body: {
    status: OrderStatus;
    version: number;
    cancelReason?: string;
    note?: string;
  }
): Promise<Order> {
  const data = await api.patch<Record<string, unknown> | { order: Record<string, unknown> }>(
    `/api/v1/admin/orders/${id}/status`,
    body
  );
  const raw =
    data && typeof data === "object" && "order" in data
      ? (data.order as Record<string, unknown>)
      : (data as Record<string, unknown>);
  return normalizeOrder(raw);
}

export async function updateOrderNotes(
  id: string,
  body: { staffNotes: string; version?: number }
): Promise<Order> {
  const data = await api.patch<Record<string, unknown> | { order: Record<string, unknown> }>(
    `/api/v1/admin/orders/${id}`,
    body
  );
  const raw =
    data && typeof data === "object" && "order" in data
      ? (data.order as Record<string, unknown>)
      : (data as Record<string, unknown>);
  return normalizeOrder(raw);
}

// ─── Categories ─────────────────────────────────────────────────────────────

export async function listCategories(): Promise<Category[]> {
  const data = await api.get<Category[] | { items: Record<string, unknown>[] }>(
    "/api/v1/admin/categories"
  );
  return mapIds(unwrapList(data as never).items as Record<string, unknown>[]) as unknown as Category[];
}

export async function createCategory(body: Partial<Category>): Promise<Category> {
  const data = await api.post<Record<string, unknown>>("/api/v1/admin/categories", body);
  return withId(data) as unknown as Category;
}

export async function updateCategory(id: string, body: Partial<Category>): Promise<Category> {
  const data = await api.patch<Record<string, unknown>>(`/api/v1/admin/categories/${id}`, body);
  return withId(data) as unknown as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/api/v1/admin/categories/${id}`);
}

export async function reorderCategories(ids: string[]): Promise<void> {
  await api.put("/api/v1/admin/categories/reorder", { ids });
}

// ─── Products ───────────────────────────────────────────────────────────────

export async function listProducts(params: {
  page?: number;
  limit?: number;
  q?: string;
  categoryId?: string;
  archived?: boolean;
} = {}): Promise<Paginated<Product>> {
  const data = await api.get<
    Product[] | { items: Record<string, unknown>[]; page?: number; limit?: number; total?: number }
  >("/api/v1/admin/products", params);
  const unwrapped = unwrapList(data as never);
  return {
    items: unwrapped.items.map((p) => normalizeProduct(p as Record<string, unknown>)),
    page: unwrapped.page ?? params.page ?? 1,
    limit: unwrapped.limit ?? params.limit ?? 50,
    total: unwrapped.total ?? unwrapped.items.length,
  };
}

export async function getProduct(id: string): Promise<Product> {
  const data = await api.get<Record<string, unknown>>(`/api/v1/admin/products/${id}`);
  return normalizeProduct(data);
}

export async function createProduct(body: Partial<Product>): Promise<Product> {
  const data = await api.post<Record<string, unknown>>("/api/v1/admin/products", body);
  return normalizeProduct(data);
}

export async function updateProduct(id: string, body: Partial<Product>): Promise<Product> {
  const data = await api.patch<Record<string, unknown>>(`/api/v1/admin/products/${id}`, body);
  return normalizeProduct(data);
}

export async function archiveProduct(id: string): Promise<Product> {
  const data = await api.delete<Record<string, unknown>>(`/api/v1/admin/products/${id}`);
  if (data) return normalizeProduct(data);
  return updateProduct(id, { isArchived: true });
}

export async function reorderProducts(ids: string[]): Promise<void> {
  await api.put("/api/v1/admin/products/reorder", { ids });
}

export async function signUpload(params?: {
  folder?: string;
}): Promise<CloudinarySignResponse> {
  return api.post<CloudinarySignResponse>("/api/v1/admin/uploads/sign", params ?? {});
}

export async function uploadToCloudinary(
  file: File,
  sign: CloudinarySignResponse
): Promise<{ publicId: string; url: string }> {
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sign.apiKey);
  form.append("timestamp", String(sign.timestamp));
  form.append("signature", sign.signature);
  form.append("folder", sign.folder);
  const uploadUrl =
    sign.uploadUrl ?? `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`;
  const res = await fetch(uploadUrl, { method: "POST", body: form });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed: ${text.slice(0, 200)}`);
  }
  const json = (await res.json()) as { public_id: string; secure_url: string };
  return { publicId: json.public_id, url: json.secure_url };
}

// ─── Coupons ────────────────────────────────────────────────────────────────

export async function listCoupons(): Promise<Coupon[]> {
  const data = await api.get<Coupon[] | { items: Record<string, unknown>[] }>(
    "/api/v1/admin/coupons"
  );
  return mapIds(unwrapList(data as never).items as Record<string, unknown>[]) as unknown as Coupon[];
}

export async function createCoupon(body: Partial<Coupon>): Promise<Coupon> {
  const data = await api.post<Record<string, unknown>>("/api/v1/admin/coupons", body);
  return withId(data) as unknown as Coupon;
}

export async function updateCoupon(id: string, body: Partial<Coupon>): Promise<Coupon> {
  const data = await api.patch<Record<string, unknown>>(`/api/v1/admin/coupons/${id}`, body);
  return withId(data) as unknown as Coupon;
}

export async function deleteCoupon(id: string): Promise<void> {
  await api.delete(`/api/v1/admin/coupons/${id}`);
}

// ─── Branches & zones ───────────────────────────────────────────────────────

export async function listBranches(): Promise<Branch[]> {
  const data = await api.get<Branch[] | { items: Record<string, unknown>[] }>(
    "/api/v1/admin/branches"
  );
  return mapIds(unwrapList(data as never).items as Record<string, unknown>[]) as unknown as Branch[];
}

export async function createBranch(body: Partial<Branch>): Promise<Branch> {
  const data = await api.post<Record<string, unknown>>("/api/v1/admin/branches", body);
  return withId(data) as unknown as Branch;
}

export async function updateBranch(id: string, body: Partial<Branch>): Promise<Branch> {
  const data = await api.patch<Record<string, unknown>>(`/api/v1/admin/branches/${id}`, body);
  return withId(data) as unknown as Branch;
}

export async function deleteBranch(id: string): Promise<void> {
  await api.delete(`/api/v1/admin/branches/${id}`);
}

export async function listDeliveryZones(branchId?: string): Promise<DeliveryZone[]> {
  const data = await api.get<DeliveryZone[] | { items: Record<string, unknown>[] }>(
    "/api/v1/admin/delivery-zones",
    branchId ? { branchId } : undefined
  );
  return mapIds(
    unwrapList(data as never).items as Record<string, unknown>[]
  ) as unknown as DeliveryZone[];
}

export async function createDeliveryZone(body: Partial<DeliveryZone>): Promise<DeliveryZone> {
  const data = await api.post<Record<string, unknown>>("/api/v1/admin/delivery-zones", body);
  return withId(data) as unknown as DeliveryZone;
}

export async function updateDeliveryZone(
  id: string,
  body: Partial<DeliveryZone>
): Promise<DeliveryZone> {
  const data = await api.patch<Record<string, unknown>>(
    `/api/v1/admin/delivery-zones/${id}`,
    body
  );
  return withId(data) as unknown as DeliveryZone;
}

export async function deleteDeliveryZone(id: string): Promise<void> {
  await api.delete(`/api/v1/admin/delivery-zones/${id}`);
}

// ─── Settings ───────────────────────────────────────────────────────────────

export async function getSettings(): Promise<AdminSettings> {
  const data = await api.get<AdminSettings | { settings: AdminSettings }>(
    "/api/v1/admin/settings"
  );
  if (data && typeof data === "object" && "settings" in data) {
    return (data as { settings: AdminSettings }).settings;
  }
  return data as AdminSettings;
}

export async function updateSettings(body: Partial<AdminSettings>): Promise<AdminSettings> {
  const data = await api.patch<AdminSettings | { settings: AdminSettings }>(
    "/api/v1/admin/settings",
    body
  );
  if (data && typeof data === "object" && "settings" in data) {
    return (data as { settings: AdminSettings }).settings;
  }
  return data as AdminSettings;
}

// ─── Users ──────────────────────────────────────────────────────────────────

export async function listUsers(): Promise<AdminUser[]> {
  const data = await api.get<AdminUser[] | { items: Record<string, unknown>[] }>(
    "/api/v1/admin/users"
  );
  return mapIds(unwrapList(data as never).items as Record<string, unknown>[]) as unknown as AdminUser[];
}

export async function createUser(body: {
  email: string;
  name: string;
  password: string;
  role: string;
  branchIds?: string[];
}): Promise<AdminUser> {
  const data = await api.post<Record<string, unknown>>("/api/v1/admin/users", body);
  return withId(data) as unknown as AdminUser;
}

export async function updateUser(
  id: string,
  body: Partial<{
    email: string;
    name: string;
    password: string;
    role: string;
    branchIds: string[];
    isActive: boolean;
  }>
): Promise<AdminUser> {
  const data = await api.patch<Record<string, unknown>>(`/api/v1/admin/users/${id}`, body);
  return withId(data) as unknown as AdminUser;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/api/v1/admin/users/${id}`);
}
