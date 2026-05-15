using MediatR;
using SmartInvoice.Application.DTOs;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Enums;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Application.Features.Dashboard.Queries.GetRevenueChart;

public record GetRevenueChartQuery(Guid UserId, string Range = "6M") : IRequest<RevenueChartDto>;

public class GetRevenueChartHandler : IRequestHandler<GetRevenueChartQuery, RevenueChartDto>
{
    private readonly IRepository<Invoice> _invoiceRepository;

    public GetRevenueChartHandler(IRepository<Invoice> invoiceRepository) =>
        _invoiceRepository = invoiceRepository;

    public async Task<RevenueChartDto> Handle(GetRevenueChartQuery request, CancellationToken cancellationToken)
    {
        var months = request.Range switch
        {
            "3M" => 3,
            "1Y" => 12,
            _ => 6
        };

        var from = DateTime.UtcNow.AddMonths(-months);
        var invoices = (await _invoiceRepository.FindAsync(
            i => i.UserId == request.UserId && i.IssuedDate >= from && !i.IsDeleted,
            cancellationToken)).ToList();

        var result = new RevenueChartDto();

        for (int i = months - 1; i >= 0; i--)
        {
            var month = DateTime.UtcNow.AddMonths(-i);
            var label = month.ToString("MMM");
            result.Labels.Add(label);

            var monthInvoices = invoices
                .Where(inv => inv.IssuedDate.Year == month.Year && inv.IssuedDate.Month == month.Month)
                .ToList();

            result.TotalRevenue.Add(monthInvoices.Sum(inv => inv.Total));
            result.PaidInvoices.Add(monthInvoices
                .Where(inv => inv.Status == InvoiceStatus.Paid)
                .Sum(inv => inv.Total));
        }

        return result;
    }
}
