import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Route protection matrix:
 *
 * PUBLIC  — anyone, no auth required
 *   /                home page
 *   /sign-in         Clerk sign-in
 *   /sign-up         Clerk sign-up
 *   /assessment      assessment is publicly accessible
 *                    (email gate fires INSIDE the app after completion,
 *                     not at the route level)
 *   /api/webhooks/*  Clerk + ConvertKit webhooks
 *
 * PROTECTED — requires Clerk session
 *   /dashboard       user dashboard
 *   /results/*       detailed results (requires account)
 *   /courses/*       course content
 *   /admin/*         Randy-only admin panel
 */

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/assessment(.*)",
  "/api/webhooks(.*)",
]);

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth().protect();
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
