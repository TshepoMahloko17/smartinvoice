using MediatR;
using SmartInvoice.Application.DTOs.Auth;

namespace SmartInvoice.Application.Features.Auth.Commands.Login;

public record LoginCommand(string Email, string Password) : IRequest<AuthResponseDto>;
