import { useCallback, useEffect, useState, type ReactNode } from "react";
import { api } from "./api";
import type { LicenseStatus } from "./types";
import { RenewalRequired } from "./pages/RenewalRequired";

// Gates the entire app behind a renewal check against the vendor's
// spreadsheet. Fails open (renders children) while loading or if the check
// itself errors, so a network hiccup never bricks the app for its own sake —
// only an explicit, confirmed "expired" response locks it.
export function LicenseGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LicenseStatus | null>(null);

  const check = useCallback(async () => {
    try {
      const result = await api.getLicenseStatus();
      setStatus(result);
    } catch {
      setStatus({ active: true, renewal_date: null, amount: null, app_name: "", app_id: "" });
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  if (status && !status.active) {
    return <RenewalRequired status={status} onRecheck={check} />;
  }

  return <>{children}</>;
}
