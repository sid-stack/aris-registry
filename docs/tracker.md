# Pre-Launch QA Tracker — BidSmith

_Last updated: 2026-03-09_

## 1) Global / Site-wide
- [x] HTML5 doctype + `<html lang="en">`
- [x] Meta SEO (title/description/OG/Twitter/canonical)
- [x] `robots.txt` created (`/public/robots.txt`)
- [x] `sitemap.xml` created (`/public/sitemap.xml`)
- [x] JSON-LD structured data added (Organization, FAQ, Breadcrumb)
- [x] Favicon + apple touch icon links present
- [x] Inter font preloaded with noscript fallback
- [ ] Tailwind CDN usage (not applicable in Vite build; current setup uses bundled CSS/JS)
- [ ] Global dark-mode (`prefers-color-scheme`) across all pages
- [x] 404 page + fallback UI
- [ ] Analytics network validation in production (needs runtime check)
- [ ] CSP response header hardening at hosting layer
- [x] Consent banner persistence logic + backend consent APIs
- [ ] Lighthouse baseline run (LCP/CLS/TBT thresholds)
- [ ] Full WCAG AA audit (axe/Lighthouse)

## 2) Landing (`/`)
- [x] Hero gradient (CSS gradient, no background image)
- [x] Responsive headline + subheadline
- [x] Primary CTA has `aria-label`
- [x] Secondary CTA has `aria-label` and smooth-scroll target
- [x] Anchor links (`#features`, `#workflow`, `#pricing`) wired
- [ ] Mobile menu toggle + keyboard/focus trap (deferred)
- [x] Feature cards hover/lift + fixed icon dimensions
- [x] Footer utility section + legal links + template links merged
- [x] Scroll-reveal behavior (`data-reveal` + IntersectionObserver)
- [x] Consent banner hide/show based on stored consent

## 3) Features / Workflow / Pricing sections
- [x] `#features` anchor and heading hierarchy
- [x] `#workflow` cards and CTA path
- [x] `#pricing` cards + plan CTAs

## 4) Template Library (`/templates`)
- [x] Kept unchanged per request
- [x] Existing copy + copy-to-clipboard remains intact

## 5) Legal Pages
- [x] `/privacy`, `/terms`, `/cookies` pages added
- [x] Legal pages set `noindex, nofollow` dynamically
- [x] Legal links connected from footer

## 6) Backend API checks
- [x] `POST /api/privacy/consent` implemented
- [x] `GET /api/privacy/consent` implemented
- [x] Consent cookie includes `HttpOnly` and 1-year max age
- [ ] OWASP/ZAP security scan
- [ ] Malformed payload test suite expansion

## 7) Infrastructure / Delivery
- [x] Build passes (`npm run build`)
- [ ] CI pipeline test stage (project has no `npm test` script)
- [ ] Staging deployment checklist pass
- [ ] Production redirect checks (HTTP→HTTPS, www/non-www) at edge

## Remaining items to execute next
1. Run Lighthouse + axe on staging and log scores.
2. Add CSP headers in Vercel/Railway config.
3. Implement mobile nav toggle + accessibility trap.
4. Add production analytics verification in GA4 DebugView.
5. Run security headers + OWASP quick scan.
