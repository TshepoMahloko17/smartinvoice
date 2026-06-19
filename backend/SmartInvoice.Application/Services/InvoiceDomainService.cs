using SmartInvoice.Application.Interfaces;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Enums;

namespace SmartInvoice.Application.Services;

public class InvoiceDomainService : IInvoiceDomainService
{
    public Invoice CreateInvoice(
        string invoiceNumber,
        Guid clientId,
        Guid userId,
        DateTime issuedDate,
        DateTime dueDate,
        Currency currency,
        string? notes,
        IEnumerable<(string Description, int Quantity, decimal UnitPrice)> items)
    {
        var invoice = Invoice.Create(
            invoiceNumber,
            clientId,
            userId,
            issuedDate,
            dueDate,
            currency);

        invoice.Notes = notes;

        foreach (var item in items)
        {
            invoice.AddItem(new InvoiceItem
            {
                Description = item.Description,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                InvoiceId = invoice.Id
            });
        }

        return invoice;
    }

    public decimal GetOutstandingBalance(Invoice invoice, IEnumerable<Payment> existingPayments)
    {
        var totalAlreadyPaid = existingPayments.Sum(p => p.Amount);
        return invoice.Total - totalAlreadyPaid;
    }

    public void ApplyPaymentStatus(Invoice invoice, decimal totalPaid)
    {
        if (totalPaid >= invoice.Total)
        {
            invoice.MarkAsPaid();
            return;
        }

        if (totalPaid > 0)
        {
            invoice.MarkAsPartiallyPaid();
            return;
        }

        invoice.UpdateStatus(InvoiceStatus.Pending);
    }
}