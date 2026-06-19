using MediatR;
using SmartInvoice.Application.Common.Exceptions;
using SmartInvoice.Application.DTOs;
using SmartInvoice.Application.Interfaces;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Enums;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Application.Features.Invoices.Commands.CreateInvoice;

public record CreateInvoiceCommand(
    Guid ClientId,
    Guid UserId,
    DateTime IssuedDate,
    DateTime DueDate,
    Currency Currency,
    string? Notes,
    List<CreateInvoiceItemRequest> Items) : IRequest<InvoiceDto>;

public class CreateInvoiceHandler : IRequestHandler<CreateInvoiceCommand, InvoiceDto>
{
    private readonly IRepository<Invoice> _invoiceRepository;
    private readonly IRepository<Client> _clientRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IInvoiceDomainService _invoiceDomainService;

    public CreateInvoiceHandler(
        IRepository<Invoice> invoiceRepository,
        IRepository<Client> clientRepository,
        IUnitOfWork unitOfWork,
        IInvoiceDomainService invoiceDomainService)
    {
        _invoiceRepository = invoiceRepository;
        _clientRepository = clientRepository;
        _unitOfWork = unitOfWork;
        _invoiceDomainService = invoiceDomainService;
    }

    public async Task<InvoiceDto> Handle(CreateInvoiceCommand request, CancellationToken cancellationToken)
    {
        var client = await _clientRepository.GetByIdAsync(request.ClientId, cancellationToken)
            ?? throw new NotFoundException(nameof(Client), request.ClientId);

        var count = await _invoiceRepository.CountAsync(cancellationToken: cancellationToken);
        var invoiceNumber = $"INV-{(count + 1):D4}";

        var invoice = _invoiceDomainService.CreateInvoice(
            invoiceNumber,
            request.ClientId,
            request.UserId,
            request.IssuedDate,
            request.DueDate,
            request.Currency,
            request.Notes,
            request.Items.Select(i => (i.Description, i.Quantity, i.UnitPrice)));

        await _invoiceRepository.AddAsync(invoice, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new InvoiceDto
        {
            Id = invoice.Id,
            InvoiceNumber = invoice.InvoiceNumber,
            ClientId = invoice.ClientId,
            ClientName = client.Name,
            ClientEmail = client.Email,
            IssuedDate = invoice.IssuedDate,
            DueDate = invoice.DueDate,
            Status = invoice.Status,
            Total = invoice.Total,
            Notes = invoice.Notes,
            Currency = invoice.Currency,
            CreatedAt = invoice.CreatedAt
        };
    }
}
