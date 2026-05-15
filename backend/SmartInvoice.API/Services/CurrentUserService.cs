using Microsoft.AspNetCore.Http;
using SmartInvoice.Application.Interfaces;

namespace SmartInvoice.API.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor) =>
        _httpContextAccessor = httpContextAccessor;

    public Guid? UserId
    {
        get
        {
            var value = _httpContextAccessor.HttpContext?.User
                .FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? _httpContextAccessor.HttpContext?.User
                .FindFirst("sub")?.Value;

            return Guid.TryParse(value, out var id) ? id : null;
        }
    }

    public string? Email =>
        _httpContextAccessor.HttpContext?.User
            .FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;

    public bool IsAuthenticated =>
        _httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated ?? false;
}
