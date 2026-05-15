export interface DashboardStats {
  totalRevenue: number;
  revenueChangePercent: number | null;
  pendingInvoicesCount: number;
  pendingInvoicesTotal: number;
  pendingChangePercent: number | null;
  activeClientsCount: number;
  newClientsThisMonth: number;
  paidThisMonth: number;
  paidChangePercent: number | null;
}

export interface RevenueChart {
  labels: string[];
  totalRevenue: number[];
  paidInvoices: number[];
}
