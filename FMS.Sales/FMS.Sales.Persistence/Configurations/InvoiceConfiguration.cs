/*
 * File:          InvoiceConfiguration.cs
 * Purpose:       EF configurations for Invoice, InvoiceLine, Payment.
 * Last Modified: 2026-04-29
 */
using FMS.Sales.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Sales.Persistence.Configurations;

public class InvoiceConfiguration : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> b)
    {
        b.ToTable("invoice");
        b.HasKey(x => x.Id);
        b.Property(x => x.InvoiceNumber).HasMaxLength(32).IsRequired();
        b.HasIndex(x => x.InvoiceNumber).IsUnique();
        b.HasIndex(x => x.TenantId);
        b.Property(x => x.CurrencyCode).HasMaxLength(3).IsRequired();
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(16);
        b.Property(x => x.Subtotal).HasColumnType("numeric(19,4)");
        b.Property(x => x.DiscountAmount).HasColumnType("numeric(19,4)");
        b.Property(x => x.TaxAmount).HasColumnType("numeric(19,4)");
        b.Property(x => x.Total).HasColumnType("numeric(19,4)");
        b.Property(x => x.AmountPaid).HasColumnType("numeric(19,4)");
        b.Property(x => x.ExternalInvoiceId).HasMaxLength(128);
        b.Property(x => x.Notes).HasMaxLength(1024);
        b.HasOne(x => x.Currency).WithMany().HasForeignKey(x => x.CurrencyCode);
        b.HasOne(x => x.Subscription).WithMany(x => x.Invoices).HasForeignKey(x => x.SubscriptionId).OnDelete(DeleteBehavior.SetNull);
        b.HasMany(x => x.Lines).WithOne(x => x.Invoice).HasForeignKey(x => x.InvoiceId).OnDelete(DeleteBehavior.Cascade);
        b.HasMany(x => x.Payments).WithOne(x => x.Invoice).HasForeignKey(x => x.InvoiceId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class InvoiceLineConfiguration : IEntityTypeConfiguration<InvoiceLine>
{
    public void Configure(EntityTypeBuilder<InvoiceLine> b)
    {
        b.ToTable("invoice_line");
        b.HasKey(x => x.Id);
        b.Property(x => x.Description).HasMaxLength(256).IsRequired();
        b.Property(x => x.UnitPrice).HasColumnType("numeric(19,4)");
        b.Property(x => x.Amount).HasColumnType("numeric(19,4)");
        b.Property(x => x.ItemKey).HasMaxLength(64);
    }
}

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> b)
    {
        b.ToTable("payment");
        b.HasKey(x => x.Id);
        b.Property(x => x.Provider).HasConversion<string>().HasMaxLength(16);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(16);
        b.Property(x => x.Amount).HasColumnType("numeric(19,4)").IsRequired();
        b.Property(x => x.CurrencyCode).HasMaxLength(3).IsRequired();
        b.Property(x => x.ExternalPaymentId).HasMaxLength(128);
        b.Property(x => x.ManualReference).HasMaxLength(128);
        b.Property(x => x.Notes).HasMaxLength(1024);
    }
}
