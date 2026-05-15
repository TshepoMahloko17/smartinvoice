using Moq;
using SmartInvoice.Application.Common.Exceptions;
using SmartInvoice.Application.DTOs;
using SmartInvoice.Application.Features.Contracts.Commands;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Tests.Contracts;

// ─── CreateContractHandler ────────────────────────────────────────────────────
public class CreateContractHandlerTests
{
    private readonly Mock<IRepository<Contract>> _repo = new();
    private readonly Mock<IUnitOfWork> _uow = new();

    private CreateContractHandler CreateHandler() => new(_repo.Object, _uow.Object);

    private static CreateContractCommand DefaultCommand() => new(
        UserId: Guid.NewGuid(),
        ClientId: Guid.NewGuid(),
        Title: "Software Development Agreement",
        Content: "Full contract content here.",
        StartDate: new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
        EndDate: new DateTime(2026, 12, 31, 0, 0, 0, DateTimeKind.Utc));

    [Fact]
    public async Task Handle_ValidCommand_ReturnsContractDto()
    {
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var result = await CreateHandler().Handle(DefaultCommand(), CancellationToken.None);

        Assert.IsType<ContractDto>(result);
        Assert.Equal("Software Development Agreement", result.Title);
        Assert.False(result.IsSigned);
    }

    [Fact]
    public async Task Handle_ValidCommand_PersistsContract()
    {
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        await CreateHandler().Handle(DefaultCommand(), CancellationToken.None);

        _repo.Verify(r => r.AddAsync(It.Is<Contract>(c => c.Title == "Software Development Agreement"), It.IsAny<CancellationToken>()), Times.Once);
        _uow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WithEndDate_SetsEndDateOnDto()
    {
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);
        var cmd = DefaultCommand() with { EndDate = new DateTime(2026, 6, 30, 0, 0, 0, DateTimeKind.Utc) };

        var result = await CreateHandler().Handle(cmd, CancellationToken.None);

        Assert.Equal(new DateTime(2026, 6, 30, 0, 0, 0, DateTimeKind.Utc), result.EndDate);
    }
}

// ─── DeleteContractHandler ────────────────────────────────────────────────────
public class DeleteContractHandlerTests
{
    private readonly Mock<IRepository<Contract>> _repo = new();
    private readonly Mock<IUnitOfWork> _uow = new();

    private DeleteContractHandler CreateHandler() => new(_repo.Object, _uow.Object);

    [Fact]
    public async Task Handle_ExistingContract_SoftDeletes()
    {
        var contract = new Contract { Id = Guid.NewGuid(), Title = "Old Contract" };
        _repo.Setup(r => r.GetByIdAsync(contract.Id, It.IsAny<CancellationToken>())).ReturnsAsync(contract);
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        await CreateHandler().Handle(new DeleteContractCommand(contract.Id), CancellationToken.None);

        Assert.True(contract.IsDeleted);
        _uow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ContractNotFound_ThrowsNotFoundException()
    {
        _repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
             .ReturnsAsync((Contract?)null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            CreateHandler().Handle(new DeleteContractCommand(Guid.NewGuid()), CancellationToken.None));
    }
}

// ─── LinkContractToInvoiceHandler ────────────────────────────────────────────
public class LinkContractToInvoiceHandlerTests
{
    private readonly Mock<IRepository<Contract>> _contractRepo = new();
    private readonly Mock<IRepository<Invoice>> _invoiceRepo = new();
    private readonly Mock<IUnitOfWork> _uow = new();

    private LinkContractToInvoiceHandler CreateHandler() =>
        new(_contractRepo.Object, _invoiceRepo.Object, _uow.Object);

    [Fact]
    public async Task Handle_ValidIds_LinksContractToInvoice()
    {
        var contract = new Contract { Id = Guid.NewGuid(), Title = "Contract" };
        var invoice = new Invoice { Id = Guid.NewGuid() };
        _contractRepo.Setup(r => r.GetByIdAsync(contract.Id, It.IsAny<CancellationToken>())).ReturnsAsync(contract);
        _invoiceRepo.Setup(r => r.GetByIdAsync(invoice.Id, It.IsAny<CancellationToken>())).ReturnsAsync(invoice);
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        await CreateHandler().Handle(new LinkContractToInvoiceCommand(contract.Id, invoice.Id), CancellationToken.None);

        Assert.Equal(invoice.Id, contract.LinkedInvoiceId);
        _uow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ContractNotFound_ThrowsNotFoundException()
    {
        _contractRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
                     .ReturnsAsync((Contract?)null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            CreateHandler().Handle(new LinkContractToInvoiceCommand(Guid.NewGuid(), Guid.NewGuid()), CancellationToken.None));
    }

    [Fact]
    public async Task Handle_InvoiceNotFound_ThrowsNotFoundException()
    {
        var contract = new Contract { Id = Guid.NewGuid(), Title = "Contract" };
        _contractRepo.Setup(r => r.GetByIdAsync(contract.Id, It.IsAny<CancellationToken>())).ReturnsAsync(contract);
        _invoiceRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
                    .ReturnsAsync((Invoice?)null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            CreateHandler().Handle(new LinkContractToInvoiceCommand(contract.Id, Guid.NewGuid()), CancellationToken.None));
    }
}

// ─── GetContractsHandler ──────────────────────────────────────────────────────
public class GetContractsHandlerTests
{
    private readonly Mock<IRepository<Contract>> _repo = new();

    private GetContractsHandler CreateHandler() => new(_repo.Object);

    [Fact]
    public async Task Handle_ReturnsPagedResult()
    {
        var userId = Guid.NewGuid();
        var contract = new Contract
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            ClientId = Guid.NewGuid(),
            Title = "Dev Contract",
            Content = "Content",
            StartDate = DateTime.UtcNow,
            Client = new Client { Id = Guid.NewGuid(), Name = "Acme Corp", Email = "acme@example.com" }
        };

        _repo.Setup(r => r.GetPagedAsync(1, 10, It.IsAny<System.Linq.Expressions.Expression<Func<Contract, bool>>>(), It.IsAny<CancellationToken>()))
             .ReturnsAsync(([contract], 1));

        var result = await CreateHandler().Handle(new GetContractsQuery(userId, 1, 10), CancellationToken.None);

        Assert.Single(result.Items);
        Assert.Equal("Dev Contract", result.Items.First().Title);
        Assert.Equal("Acme Corp", result.Items.First().ClientName);
        Assert.Equal(1, result.TotalCount);
    }

    [Fact]
    public async Task Handle_EmptyPage_ReturnsEmptyResult()
    {
        _repo.Setup(r => r.GetPagedAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<System.Linq.Expressions.Expression<Func<Contract, bool>>>(), It.IsAny<CancellationToken>()))
             .ReturnsAsync(([], 0));

        var result = await CreateHandler().Handle(new GetContractsQuery(Guid.NewGuid(), 1, 10), CancellationToken.None);

        Assert.Empty(result.Items);
        Assert.Equal(0, result.TotalCount);
    }
}
