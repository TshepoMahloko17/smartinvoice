using SmartInvoice.Domain.Enums;
using SmartInvoice.Domain.DomainEvents;

namespace SmartInvoice.Domain.Entities;

public class Invoice : BaseEntity
{
    public string InvoiceNumber { get; private set; } = string.Empty;
    public Guid ClientId { get; set; }
    public Guid UserId { get; set; }
    public DateTime IssuedDate { get; set; }
    public DateTime DueDate { get; set; }
    public InvoiceStatus Status { get; private set; } = InvoiceStatus.Pending;
    public decimal Total { get; private set; }
    public string? Notes { get; set; }
    public Currency Currency { get; set; } = Currency.USD;

    public Client Client { get; set; } = null!;
    public User User { get; set; } = null!;
    public ICollection<InvoiceItem> Items { get; private set; } = new List<InvoiceItem>();
    public ICollection<Payment> Payments { get; private set; } = new List<Payment>();
    public ICollection<Contract> Contracts { get; set; } = new List<Contract>();

    private readonly List<object> _domainEvents = new();
    public IReadOnlyList<object> DomainEvents => _domainEvents.AsReadOnly();

    public static Invoice Create(
        string invoiceNumber, Guid clientId, Guid userId,
        DateTime issuedDate, DateTime dueDate, Currency currency = Currency.USD)
    {
        var invoice = new Invoice
        {
            InvoiceNumber = invoiceNumber,
            ClientId = clientId,
            UserId = userId,
            IssuedDate = issuedDate,
            DueDate = dueDate,
            Currency = currency
        };
        invoice._domainEvents.Add(new InvoiceCreatedEvent(invoice.Id));
        return invoice;
    }

    public void AddItem(InvoiceItem item)
    {
        ((List<InvoiceItem>)Items).Add(item);
        RecalculateTotal();
    }

    public void RemoveItem(Guid itemId)
    {
        var item = Items.FirstOrDefault(i => i.Id == itemId);
        if (item is not null)
        {
            ((List<InvoiceItem>)Items).Remove(item);
            RecalculateTotal();
        }
    }

    public void RecalculateTotal() =>
        Total = Items.Sum(i => i.Quantity * i.UnitPrice);

    public void MarkAsPaid()
    {
        Status = InvoiceStatus.Paid;
        _domainEvents.Add(new InvoicePaidEvent(Id));
    }

    public void MarkAsPartiallyPaid()
    {
        Status = InvoiceStatus.PartiallyPaid;
    }

    public void MarkAsOverdue()
    {
        if (Status != InvoiceStatus.Paid)
        {
            Status = InvoiceStatus.Overdue;
            _domainEvents.Add(new InvoiceOverdueEvent(Id));
        }
    }

    public void UpdateStatus(InvoiceStatus status)
    {
        Status = status;
        switch (status)
        {
            case InvoiceStatus.Paid:
                _domainEvents.Add(new InvoicePaidEvent(Id));
                break;
            case InvoiceStatus.Overdue:
                _domainEvents.Add(new InvoiceOverdueEvent(Id));
                break;
        }
    }

    public void SetInvoiceNumber(string number) => InvoiceNumber = number;

    public void ClearDomainEvents() => _domainEvents.Clear();
}
