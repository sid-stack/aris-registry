# Newsletter — hosted tool (no custom subscribe API)

We intentionally **do not** run newsletter subscriptions through our API. List management, double opt-in, unsubscribes, and CAN-SPAM/GDPR-friendly flows are delegated to a **hosted ESP** so engineering stays focused on the audit product.

## Recommended tool: **Beehiiv** (simplest for indie + embeds)

1. Create a publication (e.g. **The Bid Brief**).
2. Connect sending domain / DNS per Beehiiv’s wizard (e.g. `newsletter.bidsmith.pro` or Spacemail).
3. **Schedule:** set cadence to **twice weekly** (e.g. Tuesday + Thursday 8am ET) — meets “at least 2× / week.”
4. **Embed:** Beehiiv → *Settings* → *Subscribe forms* → create embed → copy **iframe `src`** URL.
5. **Public subscribe URL:** copy the hosted subscribe / publication URL for the primary button.

### Wire into BidSmith (Vite env, build-time)

Set in **Vercel** (or `.env.local` for dev):

| Variable | Purpose |
|----------|---------|
| `VITE_NEWSLETTER_EMBED_SRC` | Full `https://...` iframe `src` from Beehiiv (optional; omit if you only want a button). |
| `VITE_NEWSLETTER_SIGNUP_URL` | Hosted subscribe URL (recommended at minimum). |

Redeploy the frontend after changing `VITE_*` vars.

The page **`/newsletter`** renders the embed and/or opens the hosted URL.

## Alternatives

- **ConvertKit** — excellent forms; use their embed URL or hosted form link as `VITE_NEWSLETTER_EMBED_SRC` / `VITE_NEWSLETTER_SIGNUP_URL`.
- **Buttondown** — minimal, developer-friendly; similar env pattern.
- **Mailchimp** — classic; use their hosted signup URL as `VITE_NEWSLETTER_SIGNUP_URL` if you prefer not to iframe.

## Content rhythm (2× / week)

Use the internal **content bank**: `content/newsletter_content_bank.md` — copy/paste an outline into Beehiiv, tighten to &lt;500 words, add one CTA to **free audit**.

Repurpose flow:

1. Publish (or draft) a **blog** post on bidsmith.pro/blog.
2. Shrink the thesis into a **5-minute newsletter** with a single CTA.
3. Cross-post a short LinkedIn version with “full issue → link in bio” or comments link to `/newsletter`.

## MCP?

**Not required.** There is no standard “newsletter MCP” you must install. Optional later: an **RSS / web fetch** MCP to pull SAM.gov or agency news for idea prompts — keep human edit before send.

## Related docs

- `public/content/newsletter-setup.md` — voice, welcome email, issue #1 template.
- `content/newsletter_content_bank.md` — subject lines + issue skeletons.
