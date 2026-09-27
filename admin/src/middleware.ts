import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const UI_COOKIE = process.env.NEXT_PUBLIC_ADMIN_UI_COOKIE || "heybrew_admin_ui";

const PUBLIC_PATHS = ["/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/brand") ||
    pathname.includes(".") // static assets
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const hasUiSession = request.cookies.get(UI_COOKIE)?.value === "1";

  if (!isPublic && !hasUiSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isPublic && hasUiSession && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
