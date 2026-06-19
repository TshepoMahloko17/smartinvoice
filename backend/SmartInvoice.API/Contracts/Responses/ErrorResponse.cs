namespace SmartInvoice.API.Contracts.Responses;

public sealed record ErrorResponse(
    int Status,
    string Code,
    string Message,
    string CorrelationId,
    IDictionary<string, string[]>? Errors = null);