using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartInvoice.Application.Features.Contracts.Commands;
using SmartInvoice.Application.Interfaces;

namespace SmartInvoice.API.Controllers;

[ApiController]
[Route("api/contracts")]
[Authorize]
public class ContractsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public ContractsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetContractsQuery(_currentUser.UserId!.Value, page, pageSize), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateContractRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new CreateContractCommand(
            _currentUser.UserId!.Value,
            request.ClientId, request.Title, request.Content,
            request.StartDate, request.EndDate), ct);
        return Created(string.Empty, result);
    }

    [HttpPatch("{id:guid}/link-invoice/{invoiceId:guid}")]
    public async Task<IActionResult> LinkInvoice(Guid id, Guid invoiceId, CancellationToken ct)
    {
        await _mediator.Send(new LinkContractToInvoiceCommand(id, invoiceId), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteContractCommand(id), ct);
        return NoContent();
    }
}

public record CreateContractRequest(
    Guid ClientId, string Title, string Content,
    DateTime StartDate, DateTime? EndDate);
