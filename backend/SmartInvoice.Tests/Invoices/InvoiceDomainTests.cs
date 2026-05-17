using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Enums;

namespace SmartInvoice.Tests.Invoices;

/// <summary>
/// Unit tests for Invoice domain entity status-transition methods,
/// focused on the PartiallyPaid lifecycle.
/// </summary>
public class InvoiceDomainTests
{
    private static Invoice MakeInvoice() =>
        Invoice.Create("INV-0001", Guid.NewGuid(), Guid.NewGuid(),
            DateTime.UtcNow.AddDays(-5), DateTime.UtcNow.AddDays(25));

    // ─── MarkAsPartiallyPaid ──────────────────────────────────────────────────

    [Fact]
    public void MarkAsPartiallyPaid_SetsStatusToPartiallyPaid()
    {
        var invoice = MakeInvoice();
        invoice.MarkAsPartiallyPaid();
        Assert.Equal(InvoiceStatus.PartiallyPaid, invoice.Status);
    }

    [Fact]
    public void MarkAsPartiallyPaid_CanTransitionFromPending()
    {
        var invoice = MakeInvoice();
        Assert.Equal(InvoiceStatus.Pending, invoice.Status);
        invoice.MarkAsPartiallyPaid();
        Assert.Equal(InvoiceStatus.PartiallyPaid, invoice.Status);
    }

    [Fact]
    public void MarkAsPartiallyPaid_CanTransitionFromOverdue()
    {
        var invoice = MakeInvoice();
        invoice.MarkAsOverdue();
        invoice.MarkAsPartiallyPaid();
        Assert.Equal(InvoiceStatus.PartiallyPaid, invoice.Status);
    }

    [Fact]
    public void MarkAsPaid_AfterPartiallyPaid_SetsStatusToPaid()
    {
        var invoice = MakeInvoice();
        invoice.MarkAsPartiallyPaid();
        invoice.MarkAsPaid();
        Assert.Equal(InvoiceStatus.Paid, invoice.Status);
    }

    // ─── MarkAsPaid ───────────────────────────────────────────────────────────

    [Fact]
    public void MarkAsPaid_SetsStatusToPaid()
    {
        var invoice = MakeInvoice();
        invoice.MarkAsPaid();
        Assert.Equal(InvoiceStatus.Paid, invoice.Status);
    }

    [Fact]
    public void MarkAsPaid_RaisesDomainEvent()
    {
        var invoice = MakeInvoice();
        invoice.MarkAsPaid();
        Assert.Contains(invoice.DomainEvents, e => e.GetType().Name == "InvoicePaidEvent");
    }

    // ─── MarkAsOverdue ────────────────────────────────────────────────────────

    [Fact]
    public void MarkAsOverdue_SetsStatusToOverdue_WhenPending()
    {
        var invoice = MakeInvoice();
        invoice.MarkAsOverdue();
        Assert.Equal(InvoiceStatus.Overdue, invoice.Status);
    }

    [Fact]
    public void MarkAsOverdue_DoesNotOverwritePaid()
    {
        var invoice = MakeInvoice();
        invoice.MarkAsPaid();
        invoice.MarkAsOverdue();
        Assert.Equal(InvoiceStatus.Paid, invoice.Status);
    }

    [Fact]
    public void MarkAsOverdue_OverwritesPartiallyPaid()
    {
        // A partially paid invoice that passes its due date should become Overdue
        var invoice = MakeInvoice();
        invoice.MarkAsPartiallyPaid();
        invoice.MarkAsOverdue();
        Assert.Equal(InvoiceStatus.Overdue, invoice.Status);
    }

    // ─── UpdateStatus ─────────────────────────────────────────────────────────

    [Fact]
    public void UpdateStatus_ToPartiallyPaid_SetsStatusCorrectly()
    {
        var invoice = MakeInvoice();
        invoice.UpdateStatus(InvoiceStatus.PartiallyPaid);
        Assert.Equal(InvoiceStatus.PartiallyPaid, invoice.Status);
    }

    [Fact]
    public void UpdateStatus_ToPending_RollsBackFromPartiallyPaid()
    {
        var invoice = MakeInvoice();
        invoice.MarkAsPartiallyPaid();
        invoice.UpdateStatus(InvoiceStatus.Pending);
        Assert.Equal(InvoiceStatus.Pending, invoice.Status);
    }
}
