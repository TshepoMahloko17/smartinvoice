namespace SmartInvoice.Application.Interfaces;

public interface IEmailService
{
    Task SendInvoiceEmailAsync(
        string toEmail,
        string toName,
        string invoiceNumber,
        byte[] pdfAttachment,
        CancellationToken cancellationToken = default);

    Task SendWelcomeEmailAsync(
        string toEmail,
        string toName,
        CancellationToken cancellationToken = default);
}
