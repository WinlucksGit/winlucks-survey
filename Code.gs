/**
 * Winlucks Merchant Survey — backend (Google Apps Script, free)
 *
 * POST  (from index.html)          → verifies the submission, saves it, returns a Founding Merchant code
 * GET   ?view=public               → totals and percentages only (shown to merchants after they submit)
 * GET   ?view=admin&key=YOUR_KEY   → full dashboard data incl. lead list (dashboard.html)
 *
 * Script properties (Project Settings → Script properties):
 *   TURNSTILE_SECRET  = Cloudflare Turnstile secret key
 *   DASHBOARD_KEY     = a long random password for the admin dashboard
 *
 * Bot checks done here (cannot be skipped by calling this URL directly):
 *   Turnstile token verified with Cloudflare · honeypot · minimum time · real taps/keys ·
 *   UAE mobile format · one survey per mobile number · burst rate limit
 */

const SHEET_OK = "Responses";
const SHEET_BAD = "Rejected";
const MIN_SECONDS = 15;
const MIN_INTERACTIONS = 5;
const MAX_PER_10_MIN = 80;

const FIELDS = ["business_name","category","emirate","area","biggest_challenge","pays_commission",
                "try_trigger","payment_model","interest_joining","contact_person","mobile"];
const HEADER = ["timestamp","code","lead","source","rep","referred_by","lang","elapsed_sec"].concat(FIELDS);

