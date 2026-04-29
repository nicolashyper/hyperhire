// Edge function: fires when a recruiter's is_vetted flips to true
// Trigger: DB webhook on hh_recruiters UPDATE
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const APP_URL  = "https://hire.hypertalent.me";
const LOGO_URL = "https://hire.hypertalent.me/assets/logo-icon.png";
const FROM     = "HyperHire <onboarding@resend.dev>";

serve(async (req) => {
  const { record, old_record } = await req.json();

  if (!record?.is_vetted || old_record?.is_vetted === true) {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return new Response("RESEND_API_KEY not set", { status: 500 });

  const firstName = (record.name || "").split(" ")[0] || "there";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111110;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FAFAF7;padding:40px 16px;">
  <tr><td align="center">
    <table role="presentation" width="520" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;background:#FFFFFE;border:1px solid #E8E6DF;border-radius:12px;">
      <tr><td style="padding:36px 40px 32px;">
        <img src="${LOGO_URL}" alt="HyperHire" width="120" height="auto" style="display:block;height:auto;width:120px;margin-bottom:28px;border:0;outline:none;text-decoration:none;" />
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#111110;line-height:1.3;">You're approved, ${firstName} 🎉</h1>
        <p style="margin:0 0 24px;font-size:14.5px;color:#3A3A35;line-height:1.65;">
          Your HyperHire account is active. You now have access to all open roles and can start submitting candidates immediately.
        </p>
        <p style="margin:0 0 10px;font-size:13.5px;color:#6B6B63;font-weight:500;">What to do next:</p>
        <ul style="margin:0 0 28px;padding-left:18px;font-size:13.5px;color:#3A3A35;line-height:1.8;">
          <li>Browse open roles and find strong matches in your network</li>
          <li>Submit a candidate with a 2–4 sentence pitch</li>
          <li>Earn <strong>$10,000</strong> per successful hire</li>
        </ul>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
          <tr><td style="background:#111110;border-radius:8px;">
            <a href="${APP_URL}" style="display:inline-block;color:#FFFFFF;text-decoration:none;padding:13px 26px;font-size:14px;font-weight:600;font-family:inherit;">Browse open roles →</a>
          </td></tr>
        </table>
        <p style="margin:32px 0 0;font-size:12px;color:#9A9A90;line-height:1.6;border-top:1px solid #F0EEE7;padding-top:20px;">
          Questions? Reply to this email or reach us at <a href="mailto:nicolas@hypertalent.me" style="color:#1F514C;text-decoration:none;">nicolas@hypertalent.me</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
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
