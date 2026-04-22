// Edge function: sends support email to nicolas@hypertalent.me
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const TO   = "nicolas@hypertalent.me";
const FROM = "HyperHire Support <hello@hyperhire.io>";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*" } });
  }

  const { from_email, from_name, subject, message } = await req.json();
  if (!message?.trim()) return new Response("Missing message", { status: 400 });

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return new Response("RESEND_API_KEY not set", { status: 500 });

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:'Inter',sans-serif;color:#111110;">
<div style="max-width:520px;margin:40px auto;background:#FFFFFE;border:1px solid #E8E6DF;border-radius:12px;padding:36px 40px;">
  <div style="font-size:11px;font-weight:500;color:#9A9A90;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:16px;">Support request · HyperHire</div>
  <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;">${subject || "Support request"}</h2>
  <p style="margin:0 0 20px;font-size:13.5px;color:#3A3A35;line-height:1.65;">From: <strong>${from_name || "Unknown"}</strong> (${from_email || "no email"})</p>
  <div style="background:#F7F6F2;border-radius:8px;padding:16px 18px;font-size:13.5px;color:#111110;line-height:1.7;white-space:pre-wrap;">${message}</div>
</div>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      reply_to: from_email || undefined,
      subject: `[Support] ${subject || "New request"} — ${from_name || from_email}`,
      html,
    }),
  });

  const body = await res.json();
  return new Response(JSON.stringify(body), {
    status: res.ok ? 200 : 500,
    headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
  });
});
