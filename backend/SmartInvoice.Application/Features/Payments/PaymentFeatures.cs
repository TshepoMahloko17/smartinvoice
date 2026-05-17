using FluentValidation.Results;
using MediatR;
using SmartInvoice.Application.Common;
using SmartInvoice.Application.Common.Exceptions;
using SmartInvoice.Application.DTOs;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Enums;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Application.Features.Payments;

// ─── Record Payment ───────────────────────────────────────────────────────────
public record RecordPaymentCommand(
    Guid InvoiceId, decimal Amount, DateTime PaidOn,
    string? Method, string? Reference) : IRequest<PaymentDto>;

public class RecordPaymentHandler : IRequestHandler<RecordPaymentCommand, PaymentDto>
{
    private readonly IRepository<Payment> _paymentRepository;
    private readonly IRepository<Invoice> _invoiceRepository;
    private readonly IUnitOfWork _unitOfWork;

    public RecordPaymentHandler(
        IRepository<Payment> paymentRepository,
        IRepository<Invoice> invoiceRepository,
        IUnitOfWork unitOfWork)
    {
        _paymentRepository = paymentRepository;
        _invoiceRepository = invoiceRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<PaymentDto> Handle(RecordPaymentCommand request, CancellationToken cancellationToken)
    {
        var invoice = await _invoiceRepository.GetByIdAsync(request.InvoiceId, cancellationToken)
            ?? throw new NotFoundException(nameof(Invoice), request.InvoiceId);

        // Compute outstanding balance before adding the new payment
        var existingPayments = await _paymentRepository.FindAsync(
            p => p.InvoiceId == request.InvoiceId && !p.IsDeleted, cancellationToken);
        var totalAlreadyPaid = existingPayments.Sum(p => p.Amount);
        var outstandingBalance = invoice.Total - totalAlreadyPaid;

        if (request.Amount > outstandingBalance)
            throw new ValidationException(new[]
            {
                new ValidationFailure("Amount",
                    $"Payment amount exceeds the outstanding balance of {outstandingBalance:F2}.")
            });

        var payment = new Payment
        {
            InvoiceId = request.InvoiceId,
            Amount = request.Amount,
            PaidOn = request.PaidOn,
            Method = request.Method,
            Reference = request.Reference
        };

        await _paymentRepository.AddAsync(payment, cancellationToken);

        var totalPaid = totalAlreadyPaid + request.Amount;
        if (totalPaid >= invoice.Total)
            invoice.MarkAsPaid();
        else if (totalPaid > 0)
            invoice.MarkAsPartiallyPaid();

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new PaymentDto
        {
            Id = payment.Id,
            InvoiceId = payment.InvoiceId,
            InvoiceNumber = invoice.InvoiceNumber,
            Amount = payment.Amount,
            PaidOn = payment.PaidOn,
            Method = payment.Method,
            Reference = payment.Reference,
            CreatedAt = payment.CreatedAt
        };
    }
}

// ─── Get Payments ─────────────────────────────────────────────────────────────
public record GetPaymentsQuery(Guid UserId, int PageNumber = 1, int PageSize = 10, Guid? InvoiceId = null)
    : IRequest<PagedResult<PaymentDto>>;

public class GetPaymentsHandler : IRequestHandler<GetPaymentsQuery, PagedResult<PaymentDto>>
{
    private readonly IRepository<Payment> _repository;

    public GetPaymentsHandler(IRepository<Payment> repository) => _repository = repository;

    public async Task<PagedResult<PaymentDto>> Handle(GetPaymentsQuery request, CancellationToken cancellationToken)
    {
        var (items, total) = await _repository.GetPagedAsync(
            request.PageNumber, request.PageSize,
            p => p.Invoice.UserId == request.UserId && !p.IsDeleted
                 && (request.InvoiceId == null || p.InvoiceId == request.InvoiceId),
            cancellationToken);

        var dtos = items.Select(p => new PaymentDto
        {
            Id = p.Id,
            InvoiceId = p.InvoiceId,
            InvoiceNumber = p.Invoice?.InvoiceNumber ?? string.Empty,
            Amount = p.Amount,
            PaidOn = p.PaidOn,
            Method = p.Method,
            Reference = p.Reference,
            CreatedAt = p.CreatedAt
        });

        return new PagedResult<PaymentDto>
        {
            Items = dtos,
            TotalCount = total,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}

// ─── Delete Payment ───────────────────────────────────────────────────────────
public record DeletePaymentCommand(Guid Id) : IRequest;

public class DeletePaymentHandler : IRequestHandler<DeletePaymentCommand>
{
    private readonly IRepository<Payment> _repository;
    private readonly IRepository<Invoice> _invoiceRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DeletePaymentHandler(
        IRepository<Payment> repository,
        IRepository<Invoice> invoiceRepository,
        IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _invoiceRepository = invoiceRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(DeletePaymentCommand request, CancellationToken cancellationToken)
    {
        var payment = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Payment), request.Id);

        payment.IsDeleted = true;
        payment.UpdatedAt = DateTime.UtcNow;
        _repository.Update(payment);

        // Recalculate invoice status based on remaining payments
        var invoice = await _invoiceRepository.GetByIdAsync(payment.InvoiceId, cancellationToken)
            ?? throw new NotFoundException(nameof(Invoice), payment.InvoiceId);

        var remainingPayments = await _repository.FindAsync(
            p => p.InvoiceId == payment.InvoiceId && !p.IsDeleted && p.Id != payment.Id,
            cancellationToken);
        var totalRemaining = remainingPayments.Sum(p => p.Amount);

        if (totalRemaining >= invoice.Total)
            invoice.MarkAsPaid();
        else if (totalRemaining > 0)
            invoice.MarkAsPartiallyPaid();
        else
            invoice.UpdateStatus(InvoiceStatus.Pending);

        invoice.UpdatedAt = DateTime.UtcNow;
        _invoiceRepository.Update(invoice);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
