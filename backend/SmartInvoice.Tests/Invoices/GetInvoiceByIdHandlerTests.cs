using Moq;
using SmartInvoice.Application.Common.Exceptions;
using SmartInvoice.Application.DTOs;
using SmartInvoice.Application.Features.Invoices.Queries.GetInvoiceById;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Enums;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Tests.Invoices;

file static class QueryHelpers
{
    public static Invoice MakeInvoice(Guid? id = null, decimal total = 1000m, InvoiceStatus status = InvoiceStatus.Pending)
    {
        var inv = Invoice.Create(
            "INV-0001",
            Guid.NewGuid(),
            Guid.NewGuid(),
            DateTime.UtcNow.AddDays(-5),
            DateTime.UtcNow.AddDays(25));

        if (id.HasValue)
            typeof(Invoice).BaseType!.GetProperty("Id")!.SetValue(inv, id.Value);

        typeof(Invoice).GetProperty("Total")!.SetValue(inv, total);

        // Attach a client stub so ClientName / ClientEmail can be mapped
        var client = new Client { Name = "Acme Corp", Email = "acme@example.com" };
        typeof(Invoice).GetProperty("Client")!.SetValue(inv, client);

        if (status != InvoiceStatus.Pending)
            inv.UpdateStatus(status);

        return inv;
    }

    public static Payment MakePayment(Guid invoiceId, decimal amount, bool isDeleted = false) =>
        new() { Id = Guid.NewGuid(), InvoiceId = invoiceId, Amount = amount, IsDeleted = isDeleted, PaidOn = DateTime.UtcNow };
}

// ─── GetInvoiceByIdHandler ────────────────────────────────────────────────────
public class GetInvoiceByIdHandlerTests
{
    private readonly Mock<IRepository<Invoice>> _repo = new();
    private GetInvoiceByIdHandler CreateHandler() => new(_repo.Object);

    [Fact]
    public async Task Handle_InvoiceNotFound_ThrowsNotFoundException()
    {
        _repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
             .ReturnsAsync((Invoice?)null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            CreateHandler().Handle(new GetInvoiceByIdQuery(Guid.NewGuid()), CancellationToken.None));
    }

    [Fact]
    public async Task Handle_NoPayments_AmountPaidIsZeroAndBalanceEqualsTotal()
    {
        var invoice = QueryHelpers.MakeInvoice(total: 1000m);
        _repo.Setup(r => r.GetByIdAsync(invoice.Id, It.IsAny<CancellationToken>()))
             .ReturnsAsync(invoice);

        var result = await CreateHandler().Handle(new GetInvoiceByIdQuery(invoice.Id), CancellationToken.None);

        Assert.Equal(0m, result.AmountPaid);
        Assert.Equal(1000m, result.Balance);
        Assert.Equal(1000m, result.Total);
    }

    [Fact]
    public async Task Handle_SinglePartialPayment_AmountPaidAndBalanceCorrect()
    {
        var invoice = QueryHelpers.MakeInvoice(total: 1000m);
        invoice.Payments.Add(QueryHelpers.MakePayment(invoice.Id, 400m));
        _repo.Setup(r => r.GetByIdAsync(invoice.Id, It.IsAny<CancellationToken>()))
             .ReturnsAsync(invoice);

        var result = await CreateHandler().Handle(new GetInvoiceByIdQuery(invoice.Id), CancellationToken.None);

        Assert.Equal(400m, result.AmountPaid);
        Assert.Equal(600m, result.Balance);
    }

    [Fact]
    public async Task Handle_MultiplePartialPayments_SumsCorrectly()
    {
        var invoice = QueryHelpers.MakeInvoice(total: 1000m);
        invoice.Payments.Add(QueryHelpers.MakePayment(invoice.Id, 300m));
        invoice.Payments.Add(QueryHelpers.MakePayment(invoice.Id, 250m));
        _repo.Setup(r => r.GetByIdAsync(invoice.Id, It.IsAny<CancellationToken>()))
             .ReturnsAsync(invoice);

        var result = await CreateHandler().Handle(new GetInvoiceByIdQuery(invoice.Id), CancellationToken.None);

        Assert.Equal(550m, result.AmountPaid);
        Assert.Equal(450m, result.Balance);
    }

    [Fact]
    public async Task Handle_DeletedPaymentsExcludedFromAmountPaid()
    {
        var invoice = QueryHelpers.MakeInvoice(total: 1000m);
        invoice.Payments.Add(QueryHelpers.MakePayment(invoice.Id, 400m, isDeleted: false));
        invoice.Payments.Add(QueryHelpers.MakePayment(invoice.Id, 200m, isDeleted: true));  // deleted — must be excluded
        _repo.Setup(r => r.GetByIdAsync(invoice.Id, It.IsAny<CancellationToken>()))
             .ReturnsAsync(invoice);

        var result = await CreateHandler().Handle(new GetInvoiceByIdQuery(invoice.Id), CancellationToken.None);

        Assert.Equal(400m, result.AmountPaid);
        Assert.Equal(600m, result.Balance);
    }

    [Fact]
    public async Task Handle_FullyPaidInvoice_BalanceIsZero()
    {
        var invoice = QueryHelpers.MakeInvoice(total: 1000m, status: InvoiceStatus.Paid);
        invoice.Payments.Add(QueryHelpers.MakePayment(invoice.Id, 1000m));
        _repo.Setup(r => r.GetByIdAsync(invoice.Id, It.IsAny<CancellationToken>()))
             .ReturnsAsync(invoice);

        var result = await CreateHandler().Handle(new GetInvoiceByIdQuery(invoice.Id), CancellationToken.None);

        Assert.Equal(1000m, result.AmountPaid);
        Assert.Equal(0m, result.Balance);
        Assert.Equal(InvoiceStatus.Paid, result.Status);
    }

    [Fact]
    public async Task Handle_PartiallyPaidInvoice_ReturnsPartiallyPaidStatus()
    {
        var invoice = QueryHelpers.MakeInvoice(total: 1000m, status: InvoiceStatus.PartiallyPaid);
        invoice.Payments.Add(QueryHelpers.MakePayment(invoice.Id, 600m));
        _repo.Setup(r => r.GetByIdAsync(invoice.Id, It.IsAny<CancellationToken>()))
             .ReturnsAsync(invoice);

        var result = await CreateHandler().Handle(new GetInvoiceByIdQuery(invoice.Id), CancellationToken.None);

        Assert.Equal(InvoiceStatus.PartiallyPaid, result.Status);
        Assert.Equal(600m, result.AmountPaid);
        Assert.Equal(400m, result.Balance);
    }

    [Fact]
    public async Task Handle_MapsClientNameAndEmail()
    {
        var invoice = QueryHelpers.MakeInvoice(total: 500m);
        _repo.Setup(r => r.GetByIdAsync(invoice.Id, It.IsAny<CancellationToken>()))
             .ReturnsAsync(invoice);

        var result = await CreateHandler().Handle(new GetInvoiceByIdQuery(invoice.Id), CancellationToken.None);

        Assert.Equal("Acme Corp", result.ClientName);
        Assert.Equal("acme@example.com", result.ClientEmail);
    }
}
