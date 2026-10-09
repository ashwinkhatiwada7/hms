import React, { Suspense } from "react";
import Billing from "./_components/dashboard/billing";

type AdminDashboardPageProps = {
  searchParams?: Promise<{
    search?: string;
    page?: string;
    perPage?: string;
    status?: string;
  }>;
};

export default function AdminDashboardPage({
  searchParams,
}: AdminDashboardPageProps) {
  return (
    <div className="py-2">
      <Suspense fallback={<p className="text-sm">Loading billing…</p>}>
        <Billing searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
