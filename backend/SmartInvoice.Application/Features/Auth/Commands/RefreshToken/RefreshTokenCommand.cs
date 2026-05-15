using MediatR;
using SmartInvoice.Application.Common.Exceptions;
using SmartInvoice.Application.DTOs.Auth;
using SmartInvoice.Application.Interfaces;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Application.Features.Auth.Commands.RefreshToken;

public record RefreshTokenCommand(string Token) : IRequest<AuthResponseDto>;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResponseDto>
{
    private readonly IRepository<User> _userRepository;
    private readonly IJwtService _jwtService;
    private readonly IUnitOfWork _unitOfWork;

    public RefreshTokenCommandHandler(
        IRepository<User> userRepository,
        IJwtService jwtService,
        IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _jwtService = jwtService;
        _unitOfWork = unitOfWork;
    }

    public async Task<AuthResponseDto> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var users = await _userRepository.FindAsync(
            u => u.RefreshToken == request.Token && u.RefreshTokenExpiry > DateTime.UtcNow,
            cancellationToken);

        var user = users.FirstOrDefault()
            ?? throw new UnauthorizedException("Invalid or expired refresh token.");

        var (accessToken, expiry) = _jwtService.GenerateAccessToken(user);
        var newRefreshToken = _jwtService.GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = expiry,
            User = new AuthUserDto { Id = user.Id, FullName = user.FullName, Email = user.Email }
        };
    }
}
