using MediatR;
using SmartInvoice.Application.Common.Exceptions;
using SmartInvoice.Application.DTOs;
using SmartInvoice.Application.Interfaces;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Enums;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Application.Features.Invoices.Commands.UpdateInvoice;

public record UpdateInvoiceCommand(
    Guid Id,
    Guid ClientId,
    DateTime IssuedDate,
    DateTime DueDate,
    Currency Currency,
    string? Notes,
    List<CreateInvoiceItemRequest> Items) : IRequest<InvoiceDto>;

public class UpdateInvoiceHandler : IRequestHandler<UpdateInvoiceCommand, InvoiceDto>
{
    private readonly IRepository<Invoice> _invoiceRepository;
    private readonly IRepository<Client> _clientRepository;
    private readonly IRepository<InvoiceItem> _invoiceItemRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateInvoiceHandler(
        IRepository<Invoice> invoiceRepository,
        IRepository<Client> clientRepository,
        IRepository<InvoiceItem> invoiceItemRepository,
        IUnitOfWork unitOfWork)
    {
        _invoiceRepository = invoiceRepository;
        _clientRepository = clientRepository;
        _invoiceItemRepository = invoiceItemRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<InvoiceDto> Handle(UpdateInvoiceCommand request, CancellationToken cancellationToken)
    {
        var invoice = await _invoiceRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Invoice), request.Id);

        var client = await _clientRepository.GetByIdAsync(request.ClientId, cancellationToken)
            ?? throw new NotFoundException(nameof(Client), request.ClientId);

        invoice.ClientId = request.ClientId;
        invoice.IssuedDate = request.IssuedDate;
        invoice.DueDate = request.DueDate;
        invoice.Currency = request.Currency;
        invoice.Notes = request.Notes;

        // Explicitly delete existing items so EF tracks them as Deleted (not Modified)
        var existingItems = invoice.Items.ToList();
        foreach (var item in existingItems)
        {
            _invoiceItemRepository.Remove(item);
            invoice.RemoveItem(item.Id);
        }

        // Explicitly insert new items so EF tracks them as Added (not Modified).
        // Do NOT call invoice.AddItem — EF relationship fixup already adds the item
        // to invoice.Items when AddAsync is called, so calling AddItem would double it.
        foreach (var item in request.Items)
        {
            var newItem = new InvoiceItem
            {
                Description = item.Description,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                InvoiceId = invoice.Id
            };
            await _invoiceItemRepository.AddAsync(newItem, cancellationToken);
        }

        // Recalculate total from the now-correct in-memory collection
        invoice.RecalculateTotal();

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
            Items = invoice.Items.Select(i => new InvoiceItemDto
            {
                Id = i.Id,
                Description = i.Description,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice
            }).ToList(),
            CreatedAt = invoice.CreatedAt
        };
    }
}
