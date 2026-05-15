using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartInvoice.Application.Features.Payments;
using SmartInvoice.Application.Interfaces;

namespace SmartInvoice.API.Controllers;

[ApiController]
[Route("api/payments")]
[Authorize]
public class PaymentsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public PaymentsController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetPaymentsQuery(_currentUser.UserId!.Value, page, pageSize), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Record([FromBody] RecordPaymentRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new RecordPaymentCommand(
            request.InvoiceId, request.Amount, request.PaidOn,
            request.Method, request.Reference), ct);
        return Created(string.Empty, result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeletePaymentCommand(id), ct);
        return NoContent();
    }
}

public record RecordPaymentRequest(
    Guid InvoiceId, decimal Amount, DateTime PaidOn,
    string? Method, string? Reference);
