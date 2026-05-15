using MediatR;
using SmartInvoice.Application.DTOs;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Enums;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Application.Features.Dashboard.Queries.GetDashboardStats;

public record GetDashboardStatsQuery(Guid UserId) : IRequest<DashboardStatsDto>;

public class GetDashboardStatsHandler : IRequestHandler<GetDashboardStatsQuery, DashboardStatsDto>
{
    private readonly IRepository<Invoice> _invoiceRepository;
    private readonly IRepository<Client> _clientRepository;

    public GetDashboardStatsHandler(
        IRepository<Invoice> invoiceRepository,
        IRepository<Client> clientRepository)
    {
        _invoiceRepository = invoiceRepository;
        _clientRepository = clientRepository;
    }

    public async Task<DashboardStatsDto> Handle(GetDashboardStatsQuery request, CancellationToken cancellationToken)
    {
        var invoices = await _invoiceRepository.FindAsync(
            i => i.UserId == request.UserId && !i.IsDeleted, cancellationToken);

        var clients = await _clientRepository.FindAsync(
            c => c.UserId == request.UserId && !c.IsDeleted, cancellationToken);

        var now = DateTime.UtcNow;
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var startOfLastMonth = startOfMonth.AddMonths(-1);

        var invoiceList = invoices.ToList();
        var clientList = clients.ToList();

        var totalRevenue = invoiceList
            .Where(i => i.Status == InvoiceStatus.Paid)
            .Sum(i => i.Total);

        var pendingInvoices = invoiceList
            .Where(i => i.Status == InvoiceStatus.Pending)
            .ToList();

        var paidThisMonth = invoiceList
            .Where(i => i.Status == InvoiceStatus.Paid && i.UpdatedAt >= startOfMonth)
            .Sum(i => i.Total);

        var paidLastMonth = invoiceList
            .Where(i => i.Status == InvoiceStatus.Paid
                        && i.UpdatedAt >= startOfLastMonth
                        && i.UpdatedAt < startOfMonth)
            .Sum(i => i.Total);

        var newClientsThisMonth = clientList.Count(c => c.CreatedAt >= startOfMonth);

        var revenueLastMonth = invoiceList
            .Where(i => i.Status == InvoiceStatus.Paid
                        && i.UpdatedAt >= startOfLastMonth
                        && i.UpdatedAt < startOfMonth)
            .Sum(i => i.Total);

        var pendingLastMonth = invoiceList
            .Where(i => i.Status == InvoiceStatus.Pending
                        && i.CreatedAt >= startOfLastMonth
                        && i.CreatedAt < startOfMonth)
            .Count();

        var pendingThisMonth = invoiceList
            .Where(i => i.Status == InvoiceStatus.Pending
                        && i.CreatedAt >= startOfMonth)
            .Count();

        return new DashboardStatsDto
        {
            TotalRevenue = totalRevenue,
            RevenueChangePercent = revenueLastMonth == 0 ? null :
                Math.Round((paidThisMonth - revenueLastMonth) / revenueLastMonth * 100, 1),
            PendingInvoicesCount = pendingInvoices.Count,
            PendingInvoicesTotal = pendingInvoices.Sum(i => i.Total),
            PendingChangePercent = pendingLastMonth == 0 ? null :
                Math.Round(((decimal)pendingThisMonth - pendingLastMonth) / pendingLastMonth * 100, 1),
            ActiveClientsCount = clientList.Count,
            NewClientsThisMonth = newClientsThisMonth,
            PaidThisMonth = paidThisMonth,
            PaidChangePercent = paidLastMonth == 0 ? null :
                Math.Round((paidThisMonth - paidLastMonth) / paidLastMonth * 100, 1)
        };
    }
}
