"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";

import { features } from "@/components/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import type { BillingRow } from "@/types/billing-types";
import { MarkPaidDialog } from "./mark-paid-dialog";

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusVariant(status: string) {
  switch (status) {
    case "active":
      return "default" as const;
    case "past_due":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

function paymentVariant(status: BillingRow["paymentStatus"]) {
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

function isOverdue(row: BillingRow) {
  if (row.status === "cancelled" || row.status === "expired") return false;
  if (Number(row.dueAmount) <= 0) return false;
  return new Date(row.nextBillingDate).getTime() < Date.now();
}

export const billingColumns: ColumnDef<typeof features, BillingRow>[] = [
  {
    accessorKey: "hostelName",
    header: "Hostel",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <Link
          href={`/admin/dashboard/hostels/${item.organizationId}`}
          className="font-medium text-primary hover:underline"
        >
          <div className="flex flex-col">
            <span>{item.hostelName}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {item.hostelSlug}
            </span>
          </div>
        </Link>
      );
    },
  },
  {
    accessorKey: "planName",
    header: "Plan",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span>{row.original.planName}</span>
        <span className="text-xs text-muted-foreground">
          since {formatDate(row.original.startedAt)}
        </span>
      </div>
    ),
  },
  {
    id: "amounts",
    header: "Billed / Paid / Due",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex flex-col text-sm tabular-nums">
          <span>Rs. {item.priceAtSignup}</span>
          <span className="text-muted-foreground">
            paid Rs. {item.paidAmount}
          </span>
          <span
            className={
              Number(item.dueAmount) > 0
                ? "font-semibold text-destructive"
                : "text-emerald-600 dark:text-emerald-400"
            }
          >
            due Rs. {item.dueAmount}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "paymentStatus",
    header: "Payment",
    cell: ({ row }) => (
      <div className="flex flex-col items-start gap-1">
        <Badge variant={paymentVariant(row.original.paymentStatus)}>
          {row.original.paymentStatus}
        </Badge>
        {row.original.paymentMethod ? (
          <span className="text-xs text-muted-foreground">
            {row.original.paymentMethod.replace("_", " ")}
            {row.original.paidAt
              ? ` · ${formatDate(row.original.paidAt)}`
              : null}
          </span>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Subscription",
    cell: ({ row }) => (
      <Badge variant={statusVariant(row.original.status)}>
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "nextBillingDate",
    header: "Next billing",
    cell: ({ row }) => {
      const item = row.original;
      const overdue = isOverdue(item);
      return (
        <span
          className={
            overdue
              ? "font-semibold text-destructive"
              : "text-muted-foreground"
          }
        >
          {item.nextBillingDate}
          {overdue ? " · overdue" : null}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const item = row.original;
      if (item.paymentStatus === "paid" || item.paymentStatus === "waived") {
        return <span className="text-xs text-muted-foreground">Settled</span>;
      }
      if (Number(item.dueAmount) <= 0) {
        return <span className="text-xs text-muted-foreground">Settled</span>;
      }
      return <MarkPaidDialog row={item} />;
    },
  },
];