function doPost(e) {
  let p;
  try { p = JSON.parse(e.postData.contents); } catch (_) { return json({ ok: false, message: "Invalid request." }); }
  const a = p.answers || {};
  const s = p.signals || {};
  const reasons = [];

  if (p.hp) reasons.push("honeypot");
  if (!(p.elapsedSec >= MIN_SECONDS)) reasons.push("too_fast:" + p.elapsedSec);
  if (((s.keys || 0) + (s.pointer || 0)) < MIN_INTERACTIONS) reasons.push("no_interaction");
  const mobile = String(a.mobile || "").replace(/\D/g, "");
  if (!/^(971|0)?5\d{8}$/.test(mobile)) reasons.push("bad_mobile");
  if (!a.business_name || !a.contact_person || !a.category || !a.interest_joining) reasons.push("missing_required");

  const cache = CacheService.getScriptCache();
  const burst = Number(cache.get("burst") || 0) + 1;
  cache.put("burst", String(burst), 600);
  if (burst > MAX_PER_10_MIN) reasons.push("rate_limited");

  if (!reasons.length && !verifyTurnstile(p.turnstileToken)) reasons.push("turnstile_failed");

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ok = sheet(ss, SHEET_OK, HEADER);
    const norm = mobile.replace(/^(971|0)/, "");
    const existingCode = norm ? findCodeByMobile(ok, norm) : "";
    if (existingCode && !reasons.length) {
      // Same merchant again: don't save twice, just give their code back
      return json({ ok: true, code: existingCode, repeat: true, stats: publicStats(ok) });
    }
    if (reasons.length) {
      sheet(ss, SHEET_BAD, ["timestamp","reasons","elapsed_sec","signals","source","business_name","mobile"])
        .appendRow([new Date(), reasons.join(", "), p.elapsedSec, JSON.stringify(s), clean(p.source),
                    clean(a.business_name), clean(a.mobile)]);
      if (reasons.indexOf("honeypot") >= 0) return json({ ok: true, code: "WLF-" + randomCode() });
      if (reasons.indexOf("turnstile_failed") >= 0) return json({ ok: false, message: "" });
      return json({ ok: false, message: "" });
    }
    const code = "WLF-" + randomCode();
    const lead = { "Yes": "Hot", "Maybe — need more info": "Warm", "Not now": "Cold", "No": "Closed" }[a.interest_joining] || "";
    ok.appendRow([new Date(), code, lead, clean(p.source), clean(p.rep), clean(p.referredBy), clean(p.lang), p.elapsedSec]
      .concat(FIELDS.map(k => k === "mobile" ? "'" + String(a[k] || "").replace(/[^\d+ ]/g, "") : clean(a[k]))));  // keep leading 0
    return json({ ok: true, code: code, stats: publicStats(ok) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const view = (e.parameter.view || "public");
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ok = sheet(ss, SHEET_OK, HEADER);
  if (view === "admin") {
    const key = PropertiesService.getScriptProperties().getProperty("DASHBOARD_KEY");
    if (!key || e.parameter.key !== key) return json({ ok: false, message: "Wrong dashboard key." });
    return json(Object.assign({ ok: true }, adminStats(ss, ok)));
  }
  return json(Object.assign({ ok: true }, publicStats(ok)));
}

/* ---------- stats ---------- */
function rows(sh) {
  if (sh.getLastRow() < 2) return [];
  const v = sh.getRange(2, 1, sh.getLastRow() - 1, HEADER.length).getValues();
  return v.map(r => { const o = {}; HEADER.forEach((h, i) => o[h] = r[i]); return o; });
}
function countBy(list, k) { const o = {}; list.forEach(r => { const v = r[k] || "—"; o[v] = (o[v] || 0) + 1; }); return o; }

function publicStats(sh) {
  const r = rows(sh);
  return {
    total: r.length,
    wantJoin: r.filter(x => x.interest_joining === "Yes" || String(x.interest_joining).indexOf("Maybe") === 0).length,
    commissionTooHigh: r.filter(x => String(x.pays_commission).indexOf("too expensive") >= 0).length,
    challenge: countBy(r, "biggest_challenge")
  };
}

function adminStats(ss, sh) {
  const r = rows(sh);
  const bad = ss.getSheetByName(SHEET_BAD);
  const day = 24 * 3600 * 1000, now = Date.now();
  const byDay = {};
  r.forEach(x => { const d = Utilities.formatDate(new Date(x.timestamp), "Asia/Dubai", "yyyy-MM-dd"); byDay[d] = (byDay[d] || 0) + 1; });
  return {
    total: r.length,
    last7: r.filter(x => now - new Date(x.timestamp).getTime() < 7 * day).length,
    blocked: bad ? Math.max(0, bad.getLastRow() - 1) : 0,
    lead: countBy(r, "lead"),
    category: countBy(r, "category"),
    emirate: countBy(r, "emirate"),
    challenge: countBy(r, "biggest_challenge"),
    commission: countBy(r, "pays_commission"),
    trigger: countBy(r, "try_trigger"),
    payment: countBy(r, "payment_model"),
    source: countBy(r, "source"),
    byDay: byDay,
    leads: r.slice(-300).reverse().map(x => ({
      date: Utilities.formatDate(new Date(x.timestamp), "Asia/Dubai", "yyyy-MM-dd HH:mm"),
      code: x.code, lead: x.lead, business: x.business_name, category: x.category,
      emirate: x.emirate, area: x.area, name: x.contact_person, mobile: x.mobile,
      source: x.source, rep: x.rep, referredBy: x.referred_by
    }))
  };
}

/* ---------- helpers ---------- */
function verifyTurnstile(token) {
  if (!token) return false;
  const secret = PropertiesService.getScriptProperties().getProperty("TURNSTILE_SECRET");
  if (!secret) return false;
  const r = UrlFetchApp.fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "post", payload: { secret: secret, response: token }, muteHttpExceptions: true });
  try { const j = JSON.parse(r.getContentText()); return j.success === true; } catch (_) { return false; }
}
function findCodeByMobile(sh, norm) {
  if (sh.getLastRow() < 2) return "";
  const mCol = HEADER.indexOf("mobile") + 1, cCol = HEADER.indexOf("code") + 1;
  const n = sh.getLastRow() - 1;
  const mob = sh.getRange(2, mCol, n, 1).getValues(), code = sh.getRange(2, cCol, n, 1).getValues();
  for (let i = n - 1; i >= 0; i--) {
    if (String(mob[i][0]).replace(/\D/g, "").replace(/^(971|0)/, "") === norm) return code[i][0];
  }
  return "";
}
function randomCode() {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = "";
  for (let i = 0; i < 5; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}
function clean(v) { let s = v == null ? "" : String(v).slice(0, 300); if (/^[=+\-@]/.test(s)) s = "'" + s; return s; }
function sheet(ss, name, header) {
  let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); sh.appendRow(header); sh.setFrozenRows(1); }
  return sh;
}
function json(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
