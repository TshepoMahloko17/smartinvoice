using MediatR;
using SmartInvoice.Application.Common;
using SmartInvoice.Application.Common.Exceptions;
using SmartInvoice.Application.DTOs;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Enums;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Application.Features.Clients.Queries.GetClients;

public record GetClientsQuery(Guid UserId, int PageNumber = 1, int PageSize = 10, string? Search = null)
    : IRequest<PagedResult<ClientDto>>;

public class GetClientsHandler : IRequestHandler<GetClientsQuery, PagedResult<ClientDto>>
{
    private readonly IRepository<Client> _repository;
    private readonly IRepository<Invoice> _invoiceRepository;

    public GetClientsHandler(IRepository<Client> repository, IRepository<Invoice> invoiceRepository)
    {
        _repository = repository;
        _invoiceRepository = invoiceRepository;
    }

    public async Task<PagedResult<ClientDto>> Handle(GetClientsQuery request, CancellationToken cancellationToken)
    {
        var (items, total) = await _repository.GetPagedAsync(
            request.PageNumber, request.PageSize,
            c => c.UserId == request.UserId
                 && !c.IsDeleted
                 && (request.Search == null || c.Name.Contains(request.Search) || c.Email.Contains(request.Search)),
            cancellationToken);

        var clientList = items.ToList();

        var dtos = clientList.Select(c => new ClientDto
        {
            Id = c.Id,
            Name = c.Name,
            Email = c.Email,
            Phone = c.Phone,
            CompanyName = c.CompanyName,
            TotalInvoices = c.Invoices?.Count ?? 0,
            TotalRevenue = c.Invoices?
                .Where(i => i.Status == InvoiceStatus.Paid)
                .Sum(i => i.Total) ?? 0,
            CreatedAt = c.CreatedAt
        });

        return new PagedResult<ClientDto>
        {
            Items = dtos,
            TotalCount = total,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}

public record GetClientByIdQuery(Guid Id) : IRequest<ClientDto>;

public class GetClientByIdHandler : IRequestHandler<GetClientByIdQuery, ClientDto>
{
    private readonly IRepository<Client> _repository;

    public GetClientByIdHandler(IRepository<Client> repository) => _repository = repository;

    public async Task<ClientDto> Handle(GetClientByIdQuery request, CancellationToken cancellationToken)
    {
        var client = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Client), request.Id);

        return new ClientDto
        {
            Id = client.Id,
            Name = client.Name,
            Email = client.Email,
            Phone = client.Phone,
            CompanyName = client.CompanyName,
            TotalInvoices = client.Invoices?.Count ?? 0,
            TotalRevenue = client.Invoices?
                .Where(i => i.Status == InvoiceStatus.Paid)
                .Sum(i => i.Total) ?? 0,
            CreatedAt = client.CreatedAt
        };
    }
}
