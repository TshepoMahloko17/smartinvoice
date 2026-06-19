using Microsoft.Extensions.DependencyInjection;
using SmartInvoice.Application.Interfaces;
using SmartInvoice.Infrastructure.Identity;
using SmartInvoice.Infrastructure.Services;
using SmartInvoice.Infrastructure.Services.Email;
using SmartInvoice.Infrastructure.Services.Pdf;
using SendGrid;

namespace SmartInvoice.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddScoped<ISendGridClient>(sp =>
        {
            var configuration = sp.GetRequiredService<Microsoft.Extensions.Configuration.IConfiguration>();
            return new SendGridClient(configuration["SendGrid:ApiKey"]);
        });

        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
        services.AddScoped<IEmailService, SendGridEmailService>();
        services.AddScoped<IPdfService, PdfService>();
        services.AddSingleton<IDateTimeService, DateTimeService>();

        return services;
    }
}
