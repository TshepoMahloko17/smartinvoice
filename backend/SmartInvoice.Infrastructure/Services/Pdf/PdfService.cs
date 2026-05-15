using iTextSharp.text;
using iTextSharp.text.pdf;
using Microsoft.Extensions.Logging;
using SmartInvoice.Application.Interfaces;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Domain.Interfaces;

namespace SmartInvoice.Infrastructure.Services.Pdf;

public class PdfService : IPdfService
{
    private readonly IRepository<Invoice> _invoiceRepository;
    private readonly ILogger<PdfService> _logger;

    public PdfService(IRepository<Invoice> invoiceRepository, ILogger<PdfService> logger)
    {
        _invoiceRepository = invoiceRepository;
        _logger = logger;
    }

    public async Task<byte[]> GenerateInvoicePdfAsync(Guid invoiceId, CancellationToken cancellationToken = default)
    {
        var invoice = await _invoiceRepository.GetByIdAsync(invoiceId, cancellationToken)
            ?? throw new InvalidOperationException($"Invoice {invoiceId} not found.");

        using var stream = new MemoryStream();
        var doc = new Document(PageSize.A4, 50f, 50f, 50f, 50f);
        var writer = PdfWriter.GetInstance(doc, stream);
        doc.Open();

        var titleFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 20);
        var boldFont = FontFactory.GetFont(FontFactory.HELVETICA_BOLD, 10);
        var normalFont = FontFactory.GetFont(FontFactory.HELVETICA, 10);

        doc.Add(new Paragraph("SmartInvoice", titleFont));
        doc.Add(new Paragraph($"Invoice: {invoice.InvoiceNumber}", boldFont));
        doc.Add(new Paragraph($"Date: {invoice.IssuedDate:dd MMM yyyy}", normalFont));
        doc.Add(new Paragraph($"Due: {invoice.DueDate:dd MMM yyyy}", normalFont));
        doc.Add(new Paragraph($"Client: {invoice.Client?.Name}", normalFont));
        doc.Add(Chunk.NEWLINE);

        var table = new PdfPTable(4) { WidthPercentage = 100 };
        table.AddCell(new PdfPCell(new Phrase("Description", boldFont)));
        table.AddCell(new PdfPCell(new Phrase("Qty", boldFont)));
        table.AddCell(new PdfPCell(new Phrase("Unit Price", boldFont)));
        table.AddCell(new PdfPCell(new Phrase("Total", boldFont)));

        foreach (var item in invoice.Items)
        {
            table.AddCell(new Phrase(item.Description, normalFont));
            table.AddCell(new Phrase(item.Quantity.ToString(), normalFont));
            table.AddCell(new Phrase(item.UnitPrice.ToString("F2"), normalFont));
            table.AddCell(new Phrase(item.LineTotal.ToString("F2"), normalFont));
        }

        doc.Add(table);
        doc.Add(Chunk.NEWLINE);
        doc.Add(new Paragraph($"Total: {invoice.Currency} {invoice.Total:F2}", boldFont));
        doc.Add(new Paragraph($"Status: {invoice.Status}", normalFont));

        doc.Close();

        _logger.LogInformation("Generated PDF for invoice {InvoiceNumber}", invoice.InvoiceNumber);
        return stream.ToArray();
    }
}
