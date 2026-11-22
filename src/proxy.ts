import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();
  const user = data.user;
  const role = user?.app_metadata?.role === "admin" ? "admin" : "student";
  const pathname = request.nextUrl.pathname;

  if (pathname === "/" && user) {
    return NextResponse.redirect(new URL(role === "admin" ? "/admin/consultations" : "/dashboard", request.url));
  }
  if (pathname === "/dashboard" && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname === "/dashboard" && role === "admin") {
    return NextResponse.redirect(new URL("/admin/consultations", request.url));
  }
  if (pathname.startsWith("/admin/") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname.startsWith("/admin/") && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if ((pathname === "/login" || pathname === "/register") && user) {
    return NextResponse.redirect(new URL(role === "admin" ? "/admin/consultations" : "/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
