namespace SmartInvoice.Application.DTOs;

public class PaymentDto
{
    public Guid Id { get; set; }
    public Guid InvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime PaidOn { get; set; }
    public string? Method { get; set; }
    public string? Reference { get; set; }
    public DateTime CreatedAt { get; set; }
}
