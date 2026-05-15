using Moq;
using SmartInvoice.Application.Features.Dashboard.Queries.GetDashboardStats;
using SmartInvoice.Application.Features.Dashboard.Queries.GetRevenueChart;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Enums;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Tests.Dashboard;

// ─── Shared helpers ────────────────────────────────────────────────────────────
file static class Helpers
{
    public static Invoice MakeInvoice(InvoiceStatus status, decimal total, DateTime? updatedAt = null)
    {
        var inv = new Invoice
        {
            Id = Guid.NewGuid(),
            ClientId = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            IssuedDate = DateTime.UtcNow.AddDays(-10),
            DueDate = DateTime.UtcNow.AddDays(20),
            UpdatedAt = updatedAt
        };
        typeof(Invoice).GetProperty("InvoiceNumber")!.SetValue(inv, "INV-001");
        return inv.WithStatus(status).WithTotal(total);
    }

    public static Invoice WithStatus(this Invoice inv, InvoiceStatus status)
    {
        typeof(Invoice).GetProperty(nameof(Invoice.Status))!.SetValue(inv, status);
        return inv;
    }

    public static Invoice WithTotal(this Invoice inv, decimal total)
    {
        typeof(Invoice).GetProperty(nameof(Invoice.Total))!.SetValue(inv, total);
        return inv;
    }

    public static Invoice WithIssuedDate(this Invoice inv, DateTime date)
    {
        inv.IssuedDate = date;
        return inv;
    }

    public static Client MakeClient(DateTime? createdAt = null) => new()
    {
        Id = Guid.NewGuid(),
        Name = "Client",
        Email = "client@example.com",
        CreatedAt = createdAt ?? DateTime.UtcNow.AddMonths(-2)
    };
}

// ─── GetDashboardStatsHandler ─────────────────────────────────────────────────
public class GetDashboardStatsHandlerTests
{
    private readonly Mock<IRepository<Invoice>> _invoiceRepo = new();
    private readonly Mock<IRepository<Client>> _clientRepo = new();

    private GetDashboardStatsHandler CreateHandler() =>
        new(_invoiceRepo.Object, _clientRepo.Object);

    private void SetupRepos(IEnumerable<Invoice> invoices, IEnumerable<Client> clients)
    {
        _invoiceRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Invoice, bool>>>(), It.IsAny<CancellationToken>()))
                    .ReturnsAsync(invoices);
        _clientRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Client, bool>>>(), It.IsAny<CancellationToken>()))
                   .ReturnsAsync(clients);
    }

    [Fact]
    public async Task Handle_WithPaidInvoices_ReturnsTotalRevenue()
    {
        var invoices = new[]
        {
            Helpers.MakeInvoice(InvoiceStatus.Paid, 5000m),
            Helpers.MakeInvoice(InvoiceStatus.Paid, 3000m),
            Helpers.MakeInvoice(InvoiceStatus.Pending, 1000m),
        };
        SetupRepos(invoices, [Helpers.MakeClient()]);

        var result = await CreateHandler().Handle(
            new GetDashboardStatsQuery(Guid.NewGuid()), CancellationToken.None);

        Assert.Equal(8000m, result.TotalRevenue);
    }

    [Fact]
    public async Task Handle_WithPendingInvoices_ReturnsPendingCount()
    {
        var invoices = new[]
        {
            Helpers.MakeInvoice(InvoiceStatus.Pending, 500m),
            Helpers.MakeInvoice(InvoiceStatus.Pending, 750m),
            Helpers.MakeInvoice(InvoiceStatus.Paid, 2000m),
        };
        SetupRepos(invoices, []);

        var result = await CreateHandler().Handle(
            new GetDashboardStatsQuery(Guid.NewGuid()), CancellationToken.None);

        Assert.Equal(2, result.PendingInvoicesCount);
        Assert.Equal(1250m, result.PendingInvoicesTotal);
    }

    [Fact]
    public async Task Handle_NoInvoices_ReturnsAllZeros()
    {
        SetupRepos([], []);

        var result = await CreateHandler().Handle(
            new GetDashboardStatsQuery(Guid.NewGuid()), CancellationToken.None);

        Assert.Equal(0m, result.TotalRevenue);
        Assert.Equal(0, result.PendingInvoicesCount);
        Assert.Equal(0m, result.PendingInvoicesTotal);
        Assert.Equal(0, result.ActiveClientsCount);
    }

    [Fact]
    public async Task Handle_WithClients_ReturnsActiveClientsCount()
    {
        SetupRepos([], [Helpers.MakeClient(), Helpers.MakeClient(), Helpers.MakeClient()]);

        var result = await CreateHandler().Handle(
            new GetDashboardStatsQuery(Guid.NewGuid()), CancellationToken.None);

        Assert.Equal(3, result.ActiveClientsCount);
    }

    [Fact]
    public async Task Handle_NewClientsThisMonth_CountedCorrectly()
    {
        var now = DateTime.UtcNow;
        var clients = new[]
        {
            Helpers.MakeClient(now.AddDays(-2)),  // this month
            Helpers.MakeClient(now.AddDays(-1)),  // this month
            Helpers.MakeClient(now.AddMonths(-2)), // older
        };
        SetupRepos([], clients);

        var result = await CreateHandler().Handle(
            new GetDashboardStatsQuery(Guid.NewGuid()), CancellationToken.None);

        Assert.Equal(2, result.NewClientsThisMonth);
    }

    [Fact]
    public async Task Handle_PaidThisMonth_CountedCorrectly()
    {
        var now = DateTime.UtcNow;
        var invoices = new[]
        {
            Helpers.MakeInvoice(InvoiceStatus.Paid, 2000m, updatedAt: now.AddDays(-3)),   // this month
            Helpers.MakeInvoice(InvoiceStatus.Paid, 1500m, updatedAt: now.AddMonths(-2)), // older
        };
        SetupRepos(invoices, []);

        var result = await CreateHandler().Handle(
            new GetDashboardStatsQuery(Guid.NewGuid()), CancellationToken.None);

        Assert.Equal(2000m, result.PaidThisMonth);
    }
}

