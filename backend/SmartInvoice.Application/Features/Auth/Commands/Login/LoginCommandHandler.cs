using MediatR;
using Microsoft.Extensions.Logging;
using SmartInvoice.Application.Common.Exceptions;
using SmartInvoice.Application.DTOs.Auth;
using SmartInvoice.Application.Interfaces;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Application.Features.Auth.Commands.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, AuthResponseDto>
{
    private readonly IRepository<User> _userRepository;
    private readonly IJwtService _jwtService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<LoginCommandHandler> _logger;

    public LoginCommandHandler(
        IRepository<User> userRepository,
        IJwtService jwtService,
        IPasswordHasher passwordHasher,
        IUnitOfWork unitOfWork,
        ILogger<LoginCommandHandler> logger)
    {
        _userRepository = userRepository;
        _jwtService = jwtService;
        _passwordHasher = passwordHasher;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<AuthResponseDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var users = await _userRepository.FindAsync(
            u => u.Email == request.Email.ToLowerInvariant() && !u.IsDeleted,
            cancellationToken);

        var user = users.FirstOrDefault()
            ?? throw new UnauthorizedException("Invalid credentials.");

        if (!_passwordHasher.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedException("Invalid credentials.");

        var (accessToken, expiry) = _jwtService.GenerateAccessToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        _userRepository.Update(user);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("User {Email} logged in successfully", user.Email);

        return new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = expiry,
            User = new AuthUserDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                FullName = user.FullName,
                Email = user.Email,
            },
        };
    }
}
