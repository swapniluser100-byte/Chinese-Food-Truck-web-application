# Chinese Food Truck — Order System

A mobile-first ordering system for a Chinese food truck in Pune: Staff app (order
taking + UPI QR + delivery), Kitchen app (preparation queue), and an Admin
Portal (menu, rates, availability, reports). Backend runs on Cloudflare
Workers + D1; frontend is a single React app deployed to Cloudflare Pages.

## Project structure

```
chinese-food-truck/
├── worker/                    Cloudflare Workers API
│   ├── src/
│   │   ├── index.ts           Hono app, CORS, routing, error handling
│   │   ├── auth.ts            Admin login token (HMAC-signed, stateless)
│   │   ├── qr.ts              UPI URI builder + server-side SVG QR renderer
│   │   ├── types.ts           Shared types (Env, MenuItem, Order)
│   │   └── routes/
│   │       ├── menu.ts        GET /api/menu, /top, /search, /:id
│   │       ├── orders.ts      POST /api/orders, QR, start-preparation, complete
│   │       ├── kitchen.ts     GET /api/kitchen/orders, POST .../ready
│   │       └── admin.ts       login, menu CRUD, orders, summary, CSV export
│   ├── schema.sql              D1 table definitions
│   ├── seed.sql                20 sample menu items
│   └── wrangler.toml
│
└── frontend/                  React + Vite + Tailwind (Cloudflare Pages)
    └── src/
        ├── api.ts             Typed fetch client for the Worker API
        ├── pages/staff/       Home (top-10 + search), Order (QR flow), Active Orders
        ├── pages/kitchen/     Kitchen preparation queue
        └── pages/admin/       Login, Menu Manager, Orders, Reports/Summary
```

## How the order flow works

1. **Staff Home** (`/staff`) — top 10 items (`top_item = 1`) as big image buttons,
   plus a search box for the rest of the menu (by name or category).
2. **Order page** (`/staff/order/:menuItemId`) — menu image at top, optional
   customer name, quantity stepper with live price calc, **Save Order** creates
   the order (`status = pending_payment`) and reveals a UPI QR code sized to the
   order total. Staff ticks "Payment received" once the customer has paid, then
   **Start Preparation** sends the order to the kitchen (`status = in_kitchen`).
3. **Kitchen** (`/kitchen`) — polls for `in_kitchen` orders, big **Mark Ready**
   button sets `status = ready`.
4. **Active Orders** (`/staff/orders`) — staff see pending/in-kitchen/ready
   orders; a **Complete** button on ready orders sets `status = completed` and
   hands the order to the customer.
5. **Admin Portal** (`/admin`) — password-protected: menu CRUD (rate,
   availability, top-10 flag), all-orders view with date/status filters, a daily
   sales summary, and CSV export.

## Local development

### 1. Worker (API + D1)

```bash
cd worker
npm install
npm run db:migrate:local
npm run db:seed:local
```

Create `worker/.dev.vars` (already gitignored) with local secrets:

```
ADMIN_PASSWORD=choose-a-password
TOKEN_SECRET=any-long-random-string
UPI_ID=yourtruck@okhdfcbank
```

```bash
npm run dev
# Worker API now running at http://127.0.0.1:8787
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# App running at http://localhost:5173 — /api requests are proxied to the Worker
```

Open `http://localhost:5173/staff`, `/kitchen`, and `/admin` in separate tabs
(or on separate devices/tablets on the truck).

## Deploying to Cloudflare

### 1. Create the D1 database

```bash
cd worker
npx wrangler d1 create chinese_food_truck
```

Copy the returned `database_id` into `worker/wrangler.toml` under
`[[d1_databases]]`, replacing `REPLACE_WITH_YOUR_D1_DATABASE_ID`.

### 2. Run migrations against the real (remote) database

```bash
npm run db:migrate:remote
npm run db:seed:remote
```

### 3. Set Worker secrets

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put TOKEN_SECRET
npx wrangler secret put UPI_ID
```

- `ADMIN_PASSWORD` — password staff use to sign into the Admin Portal.
- `TOKEN_SECRET` — long random string used to sign admin session tokens
  (e.g. output of `openssl rand -hex 32`).
- `UPI_ID` — the truck's UPI VPA, e.g. `foodtruck@okhdfcbank`.

Optionally override the display name shown in the UPI app by editing
`UPI_PAYEE_NAME` under `[vars]` in `wrangler.toml`.

### 4. Deploy the Worker

```bash
npm run deploy
```

Note the deployed URL, e.g. `https://chinese-food-truck-api.<your-subdomain>.workers.dev`.

### 5. Deploy the frontend to Cloudflare Pages

```bash
cd ../frontend
```

Create `frontend/.env.production` (or set a Pages environment variable) with:

```
VITE_API_BASE=https://chinese-food-truck-api.<your-subdomain>.workers.dev
```

Then either connect the `frontend/` directory to Cloudflare Pages via the
dashboard (build command `npm run build`, output directory `dist`), or deploy
directly:

```bash
npm run build
npx wrangler pages deploy dist --project-name=chinese-food-truck
```

`public/_redirects` is already set up so client-side routes
(`/staff`, `/kitchen`, `/admin`, …) work on refresh.

### 6. Add real menu photos (optional)

Drop JPGs into `frontend/public/menu-images/`, named by each item's
`image_ref_id` (e.g. `turn0image0.jpg`), and redeploy. Items without a photo
automatically show a colored category placeholder instead — the app never
shows a broken image.

## API reference

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/menu` | — | All available menu items |
| GET | `/api/menu/top` | — | Top 10 items |
| GET | `/api/menu/search?q=` | — | Search by name/category |
| POST | `/api/orders` | — | Create order (`pending_payment`) |
| GET | `/api/orders/:id/qr` | — | UPI QR code (SVG) for the order total |
| POST | `/api/orders/:id/start-preparation` | — | Send to kitchen (`in_kitchen`) |
| POST | `/api/orders/:id/complete` | — | Hand over to customer (`completed`) |
| GET | `/api/kitchen/orders` | — | Orders currently `in_kitchen` |
| POST | `/api/kitchen/orders/:id/ready` | — | Mark an order `ready` |
| POST | `/api/admin/login` | — | Exchange password for a session token |
| GET/POST/PUT/DELETE | `/api/admin/menu` | Bearer token | Menu CRUD |
| GET | `/api/admin/orders?date=&status=` | Bearer token | Filtered order list |
| GET | `/api/admin/summary?date=` | Bearer token | Daily totals + breakdowns |
| GET | `/api/admin/export?date=` | Bearer token | CSV export |

All write endpoints use D1 prepared statements with bound parameters. CORS is
open (`*`) since the Staff/Kitchen/Admin apps are trusted internal tools; the
Admin API is the only protected surface, gated by an HMAC-signed bearer token.
