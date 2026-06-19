using System.ComponentModel.DataAnnotations;
using SmartInvoice.Application.DTOs;
using SmartInvoice.Domain.Enums;

namespace SmartInvoice.API.Contracts.Requests;

public record CreateInvoiceRequest(
    [Required] Guid ClientId,
    [Required] DateTime IssuedDate,
    [Required] DateTime DueDate,
    [Required] Currency Currency,
    [MaxLength(2000)] string? Notes,
    [Required, MinLength(1)] List<CreateInvoiceItemRequest> Items);

public record UpdateStatusRequest([Required] InvoiceStatus Status);

public record UpdateInvoiceRequest(
    [Required] Guid ClientId,
    [Required] DateTime IssuedDate,
    [Required] DateTime DueDate,
    [Required] Currency Currency,
    [MaxLength(2000)] string? Notes,
    [Required, MinLength(1)] List<CreateInvoiceItemRequest> Items);