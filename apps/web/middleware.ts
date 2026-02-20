import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhooks(.*)', // Only webhooks should be public
    '/api/registry',
    '/infrastructure(.*)',
    '/agents(.*)',
    '/logo.png',
    '/icon.png',
    '/_next/(.*)',
    '/static/(.*)'
]);

import { NextResponse } from 'next/server';

export default clerkMiddleware(async (auth, request) => {
    if (!isPublicRoute(request)) {
        await auth.protect();
    }

    // Strict FAANG-level 'Bouncer' Middleware
    if (request.nextUrl.pathname.startsWith('/dashboard/analyze')) {
        const { sessionClaims } = await auth();
        const metadata = (sessionClaims?.metadata as any) || {};
        const hasSub = metadata?.hasActiveSubscription === true;
        const credits = metadata?.credits || 0;

        if (!hasSub && credits <= 0) {
            console.log('[MIDDLEWARE] Unpaid user attempting to access analyzer. Bouncing to billing.');
            const pricingUrl = new URL('/dashboard/billing', request.url);
            return NextResponse.redirect(pricingUrl);
        }
    }

    // Dashboard Root Redirect (The Onboarding Router)
    if (request.nextUrl.pathname === '/dashboard') {
        const { sessionClaims } = await auth();
        const metadata = (sessionClaims?.metadata as any) || {};

        if (metadata.credits === undefined) {
            console.log('[MIDDLEWARE] First-time user detected. Bouncing to sync bridge.');
            return NextResponse.redirect(new URL('/dashboard/payment/success', request.url));
        } else if (metadata.hasActiveSubscription || metadata.credits > 0) {
            return NextResponse.redirect(new URL('/dashboard/analyze', request.url));
        } else {
            return NextResponse.redirect(new URL('/dashboard/billing', request.url));
        }
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
