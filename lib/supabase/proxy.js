import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function updateSession(request) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          // Update request cookies so the current request
          // can see the refreshed session.
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          // Update response cookies so the browser
          // receives the refreshed session.
          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Check/refresh Supabase authentication.
  // data can be null when the user is signed out,
  // so DON'T destructure claims directly.
 
const { data, error } = await supabase.auth.getClaims();

const invalidRefreshToken =
  error?.code === "refresh_token_not_found" ||
  /invalid refresh token/i.test(error?.message ?? "");

if (invalidRefreshToken) {
  console.error(
    "[Supabase proxy] Invalid refresh token; clearing stale auth cookies."
  );

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = [
    "/",
    "/dashboard",
    "/users",
    "/attendance",
    "/students",
    "/classes",
    "/sanctions",
    "/reports",
    "/upload",
    "/profile",
  ].some(
    (route) =>
      pathname === route || pathname.startsWith(`${route}/`)
  );

  const cleanResponse = isProtectedRoute
    ? NextResponse.redirect(new URL("/login", request.url))
    : NextResponse.next({ request });

for (const cookie of request.cookies.getAll()) {
  if (cookie.name.startsWith("sb-")) {
    cleanResponse.cookies.set(cookie.name, "", {
      path: "/",
      maxAge: 0,
      httpOnly: false,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });
  }
}

  return cleanResponse;
}

const claims = data?.claims ?? null;
const isLoggedIn = !!claims?.sub;

 

  const { pathname } = request.nextUrl;

  const protectedRoutes = [
    "/",
    "/dashboard",
    "/users",
    "/attendance",
    "/students",
    "/classes",
    "/sanctions",
    "/reports",
    "/upload",
    "/profile",
  ];

  const authRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];

  const isProtectedRoute = protectedRoutes.some(
    (route) =>
      pathname === route || pathname.startsWith(`${route}/`)
  );

  const isAuthRoute = authRoutes.some(
    (route) =>
      pathname === route || pathname.startsWith(`${route}/`)
  );

  const isResetPassword =
    pathname === "/reset-password" ||
    pathname.startsWith("/reset-password/");

  // Not logged in -> protected page
  if (!isLoggedIn && isProtectedRoute) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  // Logged in -> don't allow login/register/etc.
  if (isLoggedIn && isAuthRoute && !isResetPassword) {
    return NextResponse.redirect(
      new URL("/", request.url)
    );
  }

  return response;
}