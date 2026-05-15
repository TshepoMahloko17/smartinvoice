using SmartInvoice.Domain.ValueObjects;

namespace SmartInvoice.Domain.Entities;

public class Client : BaseEntity
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? CompanyName { get; set; }
    public Address? BillingAddress { get; set; }

    public User User { get; set; } = null!;
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    public ICollection<Contract> Contracts { get; set; } = new List<Contract>();
}
