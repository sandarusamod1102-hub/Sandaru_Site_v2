// Vercel serverless function: forwards the pairing request to your bot panel.
// Change PANEL_PAIR_URL below if your panel address changes
// (or set BACKEND_PAIR_URL in Vercel > Settings > Environment Variables).
const PANEL_PAIR_URL = "http://kod.publicvm.com:2888/api/pair";

export default async function handler(req, res) {
  const number = String(req.query.number || "").replace(/\D/g, "");
  if (!/^\d{10,15}$/.test(number)) {
    return res.status(400).json({ error: "Invalid WhatsApp number. Use country code without + (e.g. 947XXXXXXXX)." });
  }

  const base = process.env.BACKEND_PAIR_URL || PANEL_PAIR_URL;
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 50000);

  try {
    const upstream = await fetch(`${base}?number=${number}`, {
      headers: ip ? { "x-forwarded-for": ip } : {},
      signal: ctrl.signal
    });
    const data = await upstream.json();
    res.setHeader("Cache-Control", "no-store");
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: "Bot server is offline right now. Try again later." });
  } finally {
    clearTimeout(timer);
  }
}
