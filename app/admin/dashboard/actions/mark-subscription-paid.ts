"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import db from "@/db";
import { organizationSubscription } from "@/db/schema";
import { withAuth } from "@/lib/withAuth";
import { ActionResponse } from "@/types/action-response";

import {
  MarkSubscriptionPaidInput,
  markSubscriptionPaidSchema,
} from "./mark-subscription-paid-schema";

const toCents = (value: string | number): number =>
  Math.round(Number(value) * 100);

export const markSubscriptionPaidAction = withAuth<
  MarkSubscriptionPaidInput,
  ActionResponse<null>
>({
  roles: ["superAdmin"],
})(async ({ data, session }): Promise<ActionResponse<null>> => {
  try {
    const parsed = markSubscriptionPaidSchema.safeParse(data);
    if (!parsed.success) {
      const { fieldErrors } = z.flattenError(parsed.error);
      return {
        success: false,
        message: "Invalid data",
        fieldErrors: fieldErrors as Record<string, string[]>,
      };
    }

    const { subscriptionId, amount, method } = parsed.data;

    const existing = await db
      .select()
      .from(organizationSubscription)
      .where(eq(organizationSubscription.id, subscriptionId))
      .limit(1);

    if (existing.length === 0) {
      return { success: false, message: "Subscription not found" };
    }

    const sub = existing[0];
    const priceCents = toCents(sub.priceAtSignup);
    const paidCents = toCents(sub.paidAmount);
    const amountCents = toCents(amount);
    const balanceCents = priceCents - paidCents;

    if (balanceCents <= 0) {
      return { success: false, message: "This term is already fully paid" };
    }

    if (amountCents > balanceCents) {
      return {
        success: false,
        message: `Amount exceeds the due balance of Rs. ${(balanceCents / 100).toFixed(2)}`,
      };
    }

    const newPaidCents = paidCents + amountCents;
    const fullyPaid = newPaidCents >= priceCents;

    await db
      .update(organizationSubscription)
      .set({
        paidAmount: (newPaidCents / 100).toFixed(2),
        paymentStatus:
          priceCents === 0 ? "waived" : fullyPaid ? "paid" : "partial",
        paidAt: new Date(),
        paymentMethod: method,
        paidBy: session?.user?.id ?? null,
      })
      .where(eq(organizationSubscription.id, subscriptionId));

    revalidatePath("/admin/dashboard");
    revalidatePath(`/admin/dashboard/hostels/${sub.organizationId}`);

    return {
      success: true,
      message: fullyPaid
        ? "Payment recorded — term fully paid"
        : `Partial payment recorded — Rs. ${((priceCents - newPaidCents) / 100).toFixed(2)} still due`,
      data: null,
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to record payment" };
  }
});