// ─── GetRevenueChartHandler ───────────────────────────────────────────────────
public class GetRevenueChartHandlerTests
{
    private readonly Mock<IRepository<Invoice>> _repo = new();

    private GetRevenueChartHandler CreateHandler() => new(_repo.Object);

    private static Invoice MakeIssuedInvoice(InvoiceStatus status, decimal total, DateTime issuedDate)
    {
        var inv = new Invoice
        {
            Id = Guid.NewGuid(),
            IssuedDate = issuedDate,
            DueDate = issuedDate.AddDays(30),
        };
        typeof(Invoice).GetProperty("InvoiceNumber")!.SetValue(inv, "INV-001");
        return inv.WithStatus(status).WithTotal(total);
    }

    [Fact]
    public async Task Handle_DefaultRange_Returns6Labels()
    {
        _repo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Invoice, bool>>>(), It.IsAny<CancellationToken>()))
             .ReturnsAsync([]);

        var result = await CreateHandler().Handle(
            new GetRevenueChartQuery(Guid.NewGuid()), CancellationToken.None);

        Assert.Equal(6, result.Labels.Count);
        Assert.Equal(6, result.TotalRevenue.Count);
        Assert.Equal(6, result.PaidInvoices.Count);
    }

    [Fact]
    public async Task Handle_3MRange_Returns3Labels()
    {
        _repo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Invoice, bool>>>(), It.IsAny<CancellationToken>()))
             .ReturnsAsync([]);

        var result = await CreateHandler().Handle(
            new GetRevenueChartQuery(Guid.NewGuid(), "3M"), CancellationToken.None);

        Assert.Equal(3, result.Labels.Count);
    }

    [Fact]
    public async Task Handle_1YRange_Returns12Labels()
    {
        _repo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Invoice, bool>>>(), It.IsAny<CancellationToken>()))
             .ReturnsAsync([]);

        var result = await CreateHandler().Handle(
            new GetRevenueChartQuery(Guid.NewGuid(), "1Y"), CancellationToken.None);

        Assert.Equal(12, result.Labels.Count);
    }

    [Fact]
    public async Task Handle_InvoicesInCurrentMonth_SummedInLastLabel()
    {
        var now = DateTime.UtcNow;
        var invoices = new[]
        {
            MakeIssuedInvoice(InvoiceStatus.Paid, 4000m, new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc)),
            MakeIssuedInvoice(InvoiceStatus.Pending, 1000m, new DateTime(now.Year, now.Month, 5, 0, 0, 0, DateTimeKind.Utc)),
        };

        _repo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Invoice, bool>>>(), It.IsAny<CancellationToken>()))
             .ReturnsAsync(invoices);

        var result = await CreateHandler().Handle(
            new GetRevenueChartQuery(Guid.NewGuid(), "6M"), CancellationToken.None);

        var lastTotal = result.TotalRevenue.Last();
        var lastPaid = result.PaidInvoices.Last();

        Assert.Equal(5000m, lastTotal);  // 4000 + 1000
        Assert.Equal(4000m, lastPaid);   // only Paid
    }

    [Fact]
    public async Task Handle_NoInvoices_AllZeroAmounts()
    {
        _repo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Invoice, bool>>>(), It.IsAny<CancellationToken>()))
             .ReturnsAsync([]);

        var result = await CreateHandler().Handle(
            new GetRevenueChartQuery(Guid.NewGuid(), "6M"), CancellationToken.None);

        Assert.All(result.TotalRevenue, v => Assert.Equal(0m, v));
        Assert.All(result.PaidInvoices, v => Assert.Equal(0m, v));
    }
}


