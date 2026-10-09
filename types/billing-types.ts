export type BillingStatusFilter =
  | "all"
  | "active"
  | "past_due"
  | "unpaid"
  | "overdue"
  | "paid"
  | "cancelled"
  | "expired";

export type ListBillingInput = {
  search?: string;
  page?: number;
  perPage?: number;
  status?: BillingStatusFilter;
};

export type BillingRow = {
  subscriptionId: string;
  organizationId: string;
  hostelName: string;
  hostelSlug: string;
  planName: string;
  priceAtSignup: string;
  paidAmount: string;
  dueAmount: string;
  status: string;
  paymentStatus: "unpaid" | "paid" | "partial" | "waived";
  nextBillingDate: string;
  startedAt: Date;
  paidAt: Date | null;
  paymentMethod: string | null;
};

export type BillingMetrics = {
  /** Actually collected across all terms (lifetime). */
  totalEarnings: number;
  /** Still owed on current (active + past_due) terms. */
  totalDue: number;
  /** Due + past nextBillingDate on current terms. */
  overdue: number;
  /** Sum of priceAtSignup on active terms (expected per yearly term). */
  expectedRevenue: number;
  activeCount: number;
  pastDueCount: number;
  unpaidCount: number;
  unsubscribedCount: number;
};

export type BillingOverviewPayload = {
  rows: BillingRow[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  metrics: BillingMetrics;
};
