using MediatR;
using Microsoft.Extensions.Logging;
using SmartInvoice.Application.Interfaces;

namespace SmartInvoice.Application.Behaviours;

/// <summary>
/// MediatR pipeline behaviour that writes an audit log entry after any
/// mutation command (Create*, Update*, Delete*) succeeds.
/// Logs: timestamp (UTC), user ID, action (command name), entity ID if present.
/// </summary>
public class AuditBehaviour<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    private static readonly string[] MutationPrefixes = ["Create", "Update", "Delete"];

    private readonly ILogger<AuditBehaviour<TRequest, TResponse>> _logger;
    private readonly ICurrentUserService _currentUser;

    public AuditBehaviour(
        ILogger<AuditBehaviour<TRequest, TResponse>> logger,
        ICurrentUserService currentUser)
    {
        _logger = logger;
        _currentUser = currentUser;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        var isMutation = MutationPrefixes.Any(p =>
            requestName.StartsWith(p, StringComparison.OrdinalIgnoreCase));

        if (!isMutation)
            return await next();

        var response = await next();

        // Attempt to extract entity ID via reflection (Id or EntityId property)
        var entityId = typeof(TRequest).GetProperty("Id")?.GetValue(request)
                    ?? typeof(TRequest).GetProperty("EntityId")?.GetValue(request);

        _logger.LogInformation(
            "[AUDIT] {Action} | User={UserId} | Entity={EntityId} | At={Timestamp}",
            requestName,
            _currentUser.UserId?.ToString() ?? "anonymous",
            entityId?.ToString() ?? "n/a",
            DateTime.UtcNow.ToString("o"));

        return response;
    }
}
