using Microsoft.EntityFrameworkCore;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Persistence.Context;

namespace SmartInvoice.API.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        // Apply pending migrations automatically
        await db.Database.MigrateAsync();

        // Seed default admin user if none exists
        if (!await db.Users.AnyAsync())
        {
            var user = new User
            {
                Id = Guid.NewGuid(),
                FirstName = "Admin",
                LastName = "User",
                Email = "admin@smartinvoice.app",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123", workFactor: 12),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            db.Users.Add(user);
            await db.SaveChangesAsync();

            Console.WriteLine("✅ Seeded default user: admin@smartinvoice.app / Admin@123");
        }
    }
}
