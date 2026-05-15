using SmartInvoice.Domain.Entities;

namespace SmartInvoice.Application.Interfaces;

public interface IJwtService
{
    (string Token, DateTime Expiry) GenerateAccessToken(User user);
    string GenerateRefreshToken();
    bool ValidateRefreshToken(string token);
}
