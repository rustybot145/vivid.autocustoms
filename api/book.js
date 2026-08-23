/* Booking request -> email. Vercel serverless, no dependencies.
   Needs RESEND_API_KEY in the project's environment variables.
   BOOKING_TO / BOOKING_FROM are optional overrides. */

const TO = process.env.BOOKING_TO || "vividcustomsaz@gmail.com";
// resend.dev only delivers to the Resend account's own address. Once
// vividautocustoms.com is verified in Resend, set BOOKING_FROM to
// "Vivid Customs <bookings@vividautocustoms.com>" and it sends from there.
const FROM = process.env.BOOKING_FROM || "Vivid Customs <onboarding@resend.dev>";

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (!process.env.RESEND_API_KEY) return res.status(500).json({ error: "Email isn't configured yet." });

  const { name = "", rows = [], attachments = [], replyTo = "", website = "" } = req.body || {};
  if (website) return res.status(200).json({ ok: true }); // honeypot: bots fill it, people can't see it
  if (!Array.isArray(rows) || !rows.length) return res.status(400).json({ error: "Nothing to send." });

  const files = (Array.isArray(attachments) ? attachments : [])
    .slice(0, 3)
    .filter((a) => a && typeof a.content === "string" && a.content.length < 3e6)
    .map((a) => ({ filename: String(a.filename || "logo.jpg").slice(0, 60), content: a.content }));

  const table = rows
    .slice(0, 40)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 16px 8px 0;color:#888;font:600 11px/1.4 system-ui;text-transform:uppercase;letter-spacing:.1em;white-space:nowrap;vertical-align:top">${esc(
          k
        ).slice(0, 60)}</td><td style="padding:8px 0;font:15px/1.5 system-ui;color:#111">${esc(v).slice(0, 800)}</td></tr>`
    )
    .join("");

  const sent = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: TO,
      subject: `Booking request — ${String(name).slice(0, 60) || "no name given"}`,
      ...(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(replyTo) ? { reply_to: replyTo } : {}),
      html: `<div style="max-width:640px"><h2 style="font:600 18px system-ui;color:#111">New booking request</h2><table cellpadding="0" cellspacing="0">${table}</table>${
        files.length ? `<p style="font:13px system-ui;color:#888">${files.length} logo reference attached.</p>` : ""
      }</div>`,
      ...(files.length ? { attachments: files } : {}),
    }),
  });

  if (!sent.ok) {
    console.error("resend", sent.status, await sent.text());
    return res.status(502).json({ error: "Mail service rejected it." });
  }
  return res.status(200).json({ ok: true });
};
