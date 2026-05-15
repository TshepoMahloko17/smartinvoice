namespace SmartInvoice.Domain.Entities;

public class User : BaseEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }

    public string FullName => $"{FirstName} {LastName}";

    public ICollection<Client> Clients { get; set; } = new List<Client>();
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    public ICollection<Contract> Contracts { get; set; } = new List<Contract>();
}
