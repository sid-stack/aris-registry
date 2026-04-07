/**
 * One-time Clerk Testing setup for Playwright.
 * Requires CLERK_SECRET_KEY + VITE_CLERK_PUBLISHABLE_KEY (or CLERK_PUBLISHABLE_KEY).
 * @see https://clerk.com/docs/testing/playwright
 */
export default async function globalSetup(): Promise<void> {
  const secret = process.env.CLERK_SECRET_KEY;
  const pub =
    process.env.VITE_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY;
  if (!secret || !pub) {
    console.warn(
      "[e2e] CLERK_SECRET_KEY and publishable key not set — Clerk testing token setup skipped.",
    );
    return;
  }
  const { clerkSetup } = await import("@clerk/testing/playwright");
  await clerkSetup();
}
