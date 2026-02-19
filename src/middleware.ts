import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login") || req.nextUrl.pathname.startsWith("/register");
  if (isAuthPage) {
    if (isLoggedIn) return Response.redirect(new URL("/dashboard", req.url));
    return;
  }
  if (!isLoggedIn && req.nextUrl.pathname !== "/") {
    return Response.redirect(new URL("/login", req.url));
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register", "/accounts", "/accounts/:path*", "/transactions", "/transactions/:path*", "/upload", "/upload/:path*"],
};
