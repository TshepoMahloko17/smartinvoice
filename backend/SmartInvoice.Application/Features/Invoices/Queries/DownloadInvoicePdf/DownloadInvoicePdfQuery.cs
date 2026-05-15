using MediatR;
using SmartInvoice.Application.Common.Exceptions;
using SmartInvoice.Application.Interfaces;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Application.Features.Invoices.Queries.DownloadInvoicePdf;

public record DownloadInvoicePdfQuery(Guid Id) : IRequest<byte[]>;

public class DownloadInvoicePdfHandler : IRequestHandler<DownloadInvoicePdfQuery, byte[]>
{
    private readonly IRepository<Invoice> _repository;
    private readonly IPdfService _pdfService;

    public DownloadInvoicePdfHandler(IRepository<Invoice> repository, IPdfService pdfService)
    {
        _repository = repository;
        _pdfService = pdfService;
    }

    public async Task<byte[]> Handle(DownloadInvoicePdfQuery request, CancellationToken cancellationToken)
    {
        var invoice = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(Invoice), request.Id);

        return await _pdfService.GenerateInvoicePdfAsync(invoice.Id, cancellationToken);
    }
}
