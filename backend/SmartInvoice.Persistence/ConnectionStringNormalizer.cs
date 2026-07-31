using System;

namespace SmartInvoice.Persistence;

public static class ConnectionStringNormalizer
{
    public static string Normalize(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new ArgumentException("Connection string cannot be null or empty.", nameof(connectionString));

        var uri = new Uri(connectionString);
        var userInfo = uri.UserInfo.Split(':', 2);

        if (userInfo.Length != 2)
            throw new ArgumentException("Connection string must contain both username and password.", nameof(connectionString));

        var username = Uri.UnescapeDataString(userInfo[0]);
        var password = Uri.UnescapeDataString(userInfo[1]);
        var database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/'));
        var port = uri.IsDefaultPort ? 5432 : uri.Port;

        return $"Host={uri.Host};Port={port};Database={database};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
    }
}
