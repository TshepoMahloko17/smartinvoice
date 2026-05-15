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
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName)));

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
