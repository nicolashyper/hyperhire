// Edge function: fires when a submission status changes
// Trigger: DB webhook on hh_submissions UPDATE
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const APP_URL = "https://nicolashyper.github.io/hyperhire";
const FROM    = "HyperHire <hello@hyperhire.io>";

const STATUS_COPY: Record<string, { subject: string; headline: string; body: string; color: string }> = {
  Interviewing: {
    subject: "Your candidate is interviewing 🎉",
    headline: "They're in the interview process",
    body: "The hiring team liked what they saw. Your candidate has been moved to the interview stage.",
    color: "#92400E",
  },
  Hired: {
    subject: "Placement confirmed — your fee is processing",
    headline: "Congratulations — they got the job",
    body: "Your candidate was hired. Your $10,000 placement fee will be processed after the 2-month guarantee period.",
    color: "#166534",
  },
  Rejected: {
    subject: "Update on your candidate submission",
    headline: "The team passed on this one",
    body: "The hiring team decided not to move forward with your candidate for this role. This doesn't reflect on you — keep submitting.",
    color: "#991B1B",
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

  // Fetch job name from Supabase for a nice email
  const sb = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );
  const { data: job } = await sb.from("hh_jobs").select("title, company_name").eq("id", record.job_id).maybeSingle();
  const roleLabel = job ? `${job.title} at ${job.company_name}` : "the role";

  const rejectionNote = record.rejection_note ? `<p style="margin:16px 0 0;padding:12px 14px;background:#FEF2F2;border-radius:6px;font-size:13px;color:#991B1B;line-height:1.55;"><strong>Feedback:</strong> ${record.rejection_note}</p>` : "";

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#FAFAF7;font-family:'Inter',sans-serif;color:#111110;">
<div style="max-width:520px;margin:40px auto;background:#FFFFFE;border:1px solid #E8E6DF;border-radius:12px;padding:36px 40px;">
  <div style="width:36px;height:36px;border-radius:9px;background:#111110;display:flex;align-items:center;justify-content:center;margin-bottom:24px;">
    <span style="color:#fff;font-weight:700;font-size:16px;">H</span>
  </div>
  <div style="font-size:11px;font-weight:500;color:#9A9A90;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">${roleLabel}</div>
  <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;letter-spacing:-0.02em;">${copy.headline}</h2>
  <p style="margin:0 0 20px;font-size:14px;color:#3A3A35;line-height:1.65;">
    <strong style="color:${copy.color};">${record.candidate_name}</strong> — ${copy.body}
  </p>
  ${rejectionNote}
  <div style="margin-top:26px;">
    <a href="${APP_URL}" style="display:inline-block;background:#111110;color:#fff;text-decoration:none;padding:11px 20px;border-radius:7px;font-size:13.5px;font-weight:600;">
      View in My submissions →
    </a>
  </div>
  <p style="margin:28px 0 0;font-size:12px;color:#9A9A90;">
    You're receiving this because you submitted ${record.candidate_name} on HyperHire.
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
      to: [record.recruiter_email],
      subject: `${copy.subject} — ${record.candidate_name}`,
      html,
    }),
  });

  const body = await res.json();
  return new Response(JSON.stringify(body), { status: res.ok ? 200 : 500 });
});
