using Microsoft.Extensions.Configuration;
using SendGrid;
using SendGrid.Helpers.Mail;
using SmartInvoice.Application.Interfaces;

namespace SmartInvoice.Infrastructure.Services.Email;

public class SendGridEmailService : IEmailService
{
    private readonly IConfiguration _config;

    public SendGridEmailService(IConfiguration config) => _config = config;

    public async Task SendInvoiceEmailAsync(
        string toEmail, string toName, string invoiceNumber,
        byte[] pdfAttachment, CancellationToken cancellationToken = default)
    {
        var client = new SendGridClient(_config["SendGrid:ApiKey"]);
        var from = new EmailAddress(_config["SendGrid:FromEmail"], _config["SendGrid:FromName"]);
        var to = new EmailAddress(toEmail, toName);

        var msg = MailHelper.CreateSingleEmail(
            from, to,
            $"Invoice {invoiceNumber} from SmartInvoice",
            $"Please find your invoice {invoiceNumber} attached.",
            $"<p>Please find your invoice <strong>{invoiceNumber}</strong> attached.</p>");

        msg.AddAttachment(
            $"{invoiceNumber}.pdf",
            Convert.ToBase64String(pdfAttachment),
            "application/pdf");

        await client.SendEmailAsync(msg, cancellationToken);
    }

    public async Task SendWelcomeEmailAsync(
        string toEmail, string toName, CancellationToken cancellationToken = default)
    {
        var client = new SendGridClient(_config["SendGrid:ApiKey"]);
        var from = new EmailAddress(_config["SendGrid:FromEmail"], _config["SendGrid:FromName"]);
        var to = new EmailAddress(toEmail, toName);

        var msg = MailHelper.CreateSingleEmail(
            from, to,
            "Welcome to SmartInvoice",
            $"Hi {toName}, welcome to SmartInvoice!",
            $"<h2>Welcome, {toName}!</h2><p>Your account has been created successfully.</p>");

        await client.SendEmailAsync(msg, cancellationToken);
    }
}
