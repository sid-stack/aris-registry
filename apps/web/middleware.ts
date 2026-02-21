import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/api/webhook(.*)', // Explicitly allow singular
    '/api/webhooks(.*)', // explicitly allow plural
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
    // n8n Service Secret Bypass
    const isN8nRequest = request.nextUrl.pathname.startsWith('/api/generate-proposal') &&
        request.headers.get('authorization') === `Bearer ${process.env.INTERNAL_API_SECRET}`;

    if (!isPublicRoute(request) && !isN8nRequest) {
        await auth.protect();
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
