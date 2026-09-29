import type { OrderStatus, OrderType, PaymentMethod } from "@heybrew/shared";

/** Catalog & public API shapes expected from the HeyBrew backend. */

export type ModifierOption = {
  id: string;
  name: string;
  priceDeltaMinor: number;
  isDefault?: boolean;
  isAvailable?: boolean;
};

export type ModifierGroup = {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  options: ModifierOption[];
};

export type ProductVariant = {
  id: string;
  name: string;
  priceMinor: number;
  isDefault?: boolean;
  isAvailable?: boolean;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  imageUrl: string;
  basePriceMinor: number;
  isPopular?: boolean;
  isAvailable?: boolean;
  variants: ProductVariant[];
  modifierGroups: ModifierGroup[];
  tags?: string[];
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  imageUrl?: string | null;
};

export type Branch = {
  id: string;
  name: string;
  addressLabel: string;
  isActive: boolean;
  /** Google Maps / directions URL */
  mapsUrl?: string | null;
  /** Configure in admin — not real hours */
  hoursNote?: string;
};

export type DeliveryZone = {
  id: string;
  name: string;
  branchId: string;
  feeMinor: number;
  isActive: boolean;
  /** Configure in admin — not a real ETA promise */
  etaNote?: string;
};

export type MenuResponse = {
  categories: Category[];
  products: Product[];
  popularProductIds: string[];
  source: "api" | "demo";
};

export type PublicSettingsClient = {
  storeName: string;
  tagline?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  whatsappNumber?: string | null;
  taxEnabled: boolean;
  taxRateBps: number;
  /** When false, client hides coupon field (default) */
  couponsEnabled?: boolean;
  banners: Array<{
    id: string;
    /** Desktop — 2880×640 source, 1440×320 display (9∶2) */
    imageUrl?: string | null;
    /** Mobile — 900×450 crop (2∶1) */
    imageUrlMobile?: string | null;
    title?: string | null;
    subtitle?: string | null;
    linkUrl?: string | null;
    isActive: boolean;
  }>;
  announcements: Array<{
    id: string;
    message: string;
    isActive: boolean;
  }>;
  social: {
    instagram?: string | null;
    facebook?: string | null;
    tiktok?: string | null;
  };
  paymentMethods: Partial<Record<PaymentMethod, boolean>>;
  currency: "PKR";
  source: "api" | "demo";
};

export type CartLineLocal = {
  key: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  modifiers: Array<{
    groupId: string;
    optionId: string;
    name: string;
    priceDeltaMinor: number;
  }>;
  notes?: string | null;
  /** Snapshot for offline UI */
  name: string;
  imageUrl: string;
  unitPriceMinor: number;
};

export type CartTotals = {
  subtotalMinor: number;
  deliveryFeeMinor: number;
  discountMinor: number;
  taxMinor: number;
  grandTotalMinor: number;
  couponCode?: string | null;
  couponMessage?: string | null;
};

export type ValidatedCart = CartTotals & {
  items: Array<
    CartLineLocal & {
      lineTotalMinor: number;
      warnings?: string[];
    }
  >;
  warnings?: string[];
  source: "api" | "demo";
};

export type PlaceOrderResult = {
  orderId: string;
  orderNumber: string;
  accessToken: string;
  status: OrderStatus;
  type: OrderType;
  grandTotalMinor: number;
  trackUrl: string;
};

export type TrackedOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  type: OrderType;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    lineTotalMinor: number;
    notes?: string | null;
  }>;
  totals: CartTotals;
  statusHistory: Array<{
    status: OrderStatus;
    at: string;
    note?: string;
  }>;
  /** Present when status is cancelled and admin provided a reason */
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
  /** Not a binding promise — Configure in admin */
  etaNote?: string | null;
  branchName?: string | null;
  addressSummary?: string | null;
};

export type OrderingSession = {
  type: OrderType;
  branchId: string | null;
  deliveryZoneId: string | null;
  phone: string | null;
  rememberPhone: boolean;
  completed: boolean;
};
