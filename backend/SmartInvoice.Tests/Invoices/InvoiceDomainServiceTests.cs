using SmartInvoice.Application.Services;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Enums;

namespace SmartInvoice.Tests.Invoices;

public class InvoiceDomainServiceTests
{
    private readonly InvoiceDomainService _service = new();

    [Fact]
    public void CreateInvoice_WithItems_ComputesTotalAndCopiesMetadata()
    {
        var clientId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var result = _service.CreateInvoice(
            invoiceNumber: "INV-0100",
            clientId: clientId,
            userId: userId,
            issuedDate: DateTime.UtcNow,
            dueDate: DateTime.UtcNow.AddDays(7),
            currency: Currency.ZAR,
            notes: "Milestone billing",
            items:
            [
                ("Design", 2, 200m),
                ("Implementation", 3, 400m)
            ]);

        Assert.Equal("INV-0100", result.InvoiceNumber);
        Assert.Equal(clientId, result.ClientId);
        Assert.Equal(userId, result.UserId);
        Assert.Equal(Currency.ZAR, result.Currency);
        Assert.Equal("Milestone billing", result.Notes);
        Assert.Equal(1600m, result.Total);
    }

    [Fact]
    public void ApplyPaymentStatus_ZeroPaid_SetsPending()
    {
        var invoice = Invoice.Create(
            "INV-0001",
            Guid.NewGuid(),
            Guid.NewGuid(),
            DateTime.UtcNow,
            DateTime.UtcNow.AddDays(30));

        _service.ApplyPaymentStatus(invoice, 0m);

        Assert.Equal(InvoiceStatus.Pending, invoice.Status);
    }

    [Fact]
    public void ApplyPaymentStatus_PartialPaid_SetsPartiallyPaid()
    {
        var invoice = Invoice.Create(
            "INV-0001",
            Guid.NewGuid(),
            Guid.NewGuid(),
            DateTime.UtcNow,
            DateTime.UtcNow.AddDays(30));
        invoice.AddItem(new InvoiceItem { Description = "Dev", Quantity = 1, UnitPrice = 1000m, InvoiceId = invoice.Id });

        _service.ApplyPaymentStatus(invoice, 250m);

        Assert.Equal(InvoiceStatus.PartiallyPaid, invoice.Status);
    }

    [Fact]
    public void ApplyPaymentStatus_FullPaid_SetsPaid()
    {
        var invoice = Invoice.Create(
            "INV-0001",
            Guid.NewGuid(),
            Guid.NewGuid(),
            DateTime.UtcNow,
            DateTime.UtcNow.AddDays(30));
        invoice.AddItem(new InvoiceItem { Description = "Dev", Quantity = 1, UnitPrice = 1000m, InvoiceId = invoice.Id });

        _service.ApplyPaymentStatus(invoice, 1000m);

        Assert.Equal(InvoiceStatus.Paid, invoice.Status);
    }

    [Fact]
    public void GetOutstandingBalance_UsesNonDeletedPaymentsSum()
    {
        var invoice = Invoice.Create(
            "INV-0001",
            Guid.NewGuid(),
            Guid.NewGuid(),
            DateTime.UtcNow,
            DateTime.UtcNow.AddDays(30));
        invoice.AddItem(new InvoiceItem { Description = "Dev", Quantity = 1, UnitPrice = 1000m, InvoiceId = invoice.Id });

        var payments = new List<Payment>
        {
            new() { Amount = 400m },
            new() { Amount = 100m }
        };

        var balance = _service.GetOutstandingBalance(invoice, payments);
        Assert.Equal(500m, balance);
    }
}