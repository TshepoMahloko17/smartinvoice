using Microsoft.Extensions.DependencyInjection;
using SmartInvoice.API.Services;
using SmartInvoice.Application.Interfaces;

namespace SmartInvoice.API.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection AddServiceExtensions(this IServiceCollection services)
    {
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        return services;
    }
}
