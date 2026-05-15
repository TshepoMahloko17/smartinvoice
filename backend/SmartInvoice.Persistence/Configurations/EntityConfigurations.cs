using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartInvoice.Domain.Entities;

namespace SmartInvoice.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Email).HasMaxLength(256).IsRequired();
        builder.Property(u => u.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(u => u.LastName).HasMaxLength(100).IsRequired();
        builder.Property(u => u.PasswordHash).IsRequired();
        builder.HasIndex(u => u.Email).IsUnique();

        builder.HasMany(u => u.Clients).WithOne(c => c.User).HasForeignKey(c => c.UserId);
        builder.HasMany(u => u.Invoices).WithOne(i => i.User).HasForeignKey(i => i.UserId);
    }
}

public class ClientConfiguration : IEntityTypeConfiguration<Client>
{
    public void Configure(EntityTypeBuilder<Client> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Name).HasMaxLength(200).IsRequired();
        builder.Property(c => c.Email).HasMaxLength(256).IsRequired();
        builder.Property(c => c.Phone).HasMaxLength(50);
        builder.Property(c => c.CompanyName).HasMaxLength(200);

        builder.OwnsOne(c => c.BillingAddress, a =>
        {
            a.Property(p => p.Street).HasColumnName("BillingStreet").HasMaxLength(300);
            a.Property(p => p.City).HasColumnName("BillingCity").HasMaxLength(100);
            a.Property(p => p.Province).HasColumnName("BillingProvince").HasMaxLength(100);
            a.Property(p => p.PostalCode).HasColumnName("BillingPostalCode").HasMaxLength(20);
            a.Property(p => p.Country).HasColumnName("BillingCountry").HasMaxLength(100);
        });

        builder.HasMany(c => c.Invoices).WithOne(i => i.Client).HasForeignKey(i => i.ClientId);
        builder.HasMany(c => c.Contracts).WithOne(ct => ct.Client).HasForeignKey(ct => ct.ClientId);
    }
}

public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> builder)
    {
        builder.HasKey(i => i.Id);
        builder.Property(i => i.InvoiceNumber).HasMaxLength(50).IsRequired();
        builder.Property(i => i.Total).HasColumnType("decimal(18,2)");
        builder.Property(i => i.Notes).HasMaxLength(2000);
        builder.HasIndex(i => i.InvoiceNumber).IsUnique();

        builder.HasMany(i => i.Items).WithOne(it => it.Invoice).HasForeignKey(it => it.InvoiceId);
        builder.HasMany(i => i.Payments).WithOne(p => p.Invoice).HasForeignKey(p => p.InvoiceId);
        builder.HasMany(i => i.Contracts).WithOne(c => c.LinkedInvoice).HasForeignKey(c => c.LinkedInvoiceId);
    }
}

public class InvoiceItemConfiguration : IEntityTypeConfiguration<InvoiceItem>
{
    public void Configure(EntityTypeBuilder<InvoiceItem> builder)
    {
        builder.HasKey(i => i.Id);
        builder.Property(i => i.Description).HasMaxLength(500).IsRequired();
        builder.Property(i => i.UnitPrice).HasColumnType("decimal(18,2)");
        builder.Ignore(i => i.LineTotal);
    }
}

public class ContractConfiguration : IEntityTypeConfiguration<Contract>
{
    public void Configure(EntityTypeBuilder<Contract> builder)
    {
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Title).HasMaxLength(300).IsRequired();
    }
}

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Amount).HasColumnType("decimal(18,2)").IsRequired();
        builder.Property(p => p.Method).HasMaxLength(100);
        builder.Property(p => p.Reference).HasMaxLength(200);
    }
}
