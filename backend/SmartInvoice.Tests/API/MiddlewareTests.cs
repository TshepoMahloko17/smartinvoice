using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using SmartInvoice.API.Middleware;
using SmartInvoice.Application.Common.Exceptions;

namespace SmartInvoice.Tests.API;

public class MiddlewareTests
{
    [Fact]
    public async Task CorrelationIdMiddleware_UsesIncomingHeader_WhenProvided()
    {
        var context = new DefaultHttpContext();
        context.Request.Headers["X-Correlation-ID"] = "corr-123";

        var middleware = new CorrelationIdMiddleware(_ => Task.CompletedTask);
        await middleware.InvokeAsync(context);

        Assert.Equal("corr-123", context.TraceIdentifier);
        Assert.Equal("corr-123", context.Response.Headers["X-Correlation-ID"].ToString());
    }

    [Fact]
    public async Task ExceptionMiddleware_ReturnsStandardizedValidationPayload()
    {
        var context = new DefaultHttpContext();
        var stream = new MemoryStream();
        context.Response.Body = stream;
        context.TraceIdentifier = "corr-xyz";

        RequestDelegate next = _ => throw new ValidationException(
            [new FluentValidation.Results.ValidationFailure("Email", "Email is required")]);

        var middleware = new ExceptionMiddleware(next, NullLogger<ExceptionMiddleware>.Instance);

        await middleware.InvokeAsync(context);

        Assert.Equal(StatusCodes.Status422UnprocessableEntity, context.Response.StatusCode);

        stream.Position = 0;
        var body = await new StreamReader(stream, Encoding.UTF8).ReadToEndAsync();

        Assert.Contains("\"Code\":\"validation_failed\"", body);
        Assert.Contains("\"CorrelationId\":\"corr-xyz\"", body);
        Assert.Contains("\"Email\"", body);
    }
}