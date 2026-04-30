/*
 * File:          PlanConfiguration.cs
 * Purpose:       EF configurations for Plan and child price/quota/feature tables.
 * Last Modified: 2026-04-29
 */
using FMS.Sales.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Sales.Persistence.Configurations;

public class PlanConfiguration : IEntityTypeConfiguration<Plan>
{
    public void Configure(EntityTypeBuilder<Plan> b)
    {
        b.ToTable("plan");
        b.HasKey(x => x.Id);
        b.Property(x => x.Code).HasMaxLength(64).IsRequired();
        b.HasIndex(x => x.Code).IsUnique();
        b.Property(x => x.Name).HasMaxLength(128).IsRequired();
        b.Property(x => x.Description).HasMaxLength(1024);
        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.IsPublic).HasDefaultValue(true);

        b.HasMany(x => x.Quotas).WithOne(x => x.Plan).HasForeignKey(x => x.PlanId).OnDelete(DeleteBehavior.Cascade);
        b.HasMany(x => x.Features).WithOne(x => x.Plan).HasForeignKey(x => x.PlanId).OnDelete(DeleteBehavior.Cascade);
        b.HasMany(x => x.Prices).WithOne(x => x.Plan).HasForeignKey(x => x.PlanId).OnDelete(DeleteBehavior.Cascade);
        b.HasMany(x => x.MeteredPrices).WithOne(x => x.Plan).HasForeignKey(x => x.PlanId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class PlanQuotaConfiguration : IEntityTypeConfiguration<PlanQuota>
{
    public void Configure(EntityTypeBuilder<PlanQuota> b)
    {
        b.ToTable("plan_quota");
        b.HasKey(x => x.Id);
        b.HasIndex(x => new { x.PlanId, x.Metric }).IsUnique();
        b.Property(x => x.Metric).HasConversion<string>().HasMaxLength(32).IsRequired();
    }
}

public class PlanFeatureConfiguration : IEntityTypeConfiguration<PlanFeature>
{
    public void Configure(EntityTypeBuilder<PlanFeature> b)
    {
        b.ToTable("plan_feature");
        b.HasKey(x => x.Id);
        b.HasIndex(x => new { x.PlanId, x.FeatureKey }).IsUnique();
        b.Property(x => x.FeatureKey).HasMaxLength(64).IsRequired();
        b.Property(x => x.FeatureValue).HasMaxLength(256).IsRequired();
    }
}

public class PlanPriceConfiguration : IEntityTypeConfiguration<PlanPrice>
{
    public void Configure(EntityTypeBuilder<PlanPrice> b)
    {
        b.ToTable("plan_price");
        b.HasKey(x => x.Id);
        b.Property(x => x.CurrencyCode).HasMaxLength(3).IsRequired();
        b.Property(x => x.BillingCycle).HasConversion<string>().HasMaxLength(16).IsRequired();
        b.Property(x => x.Amount).HasColumnType("numeric(19,4)").IsRequired();
        b.HasOne(x => x.Currency).WithMany().HasForeignKey(x => x.CurrencyCode);
        b.HasIndex(x => new { x.PlanId, x.CurrencyCode, x.BillingCycle }).IsUnique();
    }
}

public class MeteredPriceConfiguration : IEntityTypeConfiguration<MeteredPrice>
{
    public void Configure(EntityTypeBuilder<MeteredPrice> b)
    {
        b.ToTable("metered_price");
        b.HasKey(x => x.Id);
        b.Property(x => x.CurrencyCode).HasMaxLength(3).IsRequired();
        b.Property(x => x.Metric).HasConversion<string>().HasMaxLength(32).IsRequired();
        b.Property(x => x.UnitPrice).HasColumnType("numeric(19,4)").IsRequired();
        b.HasOne(x => x.Currency).WithMany().HasForeignKey(x => x.CurrencyCode);
        b.HasIndex(x => new { x.PlanId, x.CurrencyCode, x.Metric }).IsUnique();
    }
}
