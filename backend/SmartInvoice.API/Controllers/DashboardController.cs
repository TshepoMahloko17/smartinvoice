using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartInvoice.Application.Features.Dashboard.Queries.GetDashboardStats;
using SmartInvoice.Application.Features.Dashboard.Queries.GetRevenueChart;
using SmartInvoice.Application.Interfaces;

namespace SmartInvoice.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ICurrentUserService _currentUser;

    public DashboardController(IMediator mediator, ICurrentUserService currentUser)
    {
        _mediator = mediator;
        _currentUser = currentUser;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetDashboardStatsQuery(_currentUser.UserId!.Value), ct);
        return Ok(result);
    }

    [HttpGet("revenue-chart")]
    public async Task<IActionResult> GetRevenueChart([FromQuery] string range = "6M", CancellationToken ct = default)
    {
        var result = await _mediator.Send(new GetRevenueChartQuery(_currentUser.UserId!.Value, range), ct);
        return Ok(result);
    }
}
