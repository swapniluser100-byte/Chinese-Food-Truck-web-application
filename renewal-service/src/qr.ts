import qrcodegen from "qrcode-generator";

// Builds a standard UPI deep-link payment string.
// Reference: upi://pay?pa=<vpa>&pn=<name>&am=<amount>&cu=INR&tn=<note>
export function buildUpiUri(opts: { upiId: string; payeeName: string; amount: number; note: string }): string {
  const params = new URLSearchParams({
    pa: opts.upiId,
    pn: opts.payeeName,
    am: opts.amount.toFixed(2),
    cu: "INR",
    tn: opts.note,
  });
  return `upi://pay?${params.toString()}`;
}

// Renders a QR code as an SVG string — pure JS, no canvas, works in Workers.
export function renderQrSvg(data: string, size = 320): string {
  const qr = qrcodegen(0, "M");
  qr.addData(data);
  qr.make();
  const moduleCount = qr.getModuleCount();
  const cell = size / moduleCount;
  let path = "";
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (qr.isDark(row, col)) {
        const x = col * cell;
        const y = row * cell;
        path += `M${x},${y}h${cell}v${cell}h${-cell}z`;
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">` +
    `<rect width="${size}" height="${size}" fill="#ffffff"/>` +
    `<path d="${path}" fill="#000000"/>` +
    `</svg>`;
}
