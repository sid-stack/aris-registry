import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

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

export default clerkMiddleware(async (auth, request) => {
    const host = request.headers.get('host') || '';
    const isProd = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';
    if (isProd && !host.endsWith('bidsmith.pro')) {
        const url = new URL(request.url);
        url.host = 'bidsmith.pro';
        url.protocol = 'https:';
        return NextResponse.redirect(url, 308);
    }

    const localBypassEnabled = process.env.LOCAL_DEV_USER_ID === 'dev_local_user';
    if (localBypassEnabled) {
        const res = NextResponse.next();
        res.headers.set('X-Authorized-Parties', 'https://bidsmith.pro');
        return res;
    }

    const isN8nRequest = request.nextUrl.pathname.startsWith('/api/generate-proposal') &&
        request.headers.get('authorization') === `Bearer ${process.env.INTERNAL_API_SECRET}`;

    if (!isPublicRoute(request) && !isN8nRequest) {
        await auth.protect();
    }

    const res = NextResponse.next();
    res.headers.set('X-Authorized-Parties', 'https://bidsmith.pro');
    return res;
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
