using Moq;
using SmartInvoice.Application.Common.Exceptions;
using SmartInvoice.Application.DTOs;
using SmartInvoice.Application.Features.Clients.Commands;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Tests.Clients;

public class CreateClientHandlerTests
{
    private readonly Mock<IRepository<Client>> _repo = new();
    private readonly Mock<IUnitOfWork> _uow = new();

    private CreateClientHandler CreateHandler() => new(_repo.Object, _uow.Object);

    [Fact]
    public async Task Handle_ValidCommand_ReturnsClientDto()
    {
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var command = new CreateClientCommand(
            UserId: Guid.NewGuid(),
            Name: "Jane Doe",
            Email: "Jane@Example.COM",
            Phone: "012 345 6789",
            CompanyName: "Doe Ltd"
        );

        var result = await CreateHandler().Handle(command, CancellationToken.None);

        Assert.IsType<ClientDto>(result);
        Assert.Equal("Jane Doe", result.Name);
        Assert.Equal("jane@example.com", result.Email);  // lowercased
        Assert.Equal("Doe Ltd", result.CompanyName);
    }

    [Fact]
    public async Task Handle_ValidCommand_EmailIsLowercased()
    {
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var command = new CreateClientCommand(
            UserId: Guid.NewGuid(),
            Name: "Bob",
            Email: "BOB@COMPANY.COM",
            Phone: null,
            CompanyName: null
        );

        var result = await CreateHandler().Handle(command, CancellationToken.None);

        Assert.Equal("bob@company.com", result.Email);
    }

    [Fact]
    public async Task Handle_ValidCommand_CallsAddAndSaveChanges()
    {
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var command = new CreateClientCommand(
            UserId: Guid.NewGuid(),
            Name: "Test",
            Email: "test@test.com",
            Phone: null,
            CompanyName: null
        );

        await CreateHandler().Handle(command, CancellationToken.None);

        _repo.Verify(r => r.AddAsync(It.IsAny<Client>(), It.IsAny<CancellationToken>()), Times.Once);
        _uow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}

public class UpdateClientHandlerTests
{
    private readonly Mock<IRepository<Client>> _repo = new();
    private readonly Mock<IUnitOfWork> _uow = new();

    private UpdateClientHandler CreateHandler() => new(_repo.Object, _uow.Object);

    private static Client MakeClient(Guid id) => new()
    {
        Id = id,
        Name = "Old Name",
        Email = "old@example.com"
    };

    [Fact]
    public async Task Handle_ExistingClient_UpdatesAndReturnsDto()
    {
        var id = Guid.NewGuid();
        _repo.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>()))
             .ReturnsAsync(MakeClient(id));
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var command = new UpdateClientCommand(
            Id: id, Name: "New Name", Email: "NEW@EXAMPLE.COM",
            Phone: "000", CompanyName: "New Co"
        );

        var result = await CreateHandler().Handle(command, CancellationToken.None);

        Assert.Equal("New Name", result.Name);
        Assert.Equal("new@example.com", result.Email);
        Assert.Equal("New Co", result.CompanyName);
    }

    [Fact]
    public async Task Handle_ClientNotFound_ThrowsNotFoundException()
    {
        _repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
             .ReturnsAsync((Client?)null);

        var command = new UpdateClientCommand(
            Id: Guid.NewGuid(), Name: "X", Email: "x@x.com",
            Phone: null, CompanyName: null
        );

        await Assert.ThrowsAsync<NotFoundException>(
            () => CreateHandler().Handle(command, CancellationToken.None));
    }
}
