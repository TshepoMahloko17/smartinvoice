using MediatR;
using SmartInvoice.Application.Common.Exceptions;
using SmartInvoice.Application.DTOs;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Application.Features.Invoices.Queries.GetInvoiceById;

public record GetInvoiceByIdQuery(Guid Id) : IRequest<InvoiceDto>;

public class GetInvoiceByIdHandler : IRequestHandler<GetInvoiceByIdQuery, InvoiceDto>
{
    private readonly IRepository<Invoice> _repository;

    public GetInvoiceByIdHandler(IRepository<Invoice> repository) => _repository = repository;

    public async Task<InvoiceDto> Handle(GetInvoiceByIdQuery request, CancellationToken cancellationToken)
    {
        var invoice = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Invoice), request.Id);

        return new InvoiceDto
        {
            Id = invoice.Id,
            InvoiceNumber = invoice.InvoiceNumber,
            ClientId = invoice.ClientId,
            ClientName = invoice.Client?.Name ?? string.Empty,
            ClientEmail = invoice.Client?.Email ?? string.Empty,
            IssuedDate = invoice.IssuedDate,
            DueDate = invoice.DueDate,
            Status = invoice.Status,
            Total = invoice.Total,
            Notes = invoice.Notes,
            Currency = invoice.Currency,
            Items = invoice.Items.Select(item => new InvoiceItemDto
            {
                Id = item.Id,
                Description = item.Description,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice
            }).ToList(),
            CreatedAt = invoice.CreatedAt
        };
    }
}
