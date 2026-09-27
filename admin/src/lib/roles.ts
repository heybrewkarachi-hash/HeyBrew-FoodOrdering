import type { AdminRole } from "@heybrew/shared";

export type NavItem = {
  href: string;
  label: string;
  roles: AdminRole[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", roles: ["owner", "manager", "staff"] },
  { href: "/orders", label: "Orders", roles: ["owner", "manager", "staff"] },
  { href: "/categories", label: "Categories", roles: ["owner", "manager"] },
  { href: "/products", label: "Products", roles: ["owner", "manager"] },
  { href: "/coupons", label: "Coupons", roles: ["owner", "manager"] },
  { href: "/branches", label: "Branches", roles: ["owner", "manager"] },
  { href: "/settings", label: "Settings", roles: ["owner", "manager"] },
  { href: "/users", label: "Users", roles: ["owner"] },
];

export function canAccess(role: AdminRole | undefined, roles: AdminRole[]): boolean {
  if (!role) return false;
  return roles.includes(role);
}

export function navForRole(role: AdminRole | undefined): NavItem[] {
  return NAV_ITEMS.filter((item) => canAccess(role, item.roles));
}

export function roleLabel(role: AdminRole): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "manager":
      return "Manager";
    case "staff":
      return "Staff";
    default:
      return role;
  }
}
