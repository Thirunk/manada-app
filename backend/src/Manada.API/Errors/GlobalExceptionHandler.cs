using Manada.Application.Common;
using Manada.Domain.Common;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Manada.API.Errors;

/// <summary>
/// Maps application exceptions to RFC 9457 Problem Details. Only safe, business-level
/// messages reach the client. Unexpected errors are logged with a correlation identifier
/// and return a generic message, so no stack traces or configuration are exposed.
/// </summary>
public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var correlationId = httpContext.TraceIdentifier;

        var (status, title, detail) = exception switch
        {
            ForbiddenException e => (StatusCodes.Status403Forbidden, "Forbidden", e.Message),
            NotFoundException e => (StatusCodes.Status404NotFound, "Not found", e.Message),
            ConflictException e => (StatusCodes.Status409Conflict, "Conflict", e.Message),
            DomainException e => (StatusCodes.Status400BadRequest, "Invalid request", e.Message),
            DependencyFailureException e => (StatusCodes.Status503ServiceUnavailable, "Dependency unavailable", e.Message),
            DbUpdateConcurrencyException => (StatusCodes.Status409Conflict, "Conflict", "The record was changed by another user. Reload it and try again."),
            _ => (StatusCodes.Status500InternalServerError, "Unexpected error", "An unexpected error occurred. Quote the correlation ID if you contact support."),
        };

        if (status == StatusCodes.Status500InternalServerError)
        {
            logger.LogError(exception, "Unhandled error. CorrelationId={CorrelationId}", correlationId);
        }

        httpContext.Response.StatusCode = status;
        httpContext.Response.ContentType = "application/problem+json";

        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = detail,
        };
        problem.Extensions["correlationId"] = correlationId;

        await httpContext.Response.WriteAsJsonAsync(problem, cancellationToken);
        return true;
    }
}
