namespace SmartInvoice.Domain.DomainEvents;

public record InvoiceOverdueEvent(Guid InvoiceId);
