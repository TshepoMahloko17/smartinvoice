using Moq;
using SmartInvoice.Application.Common.Exceptions;
using SmartInvoice.Application.Features.Invoices.Commands.DeleteInvoice;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Tests.Invoices;

public class DeleteInvoiceHandlerTests
{
    private readonly Mock<IRepository<Invoice>> _repo = new();
    private readonly Mock<IUnitOfWork> _uow = new();

    private DeleteInvoiceHandler CreateHandler() => new(_repo.Object, _uow.Object);

    private static Invoice MakeInvoice(Guid id)
    {
        var inv = Invoice.Create("INV-0001", Guid.NewGuid(), Guid.NewGuid(),
            DateTime.UtcNow, DateTime.UtcNow.AddDays(30));
        // Reflect the Id so mock lookups work
        typeof(Invoice).BaseType!.GetProperty("Id")!.SetValue(inv, id);
        return inv;
    }

    [Fact]
    public async Task Handle_ExistingInvoice_SetsIsDeletedAndSaves()
    {
        var id = Guid.NewGuid();
        var invoice = MakeInvoice(id);

        _repo.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>()))
             .ReturnsAsync(invoice);
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        await CreateHandler().Handle(new DeleteInvoiceCommand(id), CancellationToken.None);

        Assert.True(invoice.IsDeleted);
        _repo.Verify(r => r.Update(invoice), Times.Once);
        _uow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_InvoiceNotFound_ThrowsNotFoundException()
    {
        _repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
             .ReturnsAsync((Invoice?)null);

        await Assert.ThrowsAsync<NotFoundException>(
            () => CreateHandler().Handle(new DeleteInvoiceCommand(Guid.NewGuid()), CancellationToken.None));
    }
}
