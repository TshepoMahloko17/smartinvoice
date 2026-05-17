using MediatR;
using SmartInvoice.Application.Common;
using SmartInvoice.Application.DTOs;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Enums;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Application.Features.Invoices.Queries.GetInvoices;

public record GetInvoicesQuery(
    Guid UserId,
    int PageNumber = 1,
    int PageSize = 10,
    string? Search = null,
    InvoiceStatus? Status = null) : IRequest<PagedResult<InvoiceDto>>;

public class GetInvoicesHandler : IRequestHandler<GetInvoicesQuery, PagedResult<InvoiceDto>>
{
    private readonly IRepository<Invoice> _repository;

    public GetInvoicesHandler(IRepository<Invoice> repository) => _repository = repository;

    public async Task<PagedResult<InvoiceDto>> Handle(GetInvoicesQuery request, CancellationToken cancellationToken)
    {
        var (items, total) = await _repository.GetPagedAsync(
            request.PageNumber,
            request.PageSize,
            i => i.UserId == request.UserId
                 && !i.IsDeleted
                 && (request.Status == null || i.Status == request.Status)
                 && (request.Search == null
                     || i.InvoiceNumber.Contains(request.Search)
                     || i.Client.Name.Contains(request.Search)),
            cancellationToken);

        var dtos = items.Select(i =>
        {
            var amountPaid = i.Payments?.Where(p => !p.IsDeleted).Sum(p => p.Amount) ?? 0m;
            return new InvoiceDto
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                ClientId = i.ClientId,
                ClientName = i.Client?.Name ?? string.Empty,
                ClientEmail = i.Client?.Email ?? string.Empty,
                IssuedDate = i.IssuedDate,
                DueDate = i.DueDate,
                Status = i.Status,
                Total = i.Total,
                AmountPaid = amountPaid,
                Balance = i.Total - amountPaid,
                Notes = i.Notes,
                Currency = i.Currency,
                CreatedAt = i.CreatedAt
            };
        });

        return new PagedResult<InvoiceDto>
        {
            Items = dtos,
            TotalCount = total,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}
