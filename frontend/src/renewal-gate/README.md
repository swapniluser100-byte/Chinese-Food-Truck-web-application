# renewal-gate

A portable renewal/paywall gate for any React app. Checks a shared,
publicly-shared Google Sheet for a `customerId`'s renewal status via the
standalone `renewal-service` Worker (deployed as **cf-relay-svc**), and
either renders your app normally or swaps in a full-screen "Renewal
Required" lock screen with a UPI QR code for the amount owed.

> **Naming note:** the backend Worker is intentionally deployed under a
> semantically-neutral name (`cf-relay-svc`, not `renewal-check-service` or
> anything containing "license"/"paywall"/"subscription"). Testing found
> that ad-blocker and anti-paywall filter lists silently drop requests
> (`ERR_BLOCKED_BY_CLIENT`) to subdomains that look like a licensing/paywall
> check — which, combined with this gate's fail-open design, would let a
> blocked client bypass the check entirely. Keep any Worker you deploy for
> this under an equally boring name.

## How it works

1. `renewal-service` (`../../../../renewal-service` in this repo, deployed
   as `cf-relay-svc.swapniluser100.workers.dev`) is a standalone Cloudflare
   Worker with no dependencies on any one app. It reads the spreadsheet
   fresh on every request and exposes:
   - `GET /status?customerId=XXX` → `{ active, renewal_date, amount, name, customer_id }`
   - `GET /qr?customerId=XXX` → a UPI QR code (SVG) for that customer's amount
2. `<RenewalGate>` (this folder) calls that service with the `customerId`
   you give it. If `active` is `false`, it renders the lock screen. Otherwise
   it renders `children` untouched — your app behaves exactly as if the gate
   weren't there ("sends nothing back").
3. It fails open: while the check is loading, or if the service is
   unreachable, your app renders normally. Only a confirmed "expired"
   response locks it.

## Using it in another app

Copy this whole folder (`RenewalGate.tsx`, `RenewalRequired.tsx`,
`types.ts`) into your app's `src/`. No dependencies beyond React 18+ and
`fetch` — styling is plain inline styles, so it doesn't require Tailwind or
any particular CSS setup.

Wrap your app root with it, above your router if you have one, so every
route is covered:

```tsx
import { RenewalGate } from "./renewal-gate/RenewalGate";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <RenewalGate
    apiBase="https://cf-relay-svc.swapniluser100.workers.dev"
    customerId="YOUR_APP_ID_HERE" // this app's row key in the shared spreadsheet
    appName="Your App Name"
    logoUrl="/logo.png" // optional
    supportEmail="sitepragati@gmail.com"
  >
    <App />
  </RenewalGate>
);
```

To onboard a new app: add a row to the shared spreadsheet with a fresh,
unique `customerId` (any string works — it's just a lookup key), a `Name`,
and a `Next Renewal Date`, then use that `customerId` when wrapping the new
app. No changes needed to the service itself.

## Deploying your own copy of the service

If you don't want to share the vendor's existing instance, deploy your own
copy of `renewal-service/` (see its own setup — it needs `SHEET_ID` as a var
and `RENEWAL_UPI_ID` / `RENEWAL_UPI_PAYEE_NAME` as secrets) under a name of
your choosing (see the naming note above) and point `apiBase` at your
deployment instead.
