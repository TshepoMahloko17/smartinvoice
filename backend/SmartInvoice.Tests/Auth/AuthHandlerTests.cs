using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using SmartInvoice.Application.Common.Exceptions;
using SmartInvoice.Application.DTOs.Auth;
using SmartInvoice.Application.Features.Auth.Commands.Login;
using SmartInvoice.Application.Features.Auth.Commands.Register;
using SmartInvoice.Application.Interfaces;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Tests.Auth;

// ─── Shared helpers ────────────────────────────────────────────────────────────
file static class Helpers
{
    public static User MakeUser(string email = "jane@example.com") => new()
    {
        Id = Guid.NewGuid(),
        FirstName = "Jane",
        LastName = "Doe",
        Email = email,
        PasswordHash = "hashed-password"
    };

    public static (string Token, DateTime Expiry) FakeToken =>
        ("access-token", DateTime.UtcNow.AddHours(1));
}

// ─── LoginCommandHandler ──────────────────────────────────────────────────────
public class LoginCommandHandlerTests
{
    private readonly Mock<IRepository<User>> _userRepo = new();
    private readonly Mock<IJwtService> _jwt = new();
    private readonly Mock<IPasswordHasher> _hasher = new();
    private readonly Mock<IUnitOfWork> _uow = new();

    private LoginCommandHandler CreateHandler() => new(
        _userRepo.Object, _jwt.Object, _hasher.Object,
        _uow.Object, NullLogger<LoginCommandHandler>.Instance);

    [Fact]
    public async Task Handle_ValidCredentials_ReturnsAuthResponse()
    {
        var user = Helpers.MakeUser();
        _userRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync([user]);
        _hasher.Setup(h => h.Verify("secret", user.PasswordHash)).Returns(true);
        _jwt.Setup(j => j.GenerateAccessToken(user)).Returns(Helpers.FakeToken);
        _jwt.Setup(j => j.GenerateRefreshToken()).Returns("refresh-token");
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var result = await CreateHandler().Handle(
            new LoginCommand("jane@example.com", "secret"), CancellationToken.None);

        Assert.IsType<AuthResponseDto>(result);
        Assert.Equal("access-token", result.AccessToken);
        Assert.Equal("refresh-token", result.RefreshToken);
        Assert.Equal("jane@example.com", result.User.Email);
    }

    [Fact]
    public async Task Handle_UserNotFound_ThrowsUnauthorized()
    {
        _userRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync([]);

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            CreateHandler().Handle(new LoginCommand("nobody@example.com", "pass"), CancellationToken.None));
    }

    [Fact]
    public async Task Handle_WrongPassword_ThrowsUnauthorized()
    {
        var user = Helpers.MakeUser();
        _userRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync([user]);
        _hasher.Setup(h => h.Verify("wrongpass", user.PasswordHash)).Returns(false);

        await Assert.ThrowsAsync<UnauthorizedException>(() =>
            CreateHandler().Handle(new LoginCommand("jane@example.com", "wrongpass"), CancellationToken.None));
    }

    [Fact]
    public async Task Handle_ValidLogin_StoresRefreshTokenOnUser()
    {
        var user = Helpers.MakeUser();
        _userRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync([user]);
        _hasher.Setup(h => h.Verify(It.IsAny<string>(), It.IsAny<string>())).Returns(true);
        _jwt.Setup(j => j.GenerateAccessToken(user)).Returns(Helpers.FakeToken);
        _jwt.Setup(j => j.GenerateRefreshToken()).Returns("new-refresh");
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        await CreateHandler().Handle(new LoginCommand("jane@example.com", "secret"), CancellationToken.None);

        Assert.Equal("new-refresh", user.RefreshToken);
        Assert.NotNull(user.RefreshTokenExpiry);
    }

    [Fact]
    public async Task Handle_ValidLogin_SavesChanges()
    {
        var user = Helpers.MakeUser();
        _userRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync([user]);
        _hasher.Setup(h => h.Verify(It.IsAny<string>(), It.IsAny<string>())).Returns(true);
        _jwt.Setup(j => j.GenerateAccessToken(user)).Returns(Helpers.FakeToken);
        _jwt.Setup(j => j.GenerateRefreshToken()).Returns("refresh");
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        await CreateHandler().Handle(new LoginCommand("jane@example.com", "secret"), CancellationToken.None);

        _uow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}

// ─── RegisterCommandHandler ───────────────────────────────────────────────────
public class RegisterCommandHandlerTests
{
    private readonly Mock<IRepository<User>> _userRepo = new();
    private readonly Mock<IJwtService> _jwt = new();
    private readonly Mock<IPasswordHasher> _hasher = new();
    private readonly Mock<IUnitOfWork> _uow = new();

    private RegisterCommandHandler CreateHandler() => new(
        _userRepo.Object, _jwt.Object, _hasher.Object,
        _uow.Object, NullLogger<RegisterCommandHandler>.Instance);

    private static RegisterCommand DefaultCommand() =>
        new("Jane", "Doe", "jane@example.com", "password123");

    [Fact]
    public async Task Handle_NewUser_ReturnsAuthResponse()
    {
        _userRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync([]);
        _hasher.Setup(h => h.Hash("password123")).Returns("hashed");
        _jwt.Setup(j => j.GenerateRefreshToken()).Returns("refresh-token");
        _jwt.Setup(j => j.GenerateAccessToken(It.IsAny<User>())).Returns(Helpers.FakeToken);
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var result = await CreateHandler().Handle(DefaultCommand(), CancellationToken.None);

        Assert.IsType<AuthResponseDto>(result);
        Assert.Equal("access-token", result.AccessToken);
        Assert.Equal("Jane", result.User.FirstName);
        Assert.Equal("jane@example.com", result.User.Email);
    }

    [Fact]
    public async Task Handle_DuplicateEmail_ThrowsValidationException()
    {
        var existing = Helpers.MakeUser();
        _userRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync([existing]);

        await Assert.ThrowsAsync<ValidationException>(() =>
            CreateHandler().Handle(DefaultCommand(), CancellationToken.None));
    }

    [Fact]
    public async Task Handle_NewUser_HashesPassword()
    {
        _userRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync([]);
        _hasher.Setup(h => h.Hash("password123")).Returns("hashed");
        _jwt.Setup(j => j.GenerateRefreshToken()).Returns("r");
        _jwt.Setup(j => j.GenerateAccessToken(It.IsAny<User>())).Returns(Helpers.FakeToken);
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        await CreateHandler().Handle(DefaultCommand(), CancellationToken.None);

        _hasher.Verify(h => h.Hash("password123"), Times.Once);
    }

    [Fact]
    public async Task Handle_NewUser_StoresUserInRepository()
    {
        _userRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>(), It.IsAny<CancellationToken>()))
                 .ReturnsAsync([]);
        _hasher.Setup(h => h.Hash(It.IsAny<string>())).Returns("hashed");
        _jwt.Setup(j => j.GenerateRefreshToken()).Returns("r");
        _jwt.Setup(j => j.GenerateAccessToken(It.IsAny<User>())).Returns(Helpers.FakeToken);
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        await CreateHandler().Handle(DefaultCommand(), CancellationToken.None);

        _userRepo.Verify(r => r.AddAsync(It.Is<User>(u => u.Email == "jane@example.com"), It.IsAny<CancellationToken>()), Times.Once);
        _uow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
