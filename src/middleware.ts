import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { apiRateLimiter, getClientIp } from "@/lib/rate-limit";

const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
]);

const isApiRoute = createRouteMatcher([
    '/api(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
    // Apply rate limiting to API routes (if configured)
    if (isApiRoute(req) && apiRateLimiter) {
        const ip = getClientIp(req);
        const { success, limit, reset, remaining } = await apiRateLimiter.limit(ip);

        if (!success) {
            return new NextResponse(
                JSON.stringify({
                    error: "Too many requests",
                    message: "You have exceeded the rate limit. Please try again later.",
                    limit,
                    reset: new Date(reset).toISOString(),
                }),
                {
                    status: 429,
                    headers: {
                        "Content-Type": "application/json",
                        "X-RateLimit-Limit": limit.toString(),
                        "X-RateLimit-Remaining": remaining.toString(),
                        "X-RateLimit-Reset": reset.toString(),
                    },
                }
            );
        }
    }

    // Apply Clerk authentication to protected routes
    if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
