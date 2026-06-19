using System.ComponentModel.DataAnnotations;

namespace SmartInvoice.API.Contracts.Requests;

public record ClientRequest(
    [Required, MaxLength(200)] string Name,
    [Required, EmailAddress, MaxLength(256)] string Email,
    [MaxLength(50)] string? Phone,
    [MaxLength(200)] string? CompanyName);

public record CreateContractRequest(
    [Required] Guid ClientId,
    [Required, MaxLength(300)] string Title,
    [Required] string Content,
    [Required] DateTime StartDate,
    DateTime? EndDate);

public record RecordPaymentRequest(
    [Required] Guid InvoiceId,
    [Range(typeof(decimal), "0.01", "79228162514264337593543950335")] decimal Amount,
    [Required] DateTime PaidOn,
    [MaxLength(100)] string? Method,
    [MaxLength(200)] string? Reference);