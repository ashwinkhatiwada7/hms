import { and, eq, lte } from "drizzle-orm";

import db from "@/db";
import {
  organizationSubscription,
  subscriptionPlan,
} from "@/db/schema";

export type RenewalResult = {
  organizationId: string;
  status: "renewed" | "skipped" | "failed";
  previousStatus?: string;
  newBillingDate?: string;
  error?: string;
};

/**
 * Rolls every due yearly term into a fresh one.
 *
 * A term is due when it is `active` and `nextBillingDate <= today`.
 * - Unpaid balance left on the old term → old term becomes `past_due`
 *   (balance stays visible in "Total due").
 * - Fully paid old term → `expired` (history kept, counts toward lifetime
 *   earnings, never toward due).
 * - New term snapshots the plan's *current* price/limits, starts `unpaid`
 *   (or `waived` for Rs. 0 plans), billed for the next year starting from
 *   the old term's anniversary date.
 *
 * Idempotent: after a run the new term's billing date is in the future, so
 * re-running is a no-op. Safe to call daily from a scheduler.
 */
export async function renewDueSubscriptions(): Promise<RenewalResult[]> {
  const today = new Date().toISOString().split("T")[0];

  const dueTerms = await db
    .select()
    .from(organizationSubscription)
    .where(
      and(
        eq(organizationSubscription.status, "active"),
        lte(organizationSubscription.nextBillingDate, today),
      ),
    );

  const results: RenewalResult[] = [];

  for (const term of dueTerms) {
    try {
      const balance =
        Number(term.priceAtSignup) - Number(term.paidAmount);

      // Close the old term, keeping its money trail intact.
      await db
        .update(organizationSubscription)
        .set({
          status: balance > 0.005 ? "past_due" : "expired",
          cancelledAt: new Date(),
        })
        .where(eq(organizationSubscription.id, term.id));

      // Fresh snapshot — plan price may have changed since signup.
      const planRows = await db
        .select()
        .from(subscriptionPlan)
        .where(eq(subscriptionPlan.id, term.planId))
        .limit(1);
      const plan = planRows[0] ?? null;

      const price = plan?.price ?? term.priceAtSignup;
      const anniversary = new Date(term.nextBillingDate);
      anniversary.setFullYear(anniversary.getFullYear() + 1);
      const nextBillingDate = anniversary.toISOString().split("T")[0];

      await db.insert(organizationSubscription).values({
        organizationId: term.organizationId,
        planId: term.planId,
        status: "active",
        planName: plan?.name ?? term.planName,
        priceAtSignup: price,
        maxStudentsSnapshot:
          plan?.maxStudents ?? term.maxStudentsSnapshot,
        maxStaffSnapshot: plan?.maxStaff ?? term.maxStaffSnapshot,
        startedAt: new Date(),
        nextBillingDate,
        createdBy: null, // system-generated renewal
        paymentStatus: Number(price) === 0 ? "waived" : "unpaid",
        paidAmount: "0.00",
      });

      results.push({
        organizationId: term.organizationId,
        status: "renewed",
        previousStatus: balance > 0.005 ? "past_due" : "expired",
        newBillingDate: nextBillingDate,
      });
    } catch (error) {
      results.push({
        organizationId: term.organizationId,
        status: "failed",
        error: error instanceof Error ? error.message : "Something went wrong",
      });
    }
  }

  return results;
}
