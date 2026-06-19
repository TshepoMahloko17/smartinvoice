using Moq;
using SmartInvoice.Application.Common.Exceptions;
using SmartInvoice.Application.DTOs;
using SmartInvoice.Application.Features.Invoices.Commands.CreateInvoice;
using SmartInvoice.Application.Interfaces;
using SmartInvoice.Application.Services;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Enums;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Tests.Invoices;

public class CreateInvoiceHandlerTests
{
    private readonly Mock<IRepository<Invoice>> _invoiceRepo = new();
    private readonly Mock<IRepository<Client>> _clientRepo = new();
    private readonly Mock<IUnitOfWork> _uow = new();
    private readonly IInvoiceDomainService _invoiceDomainService = new InvoiceDomainService();

    private CreateInvoiceHandler CreateHandler() =>
        new(_invoiceRepo.Object, _clientRepo.Object, _uow.Object, _invoiceDomainService);

    private static Client MakeClient(Guid? id = null) => new()
    {
        Id = id ?? Guid.NewGuid(),
        Name = "Acme Corp",
        Email = "acme@example.com"
    };

    [Fact]
    public async Task Handle_ValidCommand_ReturnsInvoiceDto()
    {
        var clientId = Guid.NewGuid();
        var client = MakeClient(clientId);

        _clientRepo.Setup(r => r.GetByIdAsync(clientId, It.IsAny<CancellationToken>()))
                   .ReturnsAsync(client);
        _invoiceRepo.Setup(r => r.CountAsync(null, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(0);
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var command = new CreateInvoiceCommand(
            ClientId: clientId,
            UserId: Guid.NewGuid(),
            IssuedDate: DateTime.UtcNow,
            DueDate: DateTime.UtcNow.AddDays(30),
            Currency: Currency.ZAR,
            Notes: "Test invoice",
            Items: [new CreateInvoiceItemRequest { Description = "Dev work", Quantity = 10, UnitPrice = 100m }]
        );

        var result = await CreateHandler().Handle(command, CancellationToken.None);

        Assert.IsType<InvoiceDto>(result);
        Assert.Equal(clientId, result.ClientId);
        Assert.Equal("Acme Corp", result.ClientName);
        Assert.Equal("INV-0001", result.InvoiceNumber);
        Assert.Equal(Currency.ZAR, result.Currency);
        Assert.Equal(1000m, result.Total);
    }

    [Fact]
    public async Task Handle_MultipleItems_CalculatesTotalCorrectly()
    {
        var clientId = Guid.NewGuid();
        _clientRepo.Setup(r => r.GetByIdAsync(clientId, It.IsAny<CancellationToken>()))
                   .ReturnsAsync(MakeClient(clientId));
        _invoiceRepo.Setup(r => r.CountAsync(null, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(5);
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var command = new CreateInvoiceCommand(
            ClientId: clientId,
            UserId: Guid.NewGuid(),
            IssuedDate: DateTime.UtcNow,
            DueDate: DateTime.UtcNow.AddDays(14),
            Currency: Currency.ZAR,
            Notes: null,
            Items:
            [
                new CreateInvoiceItemRequest { Description = "Design", Quantity = 2, UnitPrice = 500m },
                new CreateInvoiceItemRequest { Description = "Development", Quantity = 8, UnitPrice = 200m },
            ]
        );

        var result = await CreateHandler().Handle(command, CancellationToken.None);

        Assert.Equal(2600m, result.Total);   // 2×500 + 8×200
        Assert.Equal("INV-0006", result.InvoiceNumber);
    }

    [Fact]
    public async Task Handle_ClientNotFound_ThrowsNotFoundException()
    {
        _clientRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
                   .ReturnsAsync((Client?)null);

        var command = new CreateInvoiceCommand(
            ClientId: Guid.NewGuid(),
            UserId: Guid.NewGuid(),
            IssuedDate: DateTime.UtcNow,
            DueDate: DateTime.UtcNow.AddDays(30),
            Currency: Currency.ZAR,
            Notes: null,
            Items: [new CreateInvoiceItemRequest { Description = "Work", Quantity = 1, UnitPrice = 100m }]
        );

        await Assert.ThrowsAsync<NotFoundException>(
            () => CreateHandler().Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_ValidCommand_CallsSaveChanges()
    {
        var clientId = Guid.NewGuid();
        _clientRepo.Setup(r => r.GetByIdAsync(clientId, It.IsAny<CancellationToken>()))
                   .ReturnsAsync(MakeClient(clientId));
        _invoiceRepo.Setup(r => r.CountAsync(null, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(0);
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        var command = new CreateInvoiceCommand(
            ClientId: clientId, UserId: Guid.NewGuid(),
            IssuedDate: DateTime.UtcNow, DueDate: DateTime.UtcNow.AddDays(30),
            Currency: Currency.ZAR, Notes: null,
            Items: [new CreateInvoiceItemRequest { Description = "Work", Quantity = 1, UnitPrice = 100m }]
        );

        await CreateHandler().Handle(command, CancellationToken.None);

        _uow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
