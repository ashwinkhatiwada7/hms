"use client";

import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type {
  OrgOutstandingTerm,
  OrgSubscriptionInfo,
} from "../action/org-subscription";

type AccountManagementProps = {
  subscription: OrgSubscriptionInfo | null;
  outstanding: OrgOutstandingTerm[];
  totalDue: string;
};

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusBadgeVariant(status: string) {
  switch (status) {
    case "active":
      return "default" as const;
    case "past_due":
      return "destructive" as const;
    case "cancelled":
    case "expired":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

function paymentBadgeVariant(status: OrgSubscriptionInfo["paymentStatus"]) {
  switch (status) {
    case "paid":
      return "default" as const;
    case "partial":
      return "outline" as const;
    case "waived":
      return "secondary" as const;
    default:
      return "destructive" as const;
  }
}

export default function AccountManagement({
  subscription,
  outstanding,
  totalDue,
}: AccountManagementProps) {
  const overdueTerms = outstanding.filter((term) => term.isOverdue);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground">
          Your organization&apos;s subscription and billing details.
        </p>
      </div>

      {overdueTerms.length > 0 && (
        <Card className="border-destructive/50">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div className="text-sm">
              <p className="font-semibold text-destructive">
                {overdueTerms.length === 1
                  ? "A billing term is overdue"
                  : `${overdueTerms.length} billing terms are overdue`}
              </p>
              <p className="mt-1 text-muted-foreground">
                Rs. {totalDue} is outstanding past the billing date. Please
                contact your admin to clear the dues and avoid interruption.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Subscription Plan</CardTitle>
            <CardDescription>Current plan details</CardDescription>
          </div>
          {subscription && (
            <div className="flex items-center gap-2">
              <Badge variant={paymentBadgeVariant(subscription.paymentStatus)}>
                {subscription.paymentStatus}
              </Badge>
              <Badge variant={statusBadgeVariant(subscription.status)}>
                {subscription.status}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {subscription.planName}
                </span>
                <span className="text-lg text-muted-foreground">
                  Rs. {subscription.price}
                </span>
              </div>

              {subscription.description && (
                <p className="text-sm text-muted-foreground">
                  {subscription.description}
                </p>
              )}

              <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm">
                <span className="text-muted-foreground">
                  Paid Rs. {subscription.paidAmount}
                  {subscription.paymentMethod
                    ? ` · ${subscription.paymentMethod.replace("_", " ")}`
                    : null}
                  {subscription.paidAt
                    ? ` · ${formatDate(subscription.paidAt)}`
                    : null}
                </span>
                <span
                  className={
                    Number(subscription.dueAmount) > 0
                      ? "font-semibold text-destructive"
                      : "font-medium text-emerald-600 dark:text-emerald-400"
                  }
                >
                  {Number(subscription.dueAmount) > 0
                    ? `Due Rs. ${subscription.dueAmount}`
                    : "Fully paid"}
                </span>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Students limit:</span>{" "}
                  <span className="font-medium">
                    {subscription.maxStudents ?? "Unlimited"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Staff limit:</span>{" "}
                  <span className="font-medium">
                    {subscription.maxStaff ?? "Unlimited"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Started:</span>{" "}
                  <span className="font-medium">
                    {formatDate(subscription.startedAt)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Next billing:</span>{" "}
                  <span className="font-medium">
                    {subscription.nextBillingDate}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No active subscription plan. Contact your admin to assign a plan.
            </p>
          )}
        </CardContent>
      </Card>

      {outstanding.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Outstanding Balance</CardTitle>
              <CardDescription>
                Terms with pending payment — contact your admin to pay
              </CardDescription>
            </div>
            <span className="text-lg font-bold tabular-nums text-destructive">
              Rs. {totalDue}
            </span>
          </CardHeader>
          <CardContent className="space-y-3">
            {outstanding.map((term) => (
              <div
                key={term.id}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
              >
                <div className="flex flex-col">
                  <span className="flex items-center gap-2 font-medium">
                    {term.planName}
                    <Badge
                      variant={paymentBadgeVariant(term.paymentStatus)}
                      className="text-[10px]"
                    >
                      {term.paymentStatus}
                    </Badge>
                    {term.isOverdue && (
                      <Badge variant="destructive" className="text-[10px]">
                        overdue
                      </Badge>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Billed Rs. {term.price} · Paid Rs. {term.paidAmount} ·
                    since {formatDate(term.startedAt)}
                  </span>
                </div>
                <span className="font-semibold whitespace-nowrap tabular-nums text-destructive">
                  Rs. {term.dueAmount}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
