namespace SmartInvoice.Domain.Entities;

public class Contract : BaseEntity
{
    public Guid ClientId { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsSigned { get; set; }
    public Guid? LinkedInvoiceId { get; set; }

    public Client Client { get; set; } = null!;
    public User User { get; set; } = null!;
    public Invoice? LinkedInvoice { get; set; }
}
