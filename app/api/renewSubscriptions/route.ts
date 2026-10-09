import { renewDueSubscriptions } from "@/app/admin/dashboard/lib/renew-subscriptions";

/**
 * Yearly subscription rollover.
 *
 * Hit this from an external scheduler (cron-job.org, Vercel Cron, server
 * cron, …) once a day, e.g.:
 *
 *   POST https://your-domain.com/api/renewSubscriptions
 *
 * Every `active` term past its `nextBillingDate` is closed and a fresh
 * yearly term is opened. Idempotent — re-running without due terms is a
 * no-op. Optional shared-secret guard via `CRON_SECRET` env:
 *
 *   Authorization: Bearer <CRON_SECRET>
 */
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = request.headers.get("authorization");
    if (header !== `Bearer ${secret}`) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const results = await renewDueSubscriptions();
  const failed = results.filter((r) => r.status === "failed");

  const payload = {
    dueTerms: results.length,
    renewed: results.filter((r) => r.status === "renewed").length,
    failedOrgs: failed.length,
    results,
  };

  console.log(JSON.stringify({ renewSubscriptions: payload }));

  return Response.json(
    { ok: failed.length === 0, ...payload },
    { status: failed.length > 0 ? 500 : 200 },
  );
}
