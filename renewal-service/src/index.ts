import { Hono } from "hono";
import { cors } from "hono/cors";
import { buildUpiUri, renderQrSvg } from "./qr";

interface Env {
  SHEET_ID: string;
  RENEWAL_UPI_ID: string;
  RENEWAL_UPI_PAYEE_NAME: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use(
  "/*",
  cors({
    origin: "*", // any client app is expected to call this from its own origin
    allowMethods: ["GET", "OPTIONS"],
  })
);

// Minimal RFC4180-ish CSV parser — handles quoted fields with embedded
// commas/newlines and doubled-quote escaping.
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

function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

interface CustomerRow {
  name: string;
  renewalDate: Date;
  amount: number;
}

// Fetches the public renewal-tracking sheet fresh on every call (no caching —
// a stale renewal date is a real, confusing bug) and finds the row for the
// given customerId.
async function fetchCustomerRow(env: Env, customerId: string): Promise<CustomerRow | null> {
  const res = await fetch(`https://docs.google.com/spreadsheets/d/${env.SHEET_ID}/export?format=csv`, {
    cf: { cacheTtl: 0, cacheEverything: false },
  });
  if (!res.ok) throw new Error(`Sheet fetch failed (${res.status})`);
  const csvText = await res.text();

  const rows = parseCsv(csvText);
  if (rows.length === 0) return null;

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idIdx = header.findIndex((h) => h.includes("customer id"));
  const nameIdx = header.findIndex((h) => h === "name");
  const dateIdx = header.findIndex((h) => h.includes("renewal date"));
  const amountIdx = header.findIndex((h) => h.includes("amount"));
  if (idIdx === -1 || dateIdx === -1 || amountIdx === -1) return null;

  for (const cols of rows.slice(1)) {
    if ((cols[idIdx] ?? "").trim() === customerId) {
      const renewalDate = parseDDMMYYYY(cols[dateIdx] ?? "");
      const amount = Number((cols[amountIdx] ?? "").trim());
      if (!renewalDate || !Number.isFinite(amount)) return null;
      return { name: (cols[nameIdx] ?? "").trim(), renewalDate, amount };
    }
  }
  return null;
}

app.get("/health", (c) => c.json({ ok: true, time: new Date().toISOString() }));

// GET /status?customerId=XXX — public. Any client app calls this with its own
// customerId (the row key in the shared renewal-tracking sheet). Fails open
// (active: true) if the sheet is unreachable or the customerId has no row,
// so a transient Google outage or a missing row never bricks a client app.
app.get("/status", async (c) => {
  const customerId = c.req.query("customerId");
  if (!customerId) return c.json({ error: "customerId query parameter is required" }, 400);

  try {
    const row = await fetchCustomerRow(c.env, customerId);
    if (!row) {
      return c.json({ active: true, renewal_date: null, amount: null, name: null, customer_id: customerId });
    }
    const active = row.renewalDate.getTime() >= todayUTC().getTime();
    return c.json({
      active,
      renewal_date: row.renewalDate.toISOString().slice(0, 10),
      amount: row.amount,
      name: row.name,
      customer_id: customerId,
    });
  } catch {
    return c.json({ active: true, renewal_date: null, amount: null, name: null, customer_id: customerId });
  }
});

// GET /qr?customerId=XXX — public. UPI QR for that customer's renewal amount,
// paid to the vendor's collection UPI ID.
app.get("/qr", async (c) => {
  const customerId = c.req.query("customerId");
  if (!customerId) return c.json({ error: "customerId query parameter is required" }, 400);
  if (!c.env.RENEWAL_UPI_ID) return c.json({ error: "RENEWAL_UPI_ID is not configured on the server" }, 500);

  const row = await fetchCustomerRow(c.env, customerId);
  if (!row || !row.amount) return c.json({ error: "No renewal amount found for that customerId" }, 404);

  const uri = buildUpiUri({
    upiId: c.env.RENEWAL_UPI_ID,
    payeeName: c.env.RENEWAL_UPI_PAYEE_NAME || "App Renewal",
    amount: row.amount,
    note: `Renewal ${customerId}`,
  });
  const svg = renderQrSvg(uri, 320);
  return c.body(svg, 200, { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" });
});

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
