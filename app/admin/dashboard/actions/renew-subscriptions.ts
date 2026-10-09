"use server";

import { revalidatePath } from "next/cache";

import { renewDueSubscriptions } from "@/app/admin/dashboard/lib/renew-subscriptions";
import { withAuth } from "@/lib/withAuth";
import { ActionResponse } from "@/types/action-response";

/**
 * Manual trigger for the yearly rollover (same routine the daily cron
 * calls). Useful to renew overdue terms on demand without waiting for
 * the scheduler.
 */
export const renewSubscriptionsAction = withAuth<
  Record<string, never>,
  ActionResponse<{ renewed: number; dueTerms: number }>
>({
  roles: ["superAdmin"],
})(async (): Promise<
  ActionResponse<{ renewed: number; dueTerms: number }>
> => {
  try {
    const results = await renewDueSubscriptions();
    const renewed = results.filter((r) => r.status === "renewed").length;
    const failed = results.filter((r) => r.status === "failed").length;

    if (failed > 0) {
      return {
        success: false,
        message: `${renewed} renewed, ${failed} failed — check server logs`,
      };
    }

    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message:
        renewed === 0
          ? "Nothing due — all terms are current"
          : `${renewed} term${renewed === 1 ? "" : "s"} renewed for the next year`,
      data: { renewed, dueTerms: results.length },
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to renew subscriptions" };
  }
});
