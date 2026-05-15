namespace SmartInvoice.Application.DTOs;

public class ContractDto
{
    public Guid Id { get; set; }
    public Guid ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsSigned { get; set; }
    public Guid? LinkedInvoiceId { get; set; }
    public DateTime CreatedAt { get; set; }
}
