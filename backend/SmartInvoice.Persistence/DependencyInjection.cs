using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Interfaces;
using SmartInvoice.Persistence.Context;
using SmartInvoice.Persistence.Repositories;

namespace SmartInvoice.Persistence;

public static class DependencyInjection
{
    public static IServiceCollection AddPersistence(
        this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")!;

        // Railway provides DATABASE_URL in postgresql:// URI format — convert to Npgsql key=value format
        if (connectionString.StartsWith("postgres://") || connectionString.StartsWith("postgresql://"))
        {
            var uri = new Uri(connectionString);
            var userInfo = uri.UserInfo.Split(':');
            connectionString = $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.TrimStart('/')};Username={userInfo[0]};Password={userInfo[1]};SSL Mode=Require;Trust Server Certificate=true";
        }

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(
                connectionString,
                b =>
                {
                    b.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
                    b.EnableRetryOnFailure(
                        maxRetryCount: 5,
                        maxRetryDelay: TimeSpan.FromSeconds(10),
                        errorCodesToAdd: null);
                }));

        services.AddScoped<IUnitOfWork, UnitOfWork>();

        services.AddScoped<IRepository<User>, GenericRepository<User>>();
        services.AddScoped<IRepository<Client>, ClientRepository>();
        services.AddScoped<IRepository<Invoice>, InvoiceRepository>();
        services.AddScoped<IRepository<InvoiceItem>, GenericRepository<InvoiceItem>>();
        services.AddScoped<IRepository<Contract>, ContractRepository>();
        services.AddScoped<IRepository<Payment>, PaymentRepository>();

        return services;
    }
}
