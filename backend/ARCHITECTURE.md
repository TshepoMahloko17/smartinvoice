# Backend Architecture Standards

## Purpose

This document defines the backend implementation standards for SmartInvoice and maps key implementation decisions to maintainability, resilience, and operational quality.

## Layer Responsibilities

- API layer: transport only (routing, auth, request/response mapping, status codes).
- Application layer: use-case orchestration, validation, and business services.
- Domain layer: entities, value objects, and domain rules.
- Persistence layer: EF Core DbContext, repositories, and transactional persistence.
- Infrastructure layer: external dependencies (email, PDF, JWT, hashing).

## Contracts and Validation

- API request contracts are centralized in API contract files under Contracts/Requests.
- Contract-level validation uses DataAnnotations for immediate API contract safety.
- Use-case validation uses FluentValidation via MediatR pipeline behaviors.
- Error responses are standardized and include machine-readable code and correlation ID.

## Services and Business Logic

- Handlers orchestrate dependencies and persistence boundaries only.
- Domain rules are encapsulated in application services (example: InvoiceDomainService).
- Cross-cutting concerns are handled through MediatR behaviors (validation, logging, audit).

## Repositories and Data Access

- Generic repository read methods use no-tracking for query efficiency.
- Specialized repositories include required relations for read models to avoid N+1 and null navigation data.
- EF Core Npgsql execution retries are enabled for transient database failures.

## Logging, Correlation, and Monitoring

- CorrelationIdMiddleware accepts incoming X-Correlation-ID or generates one.
- Correlation ID is propagated to response headers and log scopes.
- Request logs are structured and include method, path, status, elapsed time, and correlation ID.
- Serilog is configured with log context enrichment and file/console sinks.

## Retry and Fault Handling

- External email delivery uses bounded retry with exponential backoff and jitter.
- Retry attempts are logged with structured metadata for observability.
- Non-transient email failures are logged at error level and rethrown.

## Error Handling Contract

All unhandled exceptions are translated to a consistent JSON shape:

- status: HTTP status code.
- code: machine-readable error code.
- message: human-readable message.
- correlationId: request correlation token.
- errors: field-level validation dictionary (when applicable).

## Testing Strategy

- Unit tests: handlers, domain services, and middleware logic.
- Integration tests: recommended via WebApplicationFactory/Testcontainers for API and persistence boundaries.
- End-to-end tests: user flows through frontend + backend; mock external services where appropriate.

## Recommended Next Improvements

- Add integration tests for API error contract and repository query behavior using ephemeral PostgreSQL.
- Add end-to-end tests with external dependency mocks for SendGrid.
- Upgrade vulnerable/outdated packages and align all EF Core versions.
- Add OpenTelemetry exporter (OTLP/Application Insights) for distributed tracing and metrics.
