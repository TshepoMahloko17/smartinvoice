namespace SmartInvoice.Domain.ValueObjects;

public record Money(decimal Amount, string CurrencyCode)
{
    public static Money Zero(string currency = "USD") => new(0m, currency);

    public Money Add(Money other)
    {
        if (CurrencyCode != other.CurrencyCode)
            throw new InvalidOperationException("Cannot add money with different currencies.");
        return new Money(Amount + other.Amount, CurrencyCode);
    }

    public Money Subtract(Money other)
    {
        if (CurrencyCode != other.CurrencyCode)
            throw new InvalidOperationException("Cannot subtract money with different currencies.");
        return new Money(Amount - other.Amount, CurrencyCode);
    }

    public override string ToString() => $"{CurrencyCode} {Amount:F2}";
}
