import type { ReactNode } from "react";
import { RenewalGate } from "./reusable-components/renewal-gate/RenewalGate";
import { useBranding } from "./BrandingContext";

// Bridges this app's own branding (logo/name, from BrandingContext) into the
// portable, app-agnostic <RenewalGate>. Any other app reuses RenewalGate
// directly with its own values — see reusable-components/renewal-gate/README.md.
//
// `reusable-components` is a git submodule pointing at
// github.com/sitepragati-arch/Reusable-Components, pinned to a specific
// commit. To update to a newer version of the component:
//   git submodule update --remote frontend/src/reusable-components
//   git add frontend/src/reusable-components && git commit -m "..."
// A fresh clone of this repo needs `git submodule update --init --recursive`
// once before `npm run dev`/`build` will find these files.
//
// The service's deployed name deliberately avoids words like "renewal" or
// "license" in its subdomain — testing showed that name shape gets silently
// dropped by ad-blocker/paywall-blocking filter lists (ERR_BLOCKED_BY_CLIENT
// in Chrome), which combined with the gate's fail-open design would let a
// blocked client bypass the check entirely.
const RENEWAL_API_BASE = "https://cf-relay-svc.swapniluser100.workers.dev";
const CUSTOMER_ID = "ahJAFDCZT8Z51ms";
const SUPPORT_EMAIL = "sitepragati@gmail.com";

export function AppRenewalGate({ children }: { children: ReactNode }) {
  const { settings } = useBranding();

  return (
    <RenewalGate
      apiBase={RENEWAL_API_BASE}
      customerId={CUSTOMER_ID}
      appName={settings.app_name}
      logoUrl={settings.logo_data_url ?? undefined}
      supportEmail={SUPPORT_EMAIL}
    >
      {children}
    </RenewalGate>
  );
}
