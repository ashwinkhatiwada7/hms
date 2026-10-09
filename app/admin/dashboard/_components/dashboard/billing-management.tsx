"use client";

import {
  AlertTriangle,
  BadgeDollarSign,
  HandCoins,
  TrendingUp,
} from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { DataTableSearch } from "@/components/data-table/data-table-search";
import { useUrlParams } from "@/components/data-table/use-url-params";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  BillingMetrics,
  BillingRow,
  BillingStatusFilter,
} from "@/types/billing-types";
import { billingColumns } from "./billing-columns";
import { RenewSubscriptionsButton } from "./renew-subscriptions-button";

type BillingManagementProps = {
  rows: BillingRow[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  metrics: BillingMetrics;
  activeStatus: BillingStatusFilter;
};

const STATUS_OPTIONS: { value: BillingStatusFilter; label: string }[] = [
  { value: "all", label: "All terms" },
  { value: "unpaid", label: "Unpaid (owe now)" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
  { value: "active", label: "Active" },
  { value: "past_due", label: "Past due" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
];

function StatusFilter({ value }: { value: BillingStatusFilter }) {
  const { push } = useUrlParams();

  function handleChange(next: string) {
    push({ status: next === "all" ? undefined : next, page: 1 });
  }

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-44" aria-label="Filter by billing status">
        <SelectValue placeholder="All terms" />
      </SelectTrigger>
      <SelectContent align="end">
        {STATUS_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function formatRs(value: number) {
  return `Rs. ${value.toLocaleString("en-NP", { maximumFractionDigits: 2 })}`;
}

export function BillingManagement({
  rows,
  pagination,
  metrics,
  activeStatus,
}: BillingManagementProps) {
  const metricCards = [
    {
      label: "Total earnings (collected)",
      value: formatRs(metrics.totalEarnings),
      hint: "Lifetime payments recorded",
      icon: TrendingUp,
      accent: "bg-emerald-500",
      chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Total due (to pay)",
      value: formatRs(metrics.totalDue),
      hint: `${metrics.unpaidCount} hostel${metrics.unpaidCount === 1 ? "" : "s"} owe now`,
      icon: HandCoins,
      accent: "bg-amber-500",
      chip: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      label: "Overdue",
      value: formatRs(metrics.overdue),
      hint: "Past next billing date",
      icon: AlertTriangle,
      accent: "bg-destructive",
      chip: "bg-destructive/10 text-destructive",
    },
    {
      label: "Expected / term (active)",
      value: formatRs(metrics.expectedRevenue),
      hint: `${metrics.activeCount} active · ${metrics.pastDueCount} past due · ${metrics.unsubscribedCount} without plan`,
      icon: BadgeDollarSign,
      accent: "bg-sky-500",
      chip: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
  ];

  return (
    <div className="mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">Admin / Dashboard</p>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            What hostels have paid (earnings) vs what they still owe (due) —
            billed yearly per assigned plan. Due terms roll into a new year
            automatically via daily cron.
          </p>
        </div>
        <RenewSubscriptionsButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((metric) => (
          <Card
            key={metric.label}
            className="relative overflow-hidden py-5 transition-shadow hover:shadow-md"
          >
            <span
              className={`absolute inset-x-0 top-0 h-1 ${metric.accent}`}
              aria-hidden="true"
            />
            <CardContent className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {metric.label}
                </p>
                <p className="text-2xl font-bold tracking-tight tabular-nums">
                  {metric.value}
                </p>
                <p className="text-xs text-muted-foreground">{metric.hint}</p>
              </div>
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${metric.chip}`}
              >
                <metric.icon className="size-4" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <DataTableSearch placeholder="Search by hostel, slug, or plan…" />
          <div className="flex items-center gap-2">
            <StatusFilter value={activeStatus} />
            <span className="text-xs whitespace-nowrap text-muted-foreground">
              Showing {rows.length} of {pagination.total} terms
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={billingColumns}
            data={rows}
            rowCount={pagination.total}
            page={pagination.page}
            perPage={pagination.perPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
