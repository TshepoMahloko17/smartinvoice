using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartInvoice.API.Contracts.Requests;
using SmartInvoice.Application.DTOs;
using SmartInvoice.Application.Features.Invoices.Commands.CreateInvoice;
using SmartInvoice.Application.Features.Invoices.Commands.DeleteInvoice;
using SmartInvoice.Application.Features.Invoices.Commands.UpdateInvoice;
using SmartInvoice.Application.Features.Invoices.Commands.UpdateInvoiceStatus;
using SmartInvoice.Application.Features.Invoices.Queries.DownloadInvoicePdf;
using SmartInvoice.Application.Features.Invoices.Queries.GetInvoiceById;
using SmartInvoice.Application.Features.Invoices.Queries.GetInvoices;
using SmartInvoice.Application.Interfaces;
using SmartInvoice.Domain.Enums;

namespace SmartInvoice.API.Controllers;

[ApiController]
[Route("api/invoices")]
[Authorize]
public class InvoicesController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public InvoicesController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] InvoiceStatus? status = null,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(
            new GetInvoicesQuery(_currentUser.UserId!.Value, page, pageSize, search, status), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new GetInvoiceByIdQuery(id), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInvoiceRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new CreateInvoiceCommand(
            request.ClientId,
            _currentUser.UserId!.Value,
            request.IssuedDate,
            request.DueDate,
            request.Currency,
            request.Notes,
            request.Items), ct);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(
        Guid id, [FromBody] UpdateInvoiceRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new UpdateInvoiceCommand(
            id,
            request.ClientId,
            request.IssuedDate,
            request.DueDate,
            request.Currency,
            request.Notes,
            request.Items), ct);
        return Ok(result);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(
        Guid id, [FromBody] UpdateStatusRequest request, CancellationToken ct)
    {
        await _mediator.Send(new UpdateInvoiceStatusCommand(id, request.Status), ct);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        await _mediator.Send(new DeleteInvoiceCommand(id), ct);
        return NoContent();
    }

    [HttpGet("{id:guid}/download-pdf")]
    public async Task<IActionResult> DownloadPdf(Guid id, CancellationToken ct)
    {
        var pdf = await _mediator.Send(new DownloadInvoicePdfQuery(id), ct);
        return File(pdf, "application/pdf", $"invoice-{id}.pdf");
    }
}
