using Moq;
using SmartInvoice.Application.Common;
using SmartInvoice.Application.Features.Invoices.Queries.GetInvoices;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Enums;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Tests.Invoices;

public class GetInvoicesHandlerTests
{
    private readonly Mock<IRepository<Invoice>> _repo = new();
    private GetInvoicesHandler CreateHandler() => new(_repo.Object);

    private static Invoice MakeInvoice(decimal total = 1000m, InvoiceStatus status = InvoiceStatus.Pending)
    {
        var inv = Invoice.Create(
            "INV-0001",
            Guid.NewGuid(),
            Guid.NewGuid(),
            DateTime.UtcNow.AddDays(-5),
            DateTime.UtcNow.AddDays(25));
        typeof(Invoice).GetProperty("Total")!.SetValue(inv, total);
        typeof(Invoice).GetProperty("Client")!.SetValue(inv, new Client { Name = "Acme Corp", Email = "acme@example.com" });
        if (status != InvoiceStatus.Pending)
            inv.UpdateStatus(status);
        return inv;
    }

    private static Payment MakePayment(Guid invoiceId, decimal amount, bool isDeleted = false) =>
        new() { Id = Guid.NewGuid(), InvoiceId = invoiceId, Amount = amount, IsDeleted = isDeleted, PaidOn = DateTime.UtcNow };

    private void SetupRepo(IEnumerable<Invoice> items, int total = -1)
    {
        var list = items.ToList();
        _repo.Setup(r => r.GetPagedAsync(
                It.IsAny<int>(), It.IsAny<int>(),
                It.IsAny<System.Linq.Expressions.Expression<Func<Invoice, bool>>>(),
                It.IsAny<CancellationToken>()))
             .ReturnsAsync((list, total < 0 ? list.Count : total));
    }

    [Fact]
    public async Task Handle_EmptyResult_ReturnsEmptyPagedResult()
    {
        SetupRepo([]);
        var query = new GetInvoicesQuery(Guid.NewGuid());
        var result = await CreateHandler().Handle(query, CancellationToken.None);

        Assert.Empty(result.Items);
        Assert.Equal(0, result.TotalCount);
    }

    [Fact]
    public async Task Handle_InvoiceWithNoPayments_AmountPaidZeroBalanceEqualsTotal()
    {
        var invoice = MakeInvoice(total: 1000m);
        SetupRepo([invoice]);

        var result = await CreateHandler().Handle(new GetInvoicesQuery(Guid.NewGuid()), CancellationToken.None);
        var dto = result.Items.Single();

        Assert.Equal(0m, dto.AmountPaid);
        Assert.Equal(1000m, dto.Balance);
    }

    [Fact]
    public async Task Handle_InvoiceWithPartialPayment_AmountPaidAndBalanceCorrect()
    {
        var invoice = MakeInvoice(total: 1000m, status: InvoiceStatus.PartiallyPaid);
        invoice.Payments.Add(MakePayment(invoice.Id, 400m));
        SetupRepo([invoice]);

        var result = await CreateHandler().Handle(new GetInvoicesQuery(Guid.NewGuid()), CancellationToken.None);
        var dto = result.Items.Single();

        Assert.Equal(400m, dto.AmountPaid);
        Assert.Equal(600m, dto.Balance);
        Assert.Equal(InvoiceStatus.PartiallyPaid, dto.Status);
    }

    [Fact]
    public async Task Handle_DeletedPaymentsExcludedFromAmountPaid()
    {
        var invoice = MakeInvoice(total: 1000m);
        invoice.Payments.Add(MakePayment(invoice.Id, 300m, isDeleted: false));
        invoice.Payments.Add(MakePayment(invoice.Id, 500m, isDeleted: true));  // must be excluded
        SetupRepo([invoice]);

        var result = await CreateHandler().Handle(new GetInvoicesQuery(Guid.NewGuid()), CancellationToken.None);
        var dto = result.Items.Single();

        Assert.Equal(300m, dto.AmountPaid);
        Assert.Equal(700m, dto.Balance);
    }

    [Fact]
    public async Task Handle_FullyPaidInvoice_BalanceIsZero()
    {
        var invoice = MakeInvoice(total: 800m, status: InvoiceStatus.Paid);
        invoice.Payments.Add(MakePayment(invoice.Id, 800m));
        SetupRepo([invoice]);

        var result = await CreateHandler().Handle(new GetInvoicesQuery(Guid.NewGuid()), CancellationToken.None);
        var dto = result.Items.Single();

        Assert.Equal(800m, dto.AmountPaid);
        Assert.Equal(0m, dto.Balance);
    }

    [Fact]
    public async Task Handle_MultipleInvoices_EachHasCorrectAmountPaid()
    {
        var inv1 = MakeInvoice(total: 500m, status: InvoiceStatus.PartiallyPaid);
        inv1.Payments.Add(MakePayment(inv1.Id, 200m));

        var inv2 = MakeInvoice(total: 1000m);  // no payments

        SetupRepo([inv1, inv2]);

        var result = await CreateHandler().Handle(new GetInvoicesQuery(Guid.NewGuid()), CancellationToken.None);
        var dtos = result.Items.ToList();

        Assert.Equal(200m, dtos[0].AmountPaid);
        Assert.Equal(300m, dtos[0].Balance);
        Assert.Equal(0m, dtos[1].AmountPaid);
        Assert.Equal(1000m, dtos[1].Balance);
    }

    [Fact]
    public async Task Handle_ReturnsPaginationMetadata()
    {
        SetupRepo([], total: 25);
        var query = new GetInvoicesQuery(Guid.NewGuid(), PageNumber: 2, PageSize: 10);
        var result = await CreateHandler().Handle(query, CancellationToken.None);

        Assert.Equal(25, result.TotalCount);
        Assert.Equal(2, result.PageNumber);
        Assert.Equal(10, result.PageSize);
    }
}
