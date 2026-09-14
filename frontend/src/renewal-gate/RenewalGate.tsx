import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { RenewalStatus } from "./types";
import { RenewalRequired } from "./RenewalRequired";

export interface RenewalGateProps {
  /** Base URL of the shared renewal-check service, e.g. "https://cf-relay-svc.<account>.workers.dev" */
  apiBase: string;
  /** This app's row key in the vendor's renewal-tracking spreadsheet */
  customerId: string;
  /** Shown on the lock screen; falls back to the "Name" column from the sheet, then to customerId */
  appName?: string;
  /** Optional logo shown on the lock screen */
  logoUrl?: string;
  /** Where staff should send a payment screenshot for manual verification */
  supportEmail: string;
  children: ReactNode;
}

// Drop this in at the root of any app to gate it behind a renewal check
// against the shared spreadsheet, identified by `customerId`. If the
// customerId's renewal is current (or the check can't be completed — see
// below), it renders `children` untouched, i.e. "sends nothing back" and the
// host app behaves exactly as it would without this wrapper. Only a
// confirmed "expired" response swaps in the lock screen.
//
// Fails open: while the check is in flight, and if it errors, `children`
// render normally — a network hiccup against the shared service should never
// brick a host app on its own.
export function RenewalGate({ apiBase, customerId, appName, logoUrl, supportEmail, children }: RenewalGateProps) {
  const [status, setStatus] = useState<RenewalStatus | null>(null);
  const base = apiBase.replace(/\/$/, "");

  const check = useCallback(async () => {
    try {
      const res = await fetch(`${base}/status?customerId=${encodeURIComponent(customerId)}`);
      if (!res.ok) throw new Error(`Renewal check failed (${res.status})`);
      const result: RenewalStatus = await res.json();
      setStatus(result);
    } catch {
      setStatus({ active: true, renewal_date: null, amount: null, name: null, customer_id: customerId });
    }
  }, [base, customerId]);

  useEffect(() => {
    check();
  }, [check]);

  if (status && !status.active) {
    return (
      <RenewalRequired
        status={status}
        qrUrl={`${base}/qr?customerId=${encodeURIComponent(customerId)}`}
        onRecheck={check}
        appLabel={appName || status.name || customerId}
        logoUrl={logoUrl}
        supportEmail={supportEmail}
      />
    );
  }

  return <>{children}</>;
}
