using MediatR;
using SmartInvoice.Application.Common.Exceptions;
using SmartInvoice.Application.DTOs;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Application.Features.Clients.Commands;

// ─── Create ───────────────────────────────────────────────────────────────────
public record CreateClientCommand(
    Guid UserId, string Name, string Email,
    string? Phone, string? CompanyName) : IRequest<ClientDto>;

public class CreateClientHandler : IRequestHandler<CreateClientCommand, ClientDto>
{
    private readonly IRepository<Client> _repository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateClientHandler(IRepository<Client> repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ClientDto> Handle(CreateClientCommand request, CancellationToken cancellationToken)
    {
        var client = new Client
        {
            UserId = request.UserId,
            Name = request.Name,
            Email = request.Email.ToLowerInvariant(),
            Phone = request.Phone,
            CompanyName = request.CompanyName
        };

        await _repository.AddAsync(client, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ClientDto
        {
            Id = client.Id,
            Name = client.Name,
            Email = client.Email,
            Phone = client.Phone,
            CompanyName = client.CompanyName,
            CreatedAt = client.CreatedAt
        };
    }
}

// ─── Update ───────────────────────────────────────────────────────────────────
public record UpdateClientCommand(
    Guid Id, string Name, string Email,
    string? Phone, string? CompanyName) : IRequest<ClientDto>;

public class UpdateClientHandler : IRequestHandler<UpdateClientCommand, ClientDto>
{
    private readonly IRepository<Client> _repository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateClientHandler(IRepository<Client> repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ClientDto> Handle(UpdateClientCommand request, CancellationToken cancellationToken)
    {
        var client = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Client), request.Id);

        client.Name = request.Name;
        client.Email = request.Email.ToLowerInvariant();
        client.Phone = request.Phone;
        client.CompanyName = request.CompanyName;
        client.UpdatedAt = DateTime.UtcNow;

        _repository.Update(client);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ClientDto { Id = client.Id, Name = client.Name, Email = client.Email, Phone = client.Phone, CompanyName = client.CompanyName, CreatedAt = client.CreatedAt };
    }
}

// ─── Delete ───────────────────────────────────────────────────────────────────
public record DeleteClientCommand(Guid Id) : IRequest;

public class DeleteClientHandler : IRequestHandler<DeleteClientCommand>
{
    private readonly IRepository<Client> _repository;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteClientHandler(IRepository<Client> repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task Handle(DeleteClientCommand request, CancellationToken cancellationToken)
    {
        var client = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Client), request.Id);

        client.IsDeleted = true;
        client.UpdatedAt = DateTime.UtcNow;
        _repository.Update(client);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
