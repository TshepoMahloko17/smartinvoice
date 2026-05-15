using MediatR;
using SmartInvoice.Application.Common.Exceptions;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Application.Features.Invoices.Commands.DeleteInvoice;

public record DeleteInvoiceCommand(Guid Id) : IRequest;

public class DeleteInvoiceHandler : IRequestHandler<DeleteInvoiceCommand>
{
    private readonly IRepository<Invoice> _repository;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteInvoiceHandler(IRepository<Invoice> repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(DeleteInvoiceCommand request, CancellationToken cancellationToken)
    {
        var invoice = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Invoice), request.Id);

        invoice.IsDeleted = true;
        invoice.UpdatedAt = DateTime.UtcNow;

        _repository.Update(invoice);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
