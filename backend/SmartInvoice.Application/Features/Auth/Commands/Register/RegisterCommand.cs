using MediatR;
using SmartInvoice.Application.DTOs.Auth;

namespace SmartInvoice.Application.Features.Auth.Commands.Register;

public record RegisterCommand(
    string FirstName,
    string LastName,
    string Email,
    string Password) : IRequest<AuthResponseDto>;
