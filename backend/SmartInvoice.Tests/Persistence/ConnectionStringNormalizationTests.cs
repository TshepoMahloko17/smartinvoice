using SmartInvoice.Persistence;

namespace SmartInvoice.Tests.Persistence;

public class ConnectionStringNormalizationTests
{
    [Fact]
    public void NormalizeConnectionString_WhenUriHasNoExplicitPort_UsesDefaultPostgresPort()
    {
        const string connectionString = "postgresql://neondb_owner:npg_htbzAC06FPTn@ep-gentle-surf-aswcktym.c-4.eu-central-1.aws.neon.tech/neondb?sslmode=require";

        var normalized = ConnectionStringNormalizer.Normalize(connectionString);

        Assert.Contains("Port=5432", normalized);
        Assert.Contains("Host=ep-gentle-surf-aswcktym.c-4.eu-central-1.aws.neon.tech", normalized);
        Assert.Contains("Database=neondb", normalized);
        Assert.Contains("Username=neondb_owner", normalized);
        Assert.Contains("SSL Mode=Require", normalized);
    }
}
