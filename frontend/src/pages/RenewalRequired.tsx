import { useState } from "react";
import { api } from "../api";
import { useBranding } from "../BrandingContext";
import type { LicenseStatus } from "../types";

export function RenewalRequired({ status, onRecheck }: { status: LicenseStatus; onRecheck: () => Promise<void> }) {
  const { settings } = useBranding();
  const [checking, setChecking] = useState(false);

  async function handleRecheck() {
    setChecking(true);
    try {
      await onRecheck();
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
      <div className="bg-white rounded-2xl shadow-md border border-neutral-200 p-6 w-full max-w-sm space-y-4 text-center">
        {settings.logo_data_url ? (
          <img src={settings.logo_data_url} alt={settings.name} className="w-14 h-14 rounded-xl object-cover mx-auto" />
        ) : (
          <span className="text-4xl">🥡</span>
        )}

        <div>
          <h1 className="text-xl font-bold">Renewal Required</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Access to {status.app_name} has expired
            {status.renewal_date ? ` (was due ${new Date(status.renewal_date).toLocaleDateString()})` : ""}.
          </p>
        </div>

        {status.amount != null && (
          <>
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3">
              <div className="text-sm text-neutral-500">Renewal Amount</div>
              <div className="text-2xl font-bold text-brand-600">₹{status.amount}</div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="font-semibold text-sm">Scan to Pay via UPI</div>
              <img src={api.licenseQrUrl()} alt="UPI payment QR code" width={220} height={220} className="rounded-lg" />
            </div>
          </>
        )}

        <p className="text-xs text-neutral-400">
          Once payment is received and the renewal date is updated, tap below to regain access.
        </p>

        <button
          onClick={handleRecheck}
          disabled={checking}
          className="tap-target w-full py-3 rounded-xl bg-brand-500 text-white font-bold disabled:opacity-50"
        >
          {checking ? "Checking…" : "I've Paid — Recheck Access"}
        </button>
      </div>
    </div>
  );
}
