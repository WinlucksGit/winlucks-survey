# Winlucks Merchant Survey — Final Setup

**Live address:** https://survey.winlucks.com/ (hosted on GitHub Pages: WinlucksGit/winlucks-survey)
**Dashboard:** https://survey.winlucks.com/dashboard.html

## What's in the package

| File | Upload to GitHub? | What it is |
|---|---|---|
| `index.html` | Yes | The survey: 9 questions, ~1 minute, English + Arabic, Winlucks logo built in |
| `dashboard.html` | Yes | Private dashboard: totals, charts, Hot/Warm leads with WhatsApp links |
| `winlucks-logo-horizontal.png` | Yes | Official horizontal logo (also embedded in `index.html`) |
| `winlucks-logo.png` | Yes | Official stacked logo |
| `CNAME` | Yes | Points GitHub Pages at `survey.winlucks.com` |
| `Code.gs` | Optional (safe) | Backend code to paste into Google Apps Script |
| `SETUP.md` | Optional | This guide |

**Status today:** the survey runs in *preview mode* (answers are not saved) and the dashboard shows *sample data* until steps 1–4 are done.

---

## Step 1 — Google Sheet backend (stores the answers)
1. sheets.google.com → new sheet `Winlucks Merchant Survey` (Winlucks Google account).
2. **Extensions → Apps Script** → delete sample code → paste all of `Code.gs` → **Save**.
3. **Deploy → New deployment → Web app** → Execute as **Me** → Who has access **Anyone** → **Deploy** → allow access.
4. Copy the **Web app URL** (ends in `/exec`).

Answers will appear in the **Responses** tab. Blocked bot attempts go to **Rejected**.

## Step 2 — Cloudflare Turnstile (bot check, free)
1. dash.cloudflare.com → **Turnstile → Add widget**, mode **Managed**.
2. Hostnames: `survey.winlucks.com` and `winlucksgit.github.io`.
3. Copy the **Site key** (public) and **Secret key** (private).

## Step 3 — Secret settings in Apps Script
**Project Settings (gear) → Script properties → Add**:
- `TURNSTILE_SECRET` = Turnstile secret key
- `DASHBOARD_KEY` = a long password for the dashboard (share only with your sales lead)

Never put these two in GitHub or in chat.

## Step 4 — Connect the pages
Edit on GitHub (open the file → pencil icon → **Commit changes**):
- `index.html`: `ENDPOINT` = Web app URL, `TURNSTILE_SITE_KEY` = Site key
- `dashboard.html`: `ENDPOINT` = Web app URL

Or send Claude the Web app URL and Site key and upload the two files it returns.

**Test:** submit once from your phone → check the Sheet → open the dashboard with your key → delete the test row.

> Changed `Code.gs` later? Apps Script → **Deploy → Manage deployments → Edit → New version**. The URL stays the same.

---

## Custom domain (survey.winlucks.com)
1. GitHub repo → **Settings → Pages** → Custom domain `survey.winlucks.com` → Save (the `CNAME` file does this too).
2. At the winlucks.com DNS provider add: **CNAME** · name `survey` · value `winlucksgit.github.io`.
3. Wait for the DNS check to pass (minutes to a few hours), then tick **Enforce HTTPS**.

If Pages shows 404: Settings → Pages → Source **Deploy from a branch**, `main`, `/ (root)`, **Save**; verify the account email at github.com/settings/emails; check the **Actions** tab for a green "pages build and deployment".

---

## Links to share
| Use | Link |
|---|---|
| General / bio | `https://survey.winlucks.com/` |
| QR codes | `https://survey.winlucks.com/?src=qr` |
| WhatsApp | `https://survey.winlucks.com/?src=whatsapp` |
| Meta ads | `https://survey.winlucks.com/?src=meta` |
| Each field rep | `https://survey.winlucks.com/?rep=Ahmed` |
| Dashboard | `https://survey.winlucks.com/dashboard.html` (enter DASHBOARD_KEY) |

Referral links (`?ref=WLF-XXXXX`) are created automatically on the thank-you screen.

## What merchants get
Free registration as a Founding Merchant: a code (e.g. `WLF-7K2QX`), 2 months free at launch, featured badge, free setup help, plus a WhatsApp share button with their referral code. The same mobile number can't submit twice; it just shows their existing code.

## Bot protection
Turnstile (re-checked on the server) · hidden honeypot · minimum 15 seconds · real taps/typing · automated-browser check · UAE mobile format · one survey per mobile · max 80 per 10 minutes. Confirm Hot leads by WhatsApp before counting them.

---

## Meta Instant Form (same questions)
Form type **Higher intent** · privacy policy link required.
**Headline:** Boost your customers and online presence with Winlucks
**Intro (list):** UAE app that brings local customers to your shop · get discovered, promote offers, sell online without a website · shoppers earn rewards and WL Coins · free registration for Founding Merchants (2 months free + featured badge)
**Prefill:** Full name, Phone number, Company name
**Questions:** 1 Business type (+ "I don't run a business" → separate ending) · 2 Emirate · 3 Biggest challenge · 4 Pay platform commission? · 5 What would make you try Winlucks? · 6 Preferred payment model · 7 Join Winlucks as a merchant?
**Completion:** "Thank you! Our team will WhatsApp you your Founding Merchant code within 24 hours."
Filter out non-business, non-UAE numbers and duplicates; confirm leads by WhatsApp.
