// Edge function: fires when a recruiter's is_vetted flips to true
// Trigger: DB webhook on hh_recruiters UPDATE
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const APP_URL = "https://nicolashyper.github.io/hyperhire";
const FROM    = "HyperHire <hello@hyperhire.io>";

serve(async (req) => {
  const { record, old_record } = await req.json();

  // Only fire when is_vetted flips true
  if (!record?.is_vetted || old_record?.is_vetted === true) {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return new Response("RESEND_API_KEY not set", { status: 500 });

  const firstName = (record.name || "").split(" ")[0] || "there";

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:'Inter',sans-serif;color:#111110;">
<div style="max-width:520px;margin:40px auto;background:#FFFFFE;border:1px solid #E8E6DF;border-radius:12px;padding:36px 40px;">
  <div style="width:36px;height:36px;border-radius:9px;background:#111110;display:flex;align-items:center;justify-content:center;margin-bottom:24px;">
    <span style="color:#fff;font-weight:700;font-size:16px;">H</span>
  </div>
  <h2 style="margin:0 0 10px;font-size:20px;font-weight:700;letter-spacing:-0.02em;">You're approved, ${firstName}</h2>
  <p style="margin:0 0 20px;font-size:14px;color:#3A3A35;line-height:1.65;">
    Your HyperHire account is active. You now have access to all open roles and can start submitting candidates immediately.
  </p>
  <p style="margin:0 0 8px;font-size:13.5px;color:#6B6B63;">What to do next:</p>
  <ul style="margin:0 0 26px;padding-left:20px;font-size:13.5px;color:#3A3A35;line-height:1.8;">
    <li>Browse open roles and find strong matches in your network</li>
    <li>Submit a candidate with a 2–4 sentence pitch</li>
    <li>Earn $10,000 per successful hire</li>
  </ul>
  <a href="${APP_URL}" style="display:inline-block;background:#111110;color:#fff;text-decoration:none;padding:12px 22px;border-radius:7px;font-size:14px;font-weight:600;">
    Browse open roles →
  </a>
  <p style="margin:28px 0 0;font-size:12px;color:#9A9A90;">
    Questions? Reply to this email or reach us at nicolas@hypertalent.me
  </p>
</div>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [record.email],
      subject: `You're approved — start submitting candidates`,
      html,
    }),
  });

  const body = await res.json();
  return new Response(JSON.stringify(body), { status: res.ok ? 200 : 500 });
});
