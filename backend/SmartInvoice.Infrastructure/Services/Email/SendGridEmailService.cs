using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SendGrid;
using SendGrid.Helpers.Mail;
using SmartInvoice.Application.Interfaces;

namespace SmartInvoice.Infrastructure.Services.Email;

public class SendGridEmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SendGridEmailService> _logger;
    private readonly ISendGridClient _client;

    public SendGridEmailService(
        IConfiguration config,
        ILogger<SendGridEmailService> logger,
        ISendGridClient client)
    {
        _config = config;
        _logger = logger;
        _client = client;
    }

    public async Task SendInvoiceEmailAsync(
        string toEmail, string toName, string invoiceNumber,
        byte[] pdfAttachment, CancellationToken cancellationToken = default)
    {
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

        await SendWithRetryAsync(msg, "invoice_email", toEmail, cancellationToken);
    }

    public async Task SendWelcomeEmailAsync(
        string toEmail, string toName, CancellationToken cancellationToken = default)
    {
        var from = new EmailAddress(_config["SendGrid:FromEmail"], _config["SendGrid:FromName"]);
        var to = new EmailAddress(toEmail, toName);

        var msg = MailHelper.CreateSingleEmail(
            from, to,
            "Welcome to SmartInvoice",
            $"Hi {toName}, welcome to SmartInvoice!",
            $"<h2>Welcome, {toName}!</h2><p>Your account has been created successfully.</p>");

        await SendWithRetryAsync(msg, "welcome_email", toEmail, cancellationToken);
    }

    private async Task SendWithRetryAsync(
        SendGridMessage message,
        string emailType,
        string recipient,
        CancellationToken cancellationToken)
    {
        const int maxAttempts = 3;

        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                var response = await _client.SendEmailAsync(message, cancellationToken);
                if ((int)response.StatusCode < 500)
                {
                    if (!response.IsSuccessStatusCode)
                    {
                        _logger.LogWarning(
                            "SendGrid non-success for {EmailType} to {Recipient}. StatusCode: {StatusCode}",
                            emailType,
                            recipient,
                            (int)response.StatusCode);
                    }

                    return;
                }

                throw new HttpRequestException(
                    $"SendGrid transient failure with status {(int)response.StatusCode}.");
            }
            catch (Exception ex) when (attempt < maxAttempts)
            {
                var backoff = TimeSpan.FromMilliseconds(Math.Pow(2, attempt) * 200 + Random.Shared.Next(100, 400));
                _logger.LogWarning(
                    ex,
                    "Retrying SendGrid call for {EmailType} to {Recipient}. Attempt {Attempt}/{MaxAttempts} after {BackoffMs}ms",
                    emailType,
                    recipient,
                    attempt,
                    maxAttempts,
                    backoff.TotalMilliseconds);

                await Task.Delay(backoff, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "SendGrid call failed for {EmailType} to {Recipient} after retries.",
                    emailType,
                    recipient);
                throw;
            }
        }
    }
}
