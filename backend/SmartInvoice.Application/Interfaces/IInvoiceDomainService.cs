using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Enums;

namespace SmartInvoice.Application.Interfaces;

public interface IInvoiceDomainService
{
    Invoice CreateInvoice(
        string invoiceNumber,
        Guid clientId,
        Guid userId,
        DateTime issuedDate,
        DateTime dueDate,
        Currency currency,
        string? notes,
        IEnumerable<(string Description, int Quantity, decimal UnitPrice)> items);

    decimal GetOutstandingBalance(Invoice invoice, IEnumerable<Payment> existingPayments);

    void ApplyPaymentStatus(Invoice invoice, decimal totalPaid);
}