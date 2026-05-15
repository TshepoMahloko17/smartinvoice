namespace SmartInvoice.Domain.Entities;

public class Payment : BaseEntity
{
    public Guid InvoiceId { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaidOn { get; set; }
    public string? Method { get; set; }
    public string? Reference { get; set; }

    public Invoice Invoice { get; set; } = null!;
}
