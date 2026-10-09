import { z } from "zod";

export const markSubscriptionPaidSchema = z.object({
  subscriptionId: z.string().uuid("Invalid subscription ID"),
  /** Amount collected now, as a decimal string (e.g. "5000.00"). */
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid amount")
    .refine((v) => Number(v) > 0, "Amount must be greater than zero"),
  method: z.enum(
    ["cash", "esewa", "bank_transfer", "cheque", "khalti", "other"],
    {
      message: "Select a payment method",
    },
  ),
});

export type MarkSubscriptionPaidInput = z.infer<
  typeof markSubscriptionPaidSchema
>;
