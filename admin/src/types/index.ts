import type {
  AdminRole,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  CouponType,
  StatusHistoryEntry,
} from "@heybrew/shared";

export type { AdminRole, OrderStatus, OrderType, PaymentMethod, PaymentStatus, CouponType };

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions?: string[];
  branchIds?: string[];
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type BranchHoursDay = {
  open: string;
  close: string;
  closed?: boolean;
};

export type Branch = {
  id: string;
  name: string;
  slug: string;
  address: {
    line1: string;
    line2?: string | null;
    area: string;
    city: string;
  };
  phone?: string | null;
  isPickupOpen: boolean;
  hours?: Record<string, BranchHoursDay>;
  specialClosures?: { date: string; reason?: string }[];
  orderingPaused: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type DeliveryZone = {
  id: string;
  name: string;
  branchId: string;
  feeMinor: number;
  minOrderMinor: number;
  isActive: boolean;
  polygonNote?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductImage = {
  publicId: string;
  url: string;
  alt?: string | null;
};

export type ProductVariant = {
  id: string;
  name: string;
  priceDeltaMinor: number;
  isDefault?: boolean;
};

export type ModifierOption = {
  id: string;
  name: string;
  priceDeltaMinor: number;
  isDefault?: boolean;
};

export type ModifierGroup = {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  required: boolean;
  options: ModifierOption[];
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  categoryId: string;
  images: ProductImage[];
  priceMinor: number;
  variants: ProductVariant[];
  modifierGroups: ModifierGroup[];
  availableBranchIds: string[];
  soldOutBranchIds: string[];
  featured: boolean;
  displayOrder: number;
  isArchived: boolean;
  keywords?: string[];
  developmentSeed?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type Coupon = {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  startsAt: string;
  endsAt: string;
  minOrderMinor: number;
  maxDiscountMinor?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  applicable?: {
    orderTypes?: OrderType[];
    branchIds?: string[];
    categoryIds?: string[];
    productIds?: string[];
  };
  stackingRules?: {
    allowWithOtherCoupons?: boolean;
    exclusive?: boolean;
  };
  developmentSeed?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type OrderItem = {
  id?: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantId?: string | null;
  variantName?: string | null;
  unitPriceMinor: number;
  modifiers: {
    groupId: string;
    optionId: string;
    name: string;
    priceDeltaMinor: number;
  }[];
  quantity: number;
  lineTotalMinor: number;
  notes?: string | null;
};

export type Order = {
  id: string;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  customer: {
    name: string;
    phone: string;
    email?: string | null;
  };
  address?: {
    line1: string;
    line2?: string | null;
    area: string;
    city: string;
    landmark?: string | null;
  } | null;
  items: OrderItem[];
  totals: {
    subtotalMinor: number;
    deliveryFeeMinor: number;
    discountMinor: number;
    taxMinor: number;
    totalMinor: number;
  };
  coupon?: {
    code: string;
    type: CouponType;
    value: number;
    discountMinor: number;
  } | null;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  version: number;
  branchId: string;
  branchName?: string;
  deliveryZoneId?: string | null;
  deliveryZoneName?: string | null;
  notes?: string | null;
  staffNotes?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DashboardStats = {
  newOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  /** Sales from completed orders only (delivered / collected). Cancelled excluded. */
  salesMinor: number;
  salesNote?: string;
  aovMinor: number;
  popularProducts: {
    productId: string;
    name: string;
    quantity: number;
    revenueMinor: number;
  }[];
  recentOrders: Order[];
  from: string;
  to: string;
  branchId?: string | null;
};

export type Banner = {
  id: string;
  /** Desktop hero — prefer 2880×640 (displays 1440×320, 9∶2) */
  imageUrl?: string | null;
  /** Mobile hero — prefer 900×450 (2∶1) */
  imageUrlMobile?: string | null;
  title?: string | null;
  subtitle?: string | null;
  linkUrl?: string | null;
  isActive: boolean;
};

export type Announcement = {
  id: string;
  message: string;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

export type AdminSettings = {
  storeName: string;
  tagline?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  whatsappNumber?: string | null;
  hoursNote?: string | null;
  taxEnabled: boolean;
  taxRateBps: number;
  taxConfigured?: boolean;
  /** Master switch — client only shows coupon codes when true (default false) */
  couponsEnabled?: boolean;
  banners: Banner[];
  announcements: Announcement[];
  social: {
    instagram?: string | null;
    facebook?: string | null;
    tiktok?: string | null;
  };
  paymentMethods: Record<PaymentMethod, boolean>;
  orderingPaused: boolean;
  currency: "PKR";
  currencyMinorUnit: 100;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
};

export type CloudinarySignResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
  uploadUrl?: string;
};
