using MediatR;
using Microsoft.Extensions.Logging;
using SmartInvoice.Application.Common.Exceptions;
using SmartInvoice.Application.DTOs.Auth;
using SmartInvoice.Application.Interfaces;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Application.Features.Auth.Commands.Register;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, AuthResponseDto>
{
    private readonly IRepository<User> _userRepository;
    private readonly IJwtService _jwtService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<RegisterCommandHandler> _logger;

    public RegisterCommandHandler(
        IRepository<User> userRepository,
        IJwtService jwtService,
        IPasswordHasher passwordHasher,
        IUnitOfWork unitOfWork,
        ILogger<RegisterCommandHandler> logger)
    {
        _userRepository = userRepository;
        _jwtService = jwtService;
        _passwordHasher = passwordHasher;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<AuthResponseDto> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var existing = await _userRepository.FindAsync(
            u => u.Email == request.Email.ToLowerInvariant() && !u.IsDeleted,
            cancellationToken);

        if (existing.Any())
            throw new ValidationException(
                [new FluentValidation.Results.ValidationFailure("Email", "An account with this email already exists.")]);

        var user = new User
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = request.Email.ToLowerInvariant(),
            PasswordHash = _passwordHasher.Hash(request.Password),
        };

        var refreshToken = _jwtService.GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);

        await _userRepository.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var (accessToken, expiry) = _jwtService.GenerateAccessToken(user);

        _logger.LogInformation("New user registered: {Email}", user.Email);

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
