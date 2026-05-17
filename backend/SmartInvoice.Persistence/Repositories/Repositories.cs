using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using SmartInvoice.Domain.Entities;
using SmartInvoice.Persistence.Context;

namespace SmartInvoice.Persistence.Repositories;

public class InvoiceRepository : GenericRepository<Invoice>
{
    public InvoiceRepository(AppDbContext context) : base(context) { }

    public override async Task<Invoice?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await _context.Invoices
            .Include(i => i.Client)
            .Include(i => i.Items)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);

    public override async Task<(IEnumerable<Invoice> Items, int TotalCount)> GetPagedAsync(
        int pageNumber, int pageSize,
        Expression<Func<Invoice, bool>>? predicate = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Invoices.Include(i => i.Client).Include(i => i.Payments).AsQueryable();
        if (predicate is not null) query = query.Where(predicate);
        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        return (items, total);
    }
}

public class ClientRepository : GenericRepository<Client>
{
    public ClientRepository(AppDbContext context) : base(context) { }

    public override async Task<Client?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await _context.Clients
            .Include(c => c.Invoices)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
}

public class ContractRepository : GenericRepository<Contract>
{
    public ContractRepository(AppDbContext context) : base(context) { }

    public override async Task<Contract?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await _context.Contracts
            .Include(c => c.Client)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
}

public class PaymentRepository : GenericRepository<Payment>
{
    public PaymentRepository(AppDbContext context) : base(context) { }

    public override async Task<Payment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await _context.Payments
            .Include(p => p.Invoice)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
}
