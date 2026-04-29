// Edge function: fires when a submission status changes
// Trigger: DB webhook on hh_submissions UPDATE
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const APP_URL  = "https://hire.hypertalent.me";
const FROM     = "HyperHire <onboarding@resend.dev>";

const STATUS_COPY: Record<string, { subject: string; headline: string; body: string; badgeBg: string; badgeText: string; badgeLabel: string }> = {
  Interviewing: {
    subject: "Your candidate is interviewing 🎉",
    headline: "They're in the interview process",
    body: "The hiring team liked what they saw — your candidate has been moved to the interview stage.",
    badgeBg: "#FEF3C7",
    badgeText: "#92400E",
    badgeLabel: "Interviewing",
  },
  Hired: {
    subject: "Placement confirmed — your fee is processing 💰",
    headline: "Congratulations — they got the job",
    body: "Your candidate was hired. Your $10,000 placement fee will be processed after the 2-month guarantee period.",
    badgeBg: "#D1FAE5",
    badgeText: "#166534",
    badgeLabel: "Hired",
  },
  Rejected: {
    subject: "Update on your candidate submission",
    headline: "The team passed on this one",
    body: "The hiring team decided not to move forward with this candidate for this role. This doesn't reflect on you — keep submitting.",
    badgeBg: "#FEE2E2",
    badgeText: "#991B1B",
    badgeLabel: "Not moving forward",
  },
};

serve(async (req) => {
  const { record, old_record } = await req.json();

  if (!record?.status || record.status === old_record?.status) {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }
  const copy = STATUS_COPY[record.status];
  if (!copy || !record.recruiter_email) {
    return new Response(JSON.stringify({ skipped: true }), { status: 200 });
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) return new Response("RESEND_API_KEY not set", { status: 500 });

  const sb = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
  const { data: job } = await sb.from("hh_jobs").select("title, company_name").eq("id", record.job_id).maybeSingle();
  const roleLabel = job ? `${job.title} · ${job.company_name}` : "the role";

  const rejectionNote = record.rejection_note
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:18px 0 0;background:#FEF2F2;border-radius:8px;">
        <tr><td style="padding:14px 16px;font-size:13px;color:#991B1B;line-height:1.6;">
          <strong>Feedback from the hiring team:</strong><br/>${record.rejection_note}
        </td></tr>
      </table>`
    : "";

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111110;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#FAFAF7;padding:40px 16px;">
  <tr><td align="center">
    <table role="presentation" width="520" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;background:#FFFFFE;border:1px solid #E8E6DF;border-radius:12px;">
      <tr><td style="padding:36px 40px 32px;">
        <div style="font-size:18px;font-weight:700;letter-spacing:-0.02em;color:#111110;margin-bottom:28px;">HyperHire</div>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:14px;">
          <tr><td style="background:${copy.badgeBg};border-radius:999px;padding:5px 12px;">
            <span style="font-size:11.5px;font-weight:600;color:${copy.badgeText};text-transform:uppercase;letter-spacing:0.04em;">${copy.badgeLabel}</span>
          </td></tr>
        </table>

        <div style="font-size:11.5px;font-weight:500;color:#9A9A90;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px;">${roleLabel}</div>
        <h1 style="margin:0 0 14px;font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#111110;line-height:1.3;">${copy.headline}</h1>
        <p style="margin:0 0 22px;font-size:14.5px;color:#3A3A35;line-height:1.65;">
          <strong style="color:#111110;">${record.candidate_name}</strong> — ${copy.body}
        </p>
        ${rejectionNote}

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:26px;">
          <tr><td style="background:#111110;border-radius:8px;">
            <a href="${APP_URL}" style="display:inline-block;color:#FFFFFF;text-decoration:none;padding:13px 26px;font-size:14px;font-weight:600;font-family:inherit;">View in My submissions →</a>
          </td></tr>
        </table>

        <p style="margin:32px 0 0;font-size:12px;color:#9A9A90;line-height:1.6;border-top:1px solid #F0EEE7;padding-top:20px;">
          You're receiving this because you submitted ${record.candidate_name} on HyperHire.
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
      to: [record.recruiter_email],
      subject: `${copy.subject} — ${record.candidate_name}`,
      html,
    }),
  });

  const body = await res.json();
  return new Response(JSON.stringify(body), { status: res.ok ? 200 : 500 });
});
