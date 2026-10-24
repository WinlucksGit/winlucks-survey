# Winlucks Merchant Survey — Setup & Go-Live

What's in this folder:

| File | What it is |
|---|---|
| `index.html` | Public survey: 9 questions, about 1 minute, English + Arabic, gives a Founding Merchant code |
| `dashboard.html` | Your private dashboard: totals, charts, Hot/Warm leads with WhatsApp links |
| `apps-script/Code.gs` | Free backend: checks for bots, saves to Google Sheets, serves dashboard data |
| `winlucks-logo.png` | **Add this yourself:** the official logo file, used as-is |

Everything is free: Cloudflare (hosting + bot check) and Google Sheets (storage).

---

## Step 1 — Google Sheet backend (10 min)
1. Create a Google Sheet called `Winlucks Merchant Survey` on the Winlucks Google account.
2. **Extensions → Apps Script** → delete the sample code → paste all of `apps-script/Code.gs` → Save.
3. **Project Settings (gear) → Script properties → Add property**:
   - `TURNSTILE_SECRET` = your Turnstile secret key (Step 2)
   - `DASHBOARD_KEY` = a long password only you and the sales lead know (e.g. 20 random characters)
4. **Deploy → New deployment → type: Web app** → Execute as **Me** → Who has access **Anyone** → Deploy → authorise.
5. Copy the **Web app URL** (ends in `/exec`).

> Each time you change the code later: **Deploy → Manage deployments → Edit → Version: New version**. The URL stays the same.

## Step 2 — Bot check keys (5 min)
1. dash.cloudflare.com → sign up free → **Turnstile → Add widget**.
2. Hostname: `survey.winlucks.com` (and `<your-project>.pages.dev` from Step 4). Mode: **Managed**.
3. Copy the **Site key** and the **Secret key** (secret goes into Step 1.3).

## Step 3 — Paste the settings
- In `index.html`, at the top of the script: `ENDPOINT` (Web app URL), `TURNSTILE_SITE_KEY`, `PUBLIC_URL` (your final survey link).
- In `dashboard.html`: `ENDPOINT` (same Web app URL).
- Put `winlucks-logo.png` in the folder.

## Step 4 — Publish for the public (Cloudflare Pages, 5 min)
1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Upload assets**.
2. Project name `winlucks-survey` → drag the whole folder in (without the `apps-script` folder) → **Deploy**.
3. You get a live link like `https://winlucks-survey.pages.dev`. It works immediately for anyone.
4. Optional, nicer link: project → **Custom domains → Set up** → `survey.winlucks.com`. If winlucks.com's DNS is on Cloudflare this is automatic; otherwise add the CNAME record it shows at your domain provider.
5. Test from your phone: submit once, check the Sheet, then delete your test row.

**Alternative hosts** (same files, also free): Netlify Drop (drag-and-drop at app.netlify.com/drop) or GitHub Pages. Remember to add that hostname to the Turnstile widget.

## Links to use
| Who | Link |
|---|---|
| Merchants (general) | `https://survey.winlucks.com/` |
| QR code on table cards | `https://survey.winlucks.com/?src=qr` |
| WhatsApp broadcasts | `https://survey.winlucks.com/?src=whatsapp` |
| Meta ads (if sending to the web form) | `https://survey.winlucks.com/?src=meta` |
| Each field rep (credits their surveys) | `https://survey.winlucks.com/?rep=Ahmed` |
| Referral (built automatically on the thank-you screen) | `...?ref=WLF-XXXXX&src=referral` |
| Your dashboard | `https://survey.winlucks.com/dashboard.html` → enter the DASHBOARD_KEY |

The dashboard only shows data after the key is entered; the key is checked by the Google Sheet backend, not the page. Don't share the dashboard key with merchants.

## What merchants see after submitting
- Their **Founding Merchant code** (e.g. `WLF-7K2QX`), a Copy button and **Share with another shop** on WhatsApp (with their referral code built in).
- "What UAE merchants told us so far": totals and percentages only, no names or numbers. Hidden until 20 surveys are in.
- If the same mobile number submits again, it isn't saved twice; they just see their existing code.

## How bots are stopped
Cloudflare Turnstile (checked again on the server) · hidden honeypot field · at least 15 seconds to complete · real taps/typing required · automated-browser detection · UAE mobile format · one survey per mobile number · max 80 submissions per 10 minutes. Blocked attempts are listed in the **Rejected** tab and counted on the dashboard.

For most people Turnstile is invisible or one tap, so it doesn't stop real merchants from filling it.

---

## Meta Instant Form (same 9 questions)
**Form type:** Higher intent. **Privacy policy:** link to the Winlucks privacy policy page.
**Intro headline:** `Boost your customers and online presence with Winlucks`
**Intro description (choose "List" layout):**
- Winlucks is a UAE app that helps local shops get new customers and bring them back
- Get discovered by nearby customers, promote your offers, sell online without a website
- Shoppers earn rewards and WL Coins when they buy from you
- Free registration for Founding Merchants: answer and get your code (2 months free at launch + featured badge)

Prefill fields: **Full name**, **Phone number**, **Company name** (label: Business name)
Custom questions (multiple choice):
1. Business type — Restaurant / Café · Grocery / Minimart · Salon / Barbershop · Laundry · Car wash / Auto · Fashion / Beauty · Electronics / Mobile · Other · **I don't run a business** (→ conditional logic to a separate "This survey is for business owners" ending)
2. Emirate — the 7 emirates
3. Biggest challenge today — same 7 options as the web form
4. Do you pay commission to delivery apps or marketplaces? — Yes, and it's worth it · Yes, but it's too expensive · No
5. What would make you try Winlucks? — same 6 options
6. Which payment model do you prefer? — same 4 options
7. Would you like to join Winlucks as a merchant? — Yes · Maybe — need more info · Not now · No

That is 10 questions in total, within Meta's 15-question limit.

**Completion screen:** `Thank you! Our team will WhatsApp you your Founding Merchant code within 24 hours.` (Meta forms can't show a generated code, so the team sends it. Add the lead to the Sheet with source `meta` and give it a code.)

**Junk filter for Meta leads:** drop "I don't run a business", non-UAE mobile numbers, duplicates and obvious test names. Confirm every remaining lead by WhatsApp before counting it.
