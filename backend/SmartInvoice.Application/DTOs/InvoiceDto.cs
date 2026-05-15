using SmartInvoice.Domain.Enums;

namespace SmartInvoice.Application.DTOs;

public class InvoiceDto
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public Guid ClientId { get; set; }
    public string ClientName { get; set; } = string.Empty;
    public string ClientEmail { get; set; } = string.Empty;
    public DateTime IssuedDate { get; set; }
    public DateTime DueDate { get; set; }
    public InvoiceStatus Status { get; set; }
    public decimal Total { get; set; }
    public string? Notes { get; set; }
    public Currency Currency { get; set; }
    public List<InvoiceItemDto> Items { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class InvoiceItemDto
{
    public Guid Id { get; set; }
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal => Quantity * UnitPrice;
}

public class CreateInvoiceItemRequest
{
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}
