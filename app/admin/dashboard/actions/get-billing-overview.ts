"use server";

import db from "@/db";
import { organization, organizationSubscription } from "@/db/schema";
import { withAuth } from "@/lib/withAuth";
import { ActionResponse } from "@/types/action-response";
import {
  BillingMetrics,
  BillingRow,
  BillingStatusFilter,
  ListBillingInput,
  BillingOverviewPayload,
} from "@/types/billing-types";
import { and, count, desc, eq, ilike, or, sql, SQL } from "drizzle-orm";

const BALANCE = sql`(${organizationSubscription.priceAtSignup} - ${organizationSubscription.paidAmount})`;

function buildStatusCondition(status: BillingStatusFilter): SQL | undefined {
  switch (status) {
    case "active":
      return eq(organizationSubscription.status, "active");
    case "past_due":
      return eq(organizationSubscription.status, "past_due");
    case "cancelled":
      return eq(organizationSubscription.status, "cancelled");
    case "expired":
      return eq(organizationSubscription.status, "expired");
    case "paid":
      return eq(organizationSubscription.paymentStatus, "paid");
    case "unpaid":
      // Current terms with an outstanding balance.
      return and(
        sql`${organizationSubscription.status} IN ('active', 'past_due')`,
        sql`${BALANCE} > 0`,
      );
    case "overdue":
      // Owed + past the next billing date.
      return and(
        sql`${organizationSubscription.status} IN ('active', 'past_due')`,
        sql`${BALANCE} > 0`,
        sql`${organizationSubscription.nextBillingDate} < CURRENT_DATE`,
      );
    case "all":
    default:
      return undefined;
  }
}

function buildSearchCondition(search: string): SQL | undefined {
  const term = search.trim();
  if (!term) return undefined;
  const pattern = `%${term}%`;
  return or(
    ilike(organization.name, pattern),
    ilike(organization.slug, pattern),
    ilike(organizationSubscription.planName, pattern),
  );
}

function combineConditions(conditions: (SQL | undefined)[]) {
  const active = conditions.filter((c): c is SQL => Boolean(c));
  if (active.length === 0) return undefined;
  if (active.length === 1) return active[0];
  return and(...active);
}

const toNumber = (value: unknown): number => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export const GetBillingOverviewAction = withAuth<
  ListBillingInput,
  ActionResponse<BillingOverviewPayload>
>({
  roles: ["superAdmin"],
})(async ({ data }): Promise<ActionResponse<BillingOverviewPayload>> => {
  try {
    const search = data?.search?.trim() ?? "";
    const status: BillingStatusFilter = data?.status ?? "all";
    const perPage = Math.min(Math.max(Number(data?.perPage) || 5, 1), 20);
    const requestedPage = Math.max(Number(data?.page) || 1, 1);

    const where = combineConditions([
      buildSearchCondition(search),
      buildStatusCondition(status),
    ]);

    const [{ value: total }] = await db
      .select({ value: count() })
      .from(organizationSubscription)
      .innerJoin(
        organization,
        eq(organizationSubscription.organizationId, organization.id),
      )
      .where(where);

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const page = Math.min(requestedPage, totalPages);
    const offset = (page - 1) * perPage;

    // Global metrics (not search/filtered) — single aggregate query.
    const [metricsRow] = await db
      .select({
        totalEarnings: sql<string>`COALESCE(SUM(${organizationSubscription.paidAmount}), 0)::text`,
        totalDue: sql<string>`COALESCE(SUM(${BALANCE}) FILTER (WHERE ${organizationSubscription.status} IN ('active', 'past_due')), 0)::text`,
        overdue: sql<string>`COALESCE(SUM(${BALANCE}) FILTER (WHERE ${organizationSubscription.status} IN ('active', 'past_due') AND ${BALANCE} > 0 AND ${organizationSubscription.nextBillingDate} < CURRENT_DATE), 0)::text`,
        expectedRevenue: sql<string>`COALESCE(SUM(${organizationSubscription.priceAtSignup}) FILTER (WHERE ${organizationSubscription.status} = 'active'), 0)::text`,
        activeCount: sql<string>`COUNT(*) FILTER (WHERE ${organizationSubscription.status} = 'active')::text`,
        pastDueCount: sql<string>`COUNT(*) FILTER (WHERE ${organizationSubscription.status} = 'past_due')::text`,
        unpaidCount: sql<string>`COUNT(*) FILTER (WHERE ${organizationSubscription.status} IN ('active', 'past_due') AND ${BALANCE} > 0)::text`,
      })
      .from(organizationSubscription);

    const [{ value: orgsWithActiveSub }] = await db
      .select({
        value: sql<string>`COUNT(DISTINCT ${organizationSubscription.organizationId})::text`,
      })
      .from(organizationSubscription)
      .where(eq(organizationSubscription.status, "active"));

    const [{ value: totalOrgs }] = await db
      .select({ value: count() })
      .from(organization);

    const metrics: BillingMetrics = {
      totalEarnings: toNumber(metricsRow?.totalEarnings),
      totalDue: toNumber(metricsRow?.totalDue),
      overdue: toNumber(metricsRow?.overdue),
      expectedRevenue: toNumber(metricsRow?.expectedRevenue),
      activeCount: Math.round(toNumber(metricsRow?.activeCount)),
      pastDueCount: Math.round(toNumber(metricsRow?.pastDueCount)),
      unpaidCount: Math.round(toNumber(metricsRow?.unpaidCount)),
      unsubscribedCount: Math.max(
        0,
        Number(totalOrgs) - Math.round(toNumber(orgsWithActiveSub)),
      ),
    };

    const rows = await db
      .select({
        subscriptionId: organizationSubscription.id,
        organizationId: organizationSubscription.organizationId,
        hostelName: organization.name,
        hostelSlug: organization.slug,
        planName: organizationSubscription.planName,
        priceAtSignup: organizationSubscription.priceAtSignup,
        paidAmount: organizationSubscription.paidAmount,
        status: organizationSubscription.status,
        paymentStatus: organizationSubscription.paymentStatus,
        nextBillingDate: organizationSubscription.nextBillingDate,
        startedAt: organizationSubscription.startedAt,
        paidAt: organizationSubscription.paidAt,
        paymentMethod: organizationSubscription.paymentMethod,
      })
      .from(organizationSubscription)
      .innerJoin(
        organization,
        eq(organizationSubscription.organizationId, organization.id),
      )
      .where(where)
      .orderBy(desc(organizationSubscription.startedAt))
      .limit(perPage)
      .offset(offset);

    const billingRows: BillingRow[] = rows.map((row) => {
      const due = Math.max(
        0,
        toNumber(row.priceAtSignup) - toNumber(row.paidAmount),
      );
      return {
        ...row,
        status: row.status,
        paymentStatus: row.paymentStatus as BillingRow["paymentStatus"],
        dueAmount: due.toFixed(2),
      };
    });

    return {
      success: true,
      data: {
        rows: billingRows,
        pagination: { page, perPage, total, totalPages },
        metrics,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to fetch billing overview",
    };
  }
});
