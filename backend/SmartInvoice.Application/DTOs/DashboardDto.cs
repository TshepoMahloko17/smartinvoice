namespace SmartInvoice.Application.DTOs;

public class DashboardStatsDto
{
    public decimal TotalRevenue { get; set; }
    public decimal? RevenueChangePercent { get; set; }
    public int PendingInvoicesCount { get; set; }
    public decimal PendingInvoicesTotal { get; set; }
    public decimal? PendingChangePercent { get; set; }
    public int ActiveClientsCount { get; set; }
    public int NewClientsThisMonth { get; set; }
    public decimal PaidThisMonth { get; set; }
    public decimal? PaidChangePercent { get; set; }
}

public class RevenueChartDto
{
    public List<string> Labels { get; set; } = new();
    public List<decimal> TotalRevenue { get; set; } = new();
    public List<decimal> PaidInvoices { get; set; } = new();
}
