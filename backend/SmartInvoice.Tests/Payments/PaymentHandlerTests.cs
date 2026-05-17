using Moq;
using SmartInvoice.Application.Common.Exceptions;
using SmartInvoice.Application.DTOs;
using SmartInvoice.Application.Features.Payments;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Tests.Payments;

// ─── Shared helpers ────────────────────────────────────────────────────────────
file static class Helpers
{
    public static Invoice MakeInvoice(Guid? id = null, decimal total = 1000m)
    {
        var inv = new Invoice
        {
            Id = id ?? Guid.NewGuid(),
            ClientId = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            IssuedDate = DateTime.UtcNow.AddDays(-5),
            DueDate = DateTime.UtcNow.AddDays(25),
        };
        typeof(Invoice).GetProperty("InvoiceNumber")!.SetValue(inv, "INV-0001");
        typeof(Invoice).GetProperty("Total")!.SetValue(inv, total);
        return inv;
    }

    public static Payment MakePayment(Guid invoiceId, decimal amount = 500m) => new()
    {
        Id = Guid.NewGuid(),
        InvoiceId = invoiceId,
        Amount = amount,
        PaidOn = DateTime.UtcNow,
        Invoice = MakeInvoice(invoiceId)
    };

    // Helper to set private Total via reflection (Invoice.Total has private setter)
    public static Invoice SetTotal(this Invoice inv, decimal total)
    {
        typeof(Invoice).GetProperty(nameof(Invoice.Total))!
            .SetValue(inv, total);
        return inv;
    }

    // Tap helper to run action in a chain
    public static T Tap<T>(this T obj, Action<T> action) { action(obj); return obj; }
}

// ─── Extension to call Invoice.AddItem if it exists, otherwise skip ───────────
file static class InvoiceExtensions
{
    public static Invoice AddItem(this Invoice invoice, string desc, int qty, decimal price)
    {
        // InvoiceItems are usually set via a method on Invoice; use reflection to add directly
        var item = new InvoiceItem { Description = desc, Quantity = qty, UnitPrice = price };
        var itemsProp = typeof(Invoice).GetProperty("Items")!;
        var items = (ICollection<InvoiceItem>)itemsProp.GetValue(invoice)!;
        items.Add(item);

        // Recalculate Total via reflection
        typeof(Invoice).GetProperty("Total")!.SetValue(invoice, items.Sum(i => i.Quantity * i.UnitPrice));
        return invoice;
    }
}

// ─── RecordPaymentHandler ─────────────────────────────────────────────────────
public class RecordPaymentHandlerTests
{
    private readonly Mock<IRepository<Payment>> _paymentRepo = new();
    private readonly Mock<IRepository<Invoice>> _invoiceRepo = new();
    private readonly Mock<IUnitOfWork> _uow = new();

    private RecordPaymentHandler CreateHandler() =>
        new(_paymentRepo.Object, _invoiceRepo.Object, _uow.Object);

    [Fact]
    public async Task Handle_ValidCommand_ReturnsPaymentDto()
    {
        var invoiceId = Guid.NewGuid();
        var invoice = Helpers.MakeInvoice(invoiceId, 1000m);

        _invoiceRepo.Setup(r => r.GetByIdAsync(invoiceId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(invoice);
        _paymentRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Payment, bool>>>(), It.IsAny<CancellationToken>()))
                    .ReturnsAsync([]);
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var cmd = new RecordPaymentCommand(invoiceId, 500m, DateTime.UtcNow, "Card", "REF-001");
        var result = await CreateHandler().Handle(cmd, CancellationToken.None);

        Assert.IsType<PaymentDto>(result);
        Assert.Equal(invoiceId, result.InvoiceId);
        Assert.Equal(500m, result.Amount);
        Assert.Equal("Card", result.Method);
        Assert.Equal("REF-001", result.Reference);
    }

    [Fact]
    public async Task Handle_InvoiceNotFound_ThrowsNotFoundException()
    {
        _invoiceRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
                    .ReturnsAsync((Invoice?)null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            CreateHandler().Handle(
                new RecordPaymentCommand(Guid.NewGuid(), 100m, DateTime.UtcNow, null, null),
                CancellationToken.None));
    }

