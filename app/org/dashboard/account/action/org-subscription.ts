"use server";

import db from "@/db";
import { organizationSubscription, subscriptionPlan } from "@/db/schema";
import { withAuth } from "@/lib/withAuth";
import { ActionResponse } from "@/types/action-response";
import { and, desc, eq, sql } from "drizzle-orm";

export type SubscriptionPaymentState = "unpaid" | "paid" | "partial" | "waived";

export type OrgSubscriptionInfo = {
  planName: string;
  price: string;
  paidAmount: string;
  dueAmount: string;
  paymentStatus: SubscriptionPaymentState;
  paidAt: Date | null;
  paymentMethod: string | null;
  status: string;
  maxStudents: number | null;
  maxStaff: number | null;
  nextBillingDate: string;
  startedAt: Date;
  description: string | null;
};

export type OrgOutstandingTerm = {
  id: string;
  planName: string;
  price: string;
  paidAmount: string;
  dueAmount: string;
  paymentStatus: SubscriptionPaymentState;
  status: string;
  nextBillingDate: string;
  startedAt: Date;
  isOverdue: boolean;
};

export type OrgSubscriptionPayload = {
  current: OrgSubscriptionInfo | null;
  outstanding: OrgOutstandingTerm[];
  totalDue: string;
};

const toNumber = (value: unknown): number => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const toDue = (price: string, paid: string): string =>
  Math.max(0, toNumber(price) - toNumber(paid)).toFixed(2);

export const getOrgSubscriptionAction = withAuth<
  Record<string, never>,
  ActionResponse<OrgSubscriptionPayload>
>({
  roles: ["orgUser"],
  requireActiveOrg: true,
})(async ({
  organizationId,
}): Promise<ActionResponse<OrgSubscriptionPayload>> => {
  try {
    if (!organizationId) {
      return { success: false, message: "Organization not found" };
    }

    const currentRows = await db
      .select({
        planName: organizationSubscription.planName,
        price: organizationSubscription.priceAtSignup,
        paidAmount: organizationSubscription.paidAmount,
        paymentStatus: organizationSubscription.paymentStatus,
        paidAt: organizationSubscription.paidAt,
        paymentMethod: organizationSubscription.paymentMethod,
        status: organizationSubscription.status,
        maxStudents: organizationSubscription.maxStudentsSnapshot,
        maxStaff: organizationSubscription.maxStaffSnapshot,
        nextBillingDate: organizationSubscription.nextBillingDate,
        startedAt: organizationSubscription.startedAt,
        description: subscriptionPlan.description,
      })
      .from(organizationSubscription)
      .innerJoin(
        subscriptionPlan,
        eq(organizationSubscription.planId, subscriptionPlan.id),
      )
      .where(
        and(
          eq(organizationSubscription.organizationId, organizationId),
          eq(organizationSubscription.status, "active"),
        ),
      )
      .limit(1);

    const current: OrgSubscriptionInfo | null =
      currentRows.length === 0
        ? null
        : {
            ...currentRows[0],
            paymentStatus: currentRows[0]
              .paymentStatus as SubscriptionPaymentState,
            dueAmount: toDue(currentRows[0].price, currentRows[0].paidAmount),
          };

    // Every current term (active + past_due) that still has a balance.
    const balance = sql`(${organizationSubscription.priceAtSignup} - ${organizationSubscription.paidAmount})`;
    const owedRows = await db
      .select({
        id: organizationSubscription.id,
        planName: organizationSubscription.planName,
        price: organizationSubscription.priceAtSignup,
        paidAmount: organizationSubscription.paidAmount,
        paymentStatus: organizationSubscription.paymentStatus,
        status: organizationSubscription.status,
        nextBillingDate: organizationSubscription.nextBillingDate,
        startedAt: organizationSubscription.startedAt,
      })
      .from(organizationSubscription)
      .where(
        and(
          eq(organizationSubscription.organizationId, organizationId),
          sql`${organizationSubscription.status} IN ('active', 'past_due')`,
          sql`${balance} > 0`,
        ),
      )
      .orderBy(desc(organizationSubscription.startedAt));

    const today = new Date().toISOString().split("T")[0];
    const outstanding: OrgOutstandingTerm[] = owedRows.map((row) => ({
      ...row,
      paymentStatus: row.paymentStatus as SubscriptionPaymentState,
      dueAmount: toDue(row.price, row.paidAmount),
      isOverdue: row.nextBillingDate < today,
    }));

    const totalDue = outstanding
      .reduce((sum, term) => sum + toNumber(term.dueAmount), 0)
      .toFixed(2);

    return { success: true, data: { current, outstanding, totalDue } };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to fetch subscription info" };
  }
});
