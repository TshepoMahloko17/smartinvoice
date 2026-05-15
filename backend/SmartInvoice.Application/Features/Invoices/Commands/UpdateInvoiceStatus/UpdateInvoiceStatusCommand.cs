using MediatR;
using SmartInvoice.Application.Common.Exceptions;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Enums;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Application.Features.Invoices.Commands.UpdateInvoiceStatus;

public record UpdateInvoiceStatusCommand(Guid Id, InvoiceStatus Status) : IRequest;

public class UpdateInvoiceStatusHandler : IRequestHandler<UpdateInvoiceStatusCommand>
{
    private readonly IRepository<Invoice> _repository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateInvoiceStatusHandler(IRepository<Invoice> repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(UpdateInvoiceStatusCommand request, CancellationToken cancellationToken)
    {
        var invoice = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Invoice), request.Id);

        invoice.UpdateStatus(request.Status);
        invoice.UpdatedAt = DateTime.UtcNow;

        _repository.Update(invoice);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
