namespace SmartInvoice.Application.Interfaces;

public interface IDateTimeService
{
    DateTime UtcNow { get; }
    DateOnly Today { get; }
}