    [Fact]
    public async Task Handle_PaymentCoversFull_MarksInvoiceAsPaid()
    {
        var invoiceId = Guid.NewGuid();
        var invoice = Helpers.MakeInvoice(invoiceId, 1000m);

        _invoiceRepo.Setup(r => r.GetByIdAsync(invoiceId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(invoice);
        // No prior payments
        _paymentRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Payment, bool>>>(), It.IsAny<CancellationToken>()))
                    .ReturnsAsync([]);
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        // Full payment
        var cmd = new RecordPaymentCommand(invoiceId, 1000m, DateTime.UtcNow, null, null);
        await CreateHandler().Handle(cmd, CancellationToken.None);

        // Invoice.MarkAsPaid() sets Status to Paid — verify via reflection
        var status = typeof(Invoice).GetProperty("Status")!.GetValue(invoice);
        Assert.Equal(SmartInvoice.Domain.Enums.InvoiceStatus.Paid, status);
    }

    [Fact]
    public async Task Handle_PartialPayment_SetsPartiallyPaidStatus()
    {
        var invoiceId = Guid.NewGuid();
        var invoice = Helpers.MakeInvoice(invoiceId, 1000m);

        _invoiceRepo.Setup(r => r.GetByIdAsync(invoiceId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(invoice);
        _paymentRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Payment, bool>>>(), It.IsAny<CancellationToken>()))
                    .ReturnsAsync([]);
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        var cmd = new RecordPaymentCommand(invoiceId, 400m, DateTime.UtcNow, null, null);
        await CreateHandler().Handle(cmd, CancellationToken.None);

        var status = typeof(Invoice).GetProperty("Status")!.GetValue(invoice);
        Assert.Equal(SmartInvoice.Domain.Enums.InvoiceStatus.PartiallyPaid, status);
    }

    [Fact]
    public async Task Handle_CumulativePaymentsCoverFull_MarksAsPaid()
    {
        var invoiceId = Guid.NewGuid();
        var invoice = Helpers.MakeInvoice(invoiceId, 1000m);
        // Simulate a prior partial payment of 600
        var priorPayment = new Payment { Id = Guid.NewGuid(), InvoiceId = invoiceId, Amount = 600m };

        _invoiceRepo.Setup(r => r.GetByIdAsync(invoiceId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(invoice);
        _paymentRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Payment, bool>>>(), It.IsAny<CancellationToken>()))
                    .ReturnsAsync([priorPayment]);
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        // New payment covers the remaining 400
        var cmd = new RecordPaymentCommand(invoiceId, 400m, DateTime.UtcNow, null, null);
        await CreateHandler().Handle(cmd, CancellationToken.None);

        var status = typeof(Invoice).GetProperty("Status")!.GetValue(invoice);
        Assert.Equal(SmartInvoice.Domain.Enums.InvoiceStatus.Paid, status);
    }

    [Fact]
    public async Task Handle_CumulativePartialPayments_SetsPartiallyPaid()
    {
        var invoiceId = Guid.NewGuid();
        var invoice = Helpers.MakeInvoice(invoiceId, 1000m);
        var priorPayment = new Payment { Id = Guid.NewGuid(), InvoiceId = invoiceId, Amount = 300m };

        _invoiceRepo.Setup(r => r.GetByIdAsync(invoiceId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(invoice);
        _paymentRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Payment, bool>>>(), It.IsAny<CancellationToken>()))
                    .ReturnsAsync([priorPayment]);
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        // Add another partial payment — total 300 + 200 = 500, still below 1000
        var cmd = new RecordPaymentCommand(invoiceId, 200m, DateTime.UtcNow, null, null);
        await CreateHandler().Handle(cmd, CancellationToken.None);

        var status = typeof(Invoice).GetProperty("Status")!.GetValue(invoice);
        Assert.Equal(SmartInvoice.Domain.Enums.InvoiceStatus.PartiallyPaid, status);
    }

