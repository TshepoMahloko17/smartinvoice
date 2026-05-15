namespace SmartInvoice.Application.Interfaces;

public interface IPdfService
{
    Task<byte[]> GenerateInvoicePdfAsync(Guid invoiceId, CancellationToken cancellationToken = default);
}
