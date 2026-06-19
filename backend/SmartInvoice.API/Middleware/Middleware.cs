using System.Net;
using System.Text.Json;
using SmartInvoice.API.Contracts.Responses;
using SmartInvoice.Application.Common.Exceptions;

namespace SmartInvoice.API.Middleware;

public class ExceptionMiddleware
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, code, message, errors) = exception switch
        {
            ValidationException vex => (
                HttpStatusCode.UnprocessableEntity,
                "validation_failed",
                "Validation failed.",
                vex.Errors),
            NotFoundException => (
                HttpStatusCode.NotFound,
                "resource_not_found",
                exception.Message,
                (IDictionary<string, string[]>?)null),
            UnauthorizedException => (
                HttpStatusCode.Unauthorized,
                "unauthorized",
                exception.Message,
                null),
            _ => (
                HttpStatusCode.InternalServerError,
                "internal_server_error",
                "An unexpected error occurred.",
                null)
        };

        context.Response.StatusCode = (int)statusCode;
        var correlationId = context.TraceIdentifier;

        var response = new ErrorResponse(
            Status: (int)statusCode,
            Code: code,
            Message: message,
            CorrelationId: correlationId,
            Errors: errors);

        await context.Response.WriteAsync(JsonSerializer.Serialize(response, JsonOptions));
    }
}

public class CorrelationIdMiddleware
{
    private const string CorrelationIdHeader = "X-Correlation-ID";
    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = context.Request.Headers.TryGetValue(CorrelationIdHeader, out var incoming)
            && !string.IsNullOrWhiteSpace(incoming)
            ? incoming.ToString()
            : Guid.NewGuid().ToString("N");

        context.TraceIdentifier = correlationId;
        context.Response.Headers[CorrelationIdHeader] = correlationId;
        await _next(context);
    }
}

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var start = DateTime.UtcNow;
        using (_logger.BeginScope(new Dictionary<string, object>
        {
            ["CorrelationId"] = context.TraceIdentifier
        }))
        {
            await _next(context);
            var elapsed = (DateTime.UtcNow - start).TotalMilliseconds;

            _logger.LogInformation(
                "{Method} {Path} responded {StatusCode} in {Elapsed}ms with correlation {CorrelationId}",
                context.Request.Method,
                context.Request.Path,
                context.Response.StatusCode,
                elapsed,
                context.TraceIdentifier);
        }
    }
}

public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        context.Response.Headers["X-Frame-Options"] = "DENY";
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";
        context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
        context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
        context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
        await _next(context);
    }
}
