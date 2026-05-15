using MediatR;
using SmartInvoice.Application.Common;
using SmartInvoice.Application.Common.Exceptions;
using SmartInvoice.Application.DTOs;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Application.Features.Contracts.Commands;

// ─── Create ───────────────────────────────────────────────────────────────────
public record CreateContractCommand(
    Guid UserId, Guid ClientId, string Title, string Content,
    DateTime StartDate, DateTime? EndDate) : IRequest<ContractDto>;

public class CreateContractHandler : IRequestHandler<CreateContractCommand, ContractDto>
{
    private readonly IRepository<Contract> _repository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateContractHandler(IRepository<Contract> repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ContractDto> Handle(CreateContractCommand request, CancellationToken cancellationToken)
    {
        var contract = new Contract
        {
            UserId = request.UserId,
            ClientId = request.ClientId,
            Title = request.Title,
            Content = request.Content,
            StartDate = request.StartDate,
            EndDate = request.EndDate
        };

        await _repository.AddAsync(contract, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ContractDto
        {
            Id = contract.Id,
            ClientId = contract.ClientId,
            Title = contract.Title,
            Content = contract.Content,
            StartDate = contract.StartDate,
            EndDate = contract.EndDate,
            IsSigned = contract.IsSigned,
            CreatedAt = contract.CreatedAt
        };
    }
}

// ─── Link to Invoice ──────────────────────────────────────────────────────────
public record LinkContractToInvoiceCommand(Guid ContractId, Guid InvoiceId) : IRequest;

public class LinkContractToInvoiceHandler : IRequestHandler<LinkContractToInvoiceCommand>
{
    private readonly IRepository<Contract> _contractRepository;
    private readonly IRepository<Invoice> _invoiceRepository;
    private readonly IUnitOfWork _unitOfWork;

    public LinkContractToInvoiceHandler(
        IRepository<Contract> contractRepository,
        IRepository<Invoice> invoiceRepository,
        IUnitOfWork unitOfWork)
    {
        _contractRepository = contractRepository;
        _invoiceRepository = invoiceRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(LinkContractToInvoiceCommand request, CancellationToken cancellationToken)
    {
        var contract = await _contractRepository.GetByIdAsync(request.ContractId, cancellationToken)
            ?? throw new NotFoundException(nameof(Contract), request.ContractId);

        _ = await _invoiceRepository.GetByIdAsync(request.InvoiceId, cancellationToken)
            ?? throw new NotFoundException(nameof(Invoice), request.InvoiceId);

        contract.LinkedInvoiceId = request.InvoiceId;
        contract.UpdatedAt = DateTime.UtcNow;
        _contractRepository.Update(contract);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}

// ─── Delete ───────────────────────────────────────────────────────────────────
public record DeleteContractCommand(Guid Id) : IRequest;

public class DeleteContractHandler : IRequestHandler<DeleteContractCommand>
{
    private readonly IRepository<Contract> _repository;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteContractHandler(IRepository<Contract> repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(DeleteContractCommand request, CancellationToken cancellationToken)
    {
        var contract = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Contract), request.Id);

        contract.IsDeleted = true;
        contract.UpdatedAt = DateTime.UtcNow;
        _repository.Update(contract);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}

// ─── Get All ──────────────────────────────────────────────────────────────────
public record GetContractsQuery(Guid UserId, int PageNumber = 1, int PageSize = 10)
    : IRequest<PagedResult<ContractDto>>;

public class GetContractsHandler : IRequestHandler<GetContractsQuery, PagedResult<ContractDto>>
{
    private readonly IRepository<Contract> _repository;

    public GetContractsHandler(IRepository<Contract> repository) => _repository = repository;

    public async Task<PagedResult<ContractDto>> Handle(GetContractsQuery request, CancellationToken cancellationToken)
    {
        var (items, total) = await _repository.GetPagedAsync(
            request.PageNumber, request.PageSize,
            c => c.UserId == request.UserId && !c.IsDeleted,
            cancellationToken);

        var dtos = items.Select(c => new ContractDto
        {
            Id = c.Id,
            ClientId = c.ClientId,
            ClientName = c.Client?.Name ?? string.Empty,
            Title = c.Title,
            Content = c.Content,
            StartDate = c.StartDate,
            EndDate = c.EndDate,
            IsSigned = c.IsSigned,
            LinkedInvoiceId = c.LinkedInvoiceId,
            CreatedAt = c.CreatedAt
        });

        return new PagedResult<ContractDto>
        {
            Items = dtos,
            TotalCount = total,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize
        };
    }
}
