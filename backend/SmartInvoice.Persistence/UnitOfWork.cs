using SmartInvoice.Domain.Interfaces;
using SmartInvoice.Persistence.Context;

namespace SmartInvoice.Persistence;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _context;
    private bool _disposed;

    public UnitOfWork(AppDbContext context) => _context = context;

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        await _context.SaveChangesAsync(cancellationToken);

    public void Dispose()
    {
        if (!_disposed)
        {
            _context.Dispose();
            _disposed = true;
        }
        GC.SuppressFinalize(this);
    }
}