    [Fact]
    public async Task Handle_AmountExceedsOutstandingBalance_ThrowsValidationException()
    {
        var invoiceId = Guid.NewGuid();
        var invoice = Helpers.MakeInvoice(invoiceId, 1000m);
        var priorPayment = new Payment { Id = Guid.NewGuid(), InvoiceId = invoiceId, Amount = 800m };

        _invoiceRepo.Setup(r => r.GetByIdAsync(invoiceId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(invoice);
        _paymentRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Payment, bool>>>(), It.IsAny<CancellationToken>()))
                    .ReturnsAsync([priorPayment]);

        // Outstanding is 200, but trying to pay 500
        var cmd = new RecordPaymentCommand(invoiceId, 500m, DateTime.UtcNow, null, null);
        await Assert.ThrowsAsync<ValidationException>(() =>
            CreateHandler().Handle(cmd, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_ExactOutstandingBalance_MarksAsPaid()
    {
        var invoiceId = Guid.NewGuid();
        var invoice = Helpers.MakeInvoice(invoiceId, 1000m);
        var priorPayment = new Payment { Id = Guid.NewGuid(), InvoiceId = invoiceId, Amount = 750m };

        _invoiceRepo.Setup(r => r.GetByIdAsync(invoiceId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(invoice);
        _paymentRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Payment, bool>>>(), It.IsAny<CancellationToken>()))
                    .ReturnsAsync([priorPayment]);
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        // Pay exactly the remaining 250
        var cmd = new RecordPaymentCommand(invoiceId, 250m, DateTime.UtcNow, null, null);
        await CreateHandler().Handle(cmd, CancellationToken.None);

        var status = typeof(Invoice).GetProperty("Status")!.GetValue(invoice);
        Assert.Equal(SmartInvoice.Domain.Enums.InvoiceStatus.Paid, status);
    }

    [Fact]
    public async Task Handle_ValidCommand_SavesChanges()
    {
        var invoiceId = Guid.NewGuid();
        var invoice = Helpers.MakeInvoice(invoiceId, 500m);

        _invoiceRepo.Setup(r => r.GetByIdAsync(invoiceId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(invoice);
        _paymentRepo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Payment, bool>>>(), It.IsAny<CancellationToken>()))
                    .ReturnsAsync([]);
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        await CreateHandler().Handle(
            new RecordPaymentCommand(invoiceId, 200m, DateTime.UtcNow, null, null),
            CancellationToken.None);

        _uow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}

// ─── DeletePaymentHandler ─────────────────────────────────────────────────────
public class DeletePaymentHandlerTests
{
    private readonly Mock<IRepository<Payment>> _repo = new();
    private readonly Mock<IRepository<Invoice>> _invoiceRepo = new();
    private readonly Mock<IUnitOfWork> _uow = new();

    private DeletePaymentHandler CreateHandler() => new(_repo.Object, _invoiceRepo.Object, _uow.Object);

    [Fact]
    public async Task Handle_ExistingPayment_SoftDeletes()
    {
        var invoiceId = Guid.NewGuid();
        var payment = new Payment { Id = Guid.NewGuid(), InvoiceId = invoiceId, Amount = 100m };
        var invoice = Helpers.MakeInvoice(invoiceId, 500m);

        _repo.Setup(r => r.GetByIdAsync(payment.Id, It.IsAny<CancellationToken>()))
             .ReturnsAsync(payment);
        _invoiceRepo.Setup(r => r.GetByIdAsync(invoiceId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(invoice);
        _repo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Payment, bool>>>(), It.IsAny<CancellationToken>()))
             .ReturnsAsync([]);
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        await CreateHandler().Handle(new DeletePaymentCommand(payment.Id), CancellationToken.None);

        Assert.True(payment.IsDeleted);
        _uow.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_PaymentNotFound_ThrowsNotFoundException()
    {
        _repo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
             .ReturnsAsync((Payment?)null);

        await Assert.ThrowsAsync<NotFoundException>(() =>
            CreateHandler().Handle(new DeletePaymentCommand(Guid.NewGuid()), CancellationToken.None));
    }

    [Fact]
    public async Task Handle_DeleteLastPayment_RevertsToInvoicePending()
    {
        var invoiceId = Guid.NewGuid();
        var payment = new Payment { Id = Guid.NewGuid(), InvoiceId = invoiceId, Amount = 400m };
        var invoice = Helpers.MakeInvoice(invoiceId, 1000m);

        _repo.Setup(r => r.GetByIdAsync(payment.Id, It.IsAny<CancellationToken>()))
             .ReturnsAsync(payment);
        _invoiceRepo.Setup(r => r.GetByIdAsync(invoiceId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(invoice);
        // No other payments remain after deletion
        _repo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Payment, bool>>>(), It.IsAny<CancellationToken>()))
             .ReturnsAsync([]);
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        await CreateHandler().Handle(new DeletePaymentCommand(payment.Id), CancellationToken.None);

        var status = typeof(Invoice).GetProperty("Status")!.GetValue(invoice);
        Assert.Equal(SmartInvoice.Domain.Enums.InvoiceStatus.Pending, status);
    }

    [Fact]
    public async Task Handle_DeleteOneOfManyPartialPayments_RemainsPartiallyPaid()
    {
        var invoiceId = Guid.NewGuid();
        var paymentToDelete = new Payment { Id = Guid.NewGuid(), InvoiceId = invoiceId, Amount = 300m };
        var remainingPayment = new Payment { Id = Guid.NewGuid(), InvoiceId = invoiceId, Amount = 200m };
        var invoice = Helpers.MakeInvoice(invoiceId, 1000m);

        _repo.Setup(r => r.GetByIdAsync(paymentToDelete.Id, It.IsAny<CancellationToken>()))
             .ReturnsAsync(paymentToDelete);
        _invoiceRepo.Setup(r => r.GetByIdAsync(invoiceId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(invoice);
        // 200 remains — still partial
        _repo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Payment, bool>>>(), It.IsAny<CancellationToken>()))
             .ReturnsAsync([remainingPayment]);
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        await CreateHandler().Handle(new DeletePaymentCommand(paymentToDelete.Id), CancellationToken.None);

        var status = typeof(Invoice).GetProperty("Status")!.GetValue(invoice);
        Assert.Equal(SmartInvoice.Domain.Enums.InvoiceStatus.PartiallyPaid, status);
    }

    [Fact]
    public async Task Handle_DeletePartialPayment_WhenRemainingCoversFull_KeepsPaid()
    {
        var invoiceId = Guid.NewGuid();
        var paymentToDelete = new Payment { Id = Guid.NewGuid(), InvoiceId = invoiceId, Amount = 100m };
        var remainingPayment = new Payment { Id = Guid.NewGuid(), InvoiceId = invoiceId, Amount = 1000m };
        var invoice = Helpers.MakeInvoice(invoiceId, 1000m);

        _repo.Setup(r => r.GetByIdAsync(paymentToDelete.Id, It.IsAny<CancellationToken>()))
             .ReturnsAsync(paymentToDelete);
        _invoiceRepo.Setup(r => r.GetByIdAsync(invoiceId, It.IsAny<CancellationToken>()))
                    .ReturnsAsync(invoice);
        // Remaining 1000 still covers full total
        _repo.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Payment, bool>>>(), It.IsAny<CancellationToken>()))
             .ReturnsAsync([remainingPayment]);
        _uow.Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

        await CreateHandler().Handle(new DeletePaymentCommand(paymentToDelete.Id), CancellationToken.None);

        var status = typeof(Invoice).GetProperty("Status")!.GetValue(invoice);
        Assert.Equal(SmartInvoice.Domain.Enums.InvoiceStatus.Paid, status);
    }
}

// ─── GetPaymentsHandler ───────────────────────────────────────────────────────
public class GetPaymentsHandlerTests
{
    private readonly Mock<IRepository<Payment>> _repo = new();

    private GetPaymentsHandler CreateHandler() => new(_repo.Object);

    [Fact]
    public async Task Handle_ReturnsPagedResult()
    {
        var userId = Guid.NewGuid();
        var invoiceId = Guid.NewGuid();
        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            InvoiceId = invoiceId,
            Amount = 500m,
            PaidOn = DateTime.UtcNow,
            Invoice = Helpers.MakeInvoice(invoiceId)
        };

        _repo.Setup(r => r.GetPagedAsync(1, 10, It.IsAny<System.Linq.Expressions.Expression<Func<Payment, bool>>>(), It.IsAny<CancellationToken>()))
             .ReturnsAsync(([payment], 1));

        var result = await CreateHandler().Handle(
            new GetPaymentsQuery(userId, 1, 10), CancellationToken.None);

        Assert.Single(result.Items);
        Assert.Equal(1, result.TotalCount);
        Assert.Equal(500m, result.Items.First().Amount);
        Assert.Equal("INV-0001", result.Items.First().InvoiceNumber);
    }

    [Fact]
    public async Task Handle_EmptyPage_ReturnsEmptyResult()
    {
        _repo.Setup(r => r.GetPagedAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<System.Linq.Expressions.Expression<Func<Payment, bool>>>(), It.IsAny<CancellationToken>()))
             .ReturnsAsync(([], 0));

        var result = await CreateHandler().Handle(
            new GetPaymentsQuery(Guid.NewGuid(), 1, 10), CancellationToken.None);

        Assert.Empty(result.Items);
        Assert.Equal(0, result.TotalCount);
    }
}
