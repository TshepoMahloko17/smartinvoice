namespace SmartInvoice.Domain.ValueObjects;

public record Address(
    string Street,
    string City,
    string Province,
    string PostalCode,
    string Country);
