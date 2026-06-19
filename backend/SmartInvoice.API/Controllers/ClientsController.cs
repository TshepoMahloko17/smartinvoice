using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartInvoice.API.Contracts.Requests;
using SmartInvoice.Application.Features.Clients.Commands;
using SmartInvoice.Application.Features.Clients.Queries.GetClients;
using SmartInvoice.Application.Interfaces;

namespace SmartInvoice.API.Controllers;

[ApiController]
[Route("api/clients")]
[Authorize]
public class ClientsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public ClientsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null, CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetClientsQuery(_currentUser.UserId!.Value, page, pageSize, search), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetClientByIdQuery(id), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ClientRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new CreateClientCommand(
            _currentUser.UserId!.Value,
            request.Name, request.Email, request.Phone, request.CompanyName), ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] ClientRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new UpdateClientCommand(
            id, request.Name, request.Email, request.Phone, request.CompanyName), ct);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteClientCommand(id), ct);
        return NoContent();
    }
}
