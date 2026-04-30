/*
 * File:          CurrencyConfiguration.cs
 * Purpose:       EF configuration for Currency.
 * Last Modified: 2026-04-29
 */
using FMS.Sales.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Sales.Persistence.Configurations;

public class CurrencyConfiguration : IEntityTypeConfiguration<Currency>
{
    public void Configure(EntityTypeBuilder<Currency> builder)
    {
        builder.ToTable("currency");
        builder.HasKey(c => c.Code);
        builder.Property(c => c.Code).HasMaxLength(3).IsRequired();
        builder.Property(c => c.Name).HasMaxLength(64).IsRequired();
        builder.Property(c => c.Symbol).HasMaxLength(8).IsRequired();
        builder.Property(c => c.DecimalDigits).IsRequired();
        builder.Property(c => c.IsActive).HasDefaultValue(true);
    }
}
