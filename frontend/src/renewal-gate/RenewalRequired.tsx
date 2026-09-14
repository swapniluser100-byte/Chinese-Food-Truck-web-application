import { useState, type CSSProperties } from "react";
import type { RenewalStatus } from "./types";

interface Props {
  status: RenewalStatus;
  qrUrl: string;
  onRecheck: () => Promise<void>;
  appLabel: string;
  logoUrl?: string;
  supportEmail: string;
}

// Plain inline styles (no Tailwind/CSS framework dependency) so this drops
// into any React app unmodified.
const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f5f5",
    padding: 16,
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    border: "1px solid #e5e5e5",
    padding: 24,
    width: "100%",
    maxWidth: 384,
    textAlign: "center",
  },
  logo: { width: 56, height: 56, borderRadius: 12, objectFit: "cover", margin: "0 auto" },
  title: { fontSize: 20, fontWeight: 700, margin: "16px 0 4px" },
  subtitle: { fontSize: 14, color: "#737373", margin: 0 },
  amountBox: { background: "#fafafa", border: "1px solid #e5e5e5", borderRadius: 12, padding: 12, margin: "16px 0" },
  amountLabel: { fontSize: 14, color: "#737373" },
  amountValue: { fontSize: 24, fontWeight: 700, color: "#c2410c" },
  qrLabel: { fontWeight: 600, fontSize: 14, marginBottom: 8 },
  qrImg: { borderRadius: 8 },
  note: { fontSize: 13, color: "#525252", margin: "16px 0", lineHeight: 1.5 },
  button: {
    width: "100%",
    padding: "12px 0",
    borderRadius: 12,
    background: "#e8402a",
    color: "#fff",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    fontSize: 15,
  },
  buttonDisabled: { opacity: 0.5, cursor: "default" },
};

export function RenewalRequired({ status, qrUrl, onRecheck, appLabel, logoUrl, supportEmail }: Props) {
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
    <div style={styles.page}>
      <div style={styles.card}>
        {logoUrl ? <img src={logoUrl} alt={appLabel} style={styles.logo} /> : <span style={{ fontSize: 40 }}>🔒</span>}

        <h1 style={styles.title}>Renewal Required</h1>
        <p style={styles.subtitle}>
          Access to {appLabel} has expired
          {status.renewal_date ? ` (was due ${new Date(status.renewal_date).toLocaleDateString()})` : ""}.
        </p>

        {status.amount != null && (
          <>
            <div style={styles.amountBox}>
              <div style={styles.amountLabel}>Renewal Amount</div>
              <div style={styles.amountValue}>₹{status.amount}</div>
            </div>

            <div>
              <div style={styles.qrLabel}>Scan to Pay via UPI</div>
              <img src={qrUrl} alt="UPI payment QR code" width={220} height={220} style={styles.qrImg} />
            </div>
          </>
        )}

        <p style={styles.note}>
          Once payment is made send payment screenshot to {supportEmail} and system will verify the payment and
          resume your access shortly.
        </p>

        <button
          onClick={handleRecheck}
          disabled={checking}
          style={{ ...styles.button, ...(checking ? styles.buttonDisabled : {}) }}
        >
          {checking ? "Checking…" : "I've Paid — Recheck Access"}
        </button>
      </div>
    </div>
  );
}
