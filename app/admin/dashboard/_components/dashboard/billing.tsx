import type { BillingStatusFilter } from "@/types/billing-types";
import { GetBillingOverviewAction } from "../../actions/get-billing-overview";
import { BillingManagement } from "./billing-management";

type BillingProps = {
  searchParams?: Promise<{
    search?: string;
    page?: string;
    perPage?: string;
    status?: string;
  }>;
};

const VALID_STATUSES: BillingStatusFilter[] = [
  "all",
  "active",
  "past_due",
  "unpaid",
  "overdue",
  "paid",
  "cancelled",
  "expired",
];

export default async function Billing({ searchParams }: BillingProps) {
  const params = (await searchParams) ?? {};
  const search = params.search ?? "";
  const page = Number(params.page) || 1;
  const perPage = Number(params.perPage) || 5;
  const status: BillingStatusFilter = VALID_STATUSES.includes(
    params.status as BillingStatusFilter,
  )
    ? (params.status as BillingStatusFilter)
    : "all";

  const result = await GetBillingOverviewAction({
    search,
    page,
    perPage,
    status,
  });

  if (!result.success) {
    return (
      <div className="mx-auto w-full py-10">
        <p className="text-sm text-destructive">
          {result.message || "Failed to load billing overview."}
        </p>
      </div>
    );
  }

  return (
    <BillingManagement
      rows={result.data.rows}
      pagination={result.data.pagination}
      metrics={result.data.metrics}
      activeStatus={status}
    />
  );
}
