using MediatR;
using Microsoft.AspNetCore.Mvc;
using SmartInvoice.Application.DTOs.Auth;
using SmartInvoice.Application.Features.Auth.Commands.Login;
using SmartInvoice.Application.Features.Auth.Commands.RefreshToken;
using SmartInvoice.Application.Features.Auth.Commands.Register;

namespace SmartInvoice.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator) => _mediator = mediator;

    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(
            new RegisterCommand(request.FirstName, request.LastName, request.Email, request.Password), ct);
        return CreatedAtAction(nameof(Register), result);
    }

    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new LoginCommand(request.Email, request.Password), ct);
        return Ok(result);
    }

    [HttpPost("refresh-token")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request, CancellationToken ct)
    {
        var result = await _mediator.Send(new RefreshTokenCommand(request.RefreshToken), ct);
        return Ok(result);
    }
}
