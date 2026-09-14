import { Hono } from "hono";
import type { Env } from "../types";
import { DEFAULT_SETTINGS } from "./settings";
import { buildUpiUri, renderQrSvg } from "../qr";

export const licenseRoutes = new Hono<{ Bindings: Env }>();

// Minimal RFC4180-ish CSV parser — handles quoted fields with embedded
// commas/newlines and doubled-quote escaping, which is all Google's CSV
// export needs (e.g. the Name column here wraps onto a second line).
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\r") {
      // skip — newline handled on \n
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function parseDDMMYYYY(s: string): Date | null {
  const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
  return Number.isNaN(date.getTime()) ? null : date;
}

interface LicenseRow {
  name: string;
  renewalDate: Date;
  amount: number;
}

// Fetches (and briefly caches) the public renewal-tracking sheet, then finds
// the row for this deployment's app_id. Cached for 5 minutes via the Workers
// Cache API so routine page loads don't hammer Google Sheets.
async function fetchLicenseRow(env: Env): Promise<LicenseRow | null> {
  const cache = caches.default;
  const cacheKey = new Request(`https://cache.internal/license-sheet/${env.SHEET_ID}`);

  let csvText: string;
  const cached = await cache.match(cacheKey);
  if (cached) {
    csvText = await cached.text();
  } else {
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${env.SHEET_ID}/export?format=csv`);
    if (!res.ok) throw new Error(`Sheet fetch failed (${res.status})`);
    csvText = await res.text();
    await cache.put(cacheKey, new Response(csvText, { headers: { "Cache-Control": "max-age=300" } }));
  }

  const rows = parseCsv(csvText);
  if (rows.length === 0) return null;

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idIdx = header.findIndex((h) => h.includes("customer id"));
  const nameIdx = header.findIndex((h) => h === "name");
  const dateIdx = header.findIndex((h) => h.includes("renewal date"));
  const amountIdx = header.findIndex((h) => h.includes("amount"));
  if (idIdx === -1 || dateIdx === -1 || amountIdx === -1) return null;

  const settingsRow = await env.DB.prepare("SELECT app_id FROM settings WHERE id = 1").first<{ app_id: string }>();
  const appId = settingsRow?.app_id ?? DEFAULT_SETTINGS.app_id;

  for (const cols of rows.slice(1)) {
    if ((cols[idIdx] ?? "").trim() === appId) {
      const renewalDate = parseDDMMYYYY(cols[dateIdx] ?? "");
      const amount = Number((cols[amountIdx] ?? "").trim());
      if (!renewalDate || !Number.isFinite(amount)) return null;
      return { name: (cols[nameIdx] ?? "").trim(), renewalDate, amount };
    }
  }
  return null;
}

function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

// GET /api/license/status — public. Whether this deployment's renewal is
// current, per the vendor's spreadsheet. Fails open (active: true) if the
// sheet is unreachable or this app_id has no row, rather than locking staff
// out of their own ordering tool over a transient Google outage.
licenseRoutes.get("/status", async (c) => {
  const settingsRow = await c.env.DB.prepare("SELECT app_name, app_id FROM settings WHERE id = 1").first<{
    app_name: string;
    app_id: string;
  }>();
  const app_name = settingsRow?.app_name ?? DEFAULT_SETTINGS.app_name;
  const app_id = settingsRow?.app_id ?? DEFAULT_SETTINGS.app_id;

  try {
    const row = await fetchLicenseRow(c.env);
    if (!row) {
      return c.json({ active: true, renewal_date: null, amount: null, app_name, app_id });
    }
    const active = row.renewalDate.getTime() >= todayUTC().getTime();
    return c.json({ active, renewal_date: row.renewalDate.toISOString().slice(0, 10), amount: row.amount, app_name, app_id });
  } catch {
    return c.json({ active: true, renewal_date: null, amount: null, app_name, app_id });
  }
});

// GET /api/license/qr — public. UPI QR for the renewal amount, paid to the vendor's UPI ID.
licenseRoutes.get("/qr", async (c) => {
  if (!c.env.RENEWAL_UPI_ID) return c.json({ error: "RENEWAL_UPI_ID is not configured on the server" }, 500);

  const row = await fetchLicenseRow(c.env);
  if (!row || !row.amount) return c.json({ error: "No renewal amount found" }, 404);

  const settingsRow = await c.env.DB.prepare("SELECT app_id FROM settings WHERE id = 1").first<{ app_id: string }>();
  const app_id = settingsRow?.app_id ?? DEFAULT_SETTINGS.app_id;

  const uri = buildUpiUri({
    upiId: c.env.RENEWAL_UPI_ID,
    payeeName: c.env.RENEWAL_UPI_PAYEE_NAME || "App Renewal",
    amount: row.amount,
    note: `Renewal ${app_id}`,
  });
  const svg = renderQrSvg(uri, 320);
  return c.body(svg, 200, { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" });
});
