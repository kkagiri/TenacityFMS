/*
 * File:          SubscriptionConfiguration.cs
 * Purpose:       EF configurations for Subscription, SubscriptionItem,
 *                UsageRecord, Coupon.
 * Last Modified: 2026-04-29
 */
using FMS.Sales.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Sales.Persistence.Configurations;

public class SubscriptionConfiguration : IEntityTypeConfiguration<Subscription>
{
    public void Configure(EntityTypeBuilder<Subscription> b)
    {
        b.ToTable("subscription");
        b.HasKey(x => x.Id);
        b.Property(x => x.TenantId).IsRequired();
        b.HasIndex(x => x.TenantId);
        b.Property(x => x.CurrencyCode).HasMaxLength(3).IsRequired();
        b.Property(x => x.BillingCycle).HasConversion<string>().HasMaxLength(16);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(16);
        b.Property(x => x.PaymentProvider).HasConversion<string>().HasMaxLength(16);
        b.Property(x => x.ExternalSubscriptionId).HasMaxLength(128);
        b.Property(x => x.ExternalCustomerId).HasMaxLength(128);
        b.HasOne(x => x.Currency).WithMany().HasForeignKey(x => x.CurrencyCode);
        b.HasOne(x => x.Plan).WithMany().HasForeignKey(x => x.PlanId);
        b.HasOne(x => x.Coupon).WithMany().HasForeignKey(x => x.CouponId).OnDelete(DeleteBehavior.SetNull);
        b.HasMany(x => x.Items).WithOne(x => x.Subscription).HasForeignKey(x => x.SubscriptionId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class SubscriptionItemConfiguration : IEntityTypeConfiguration<SubscriptionItem>
{
    public void Configure(EntityTypeBuilder<SubscriptionItem> b)
    {
        b.ToTable("subscription_item");
        b.HasKey(x => x.Id);
        b.Property(x => x.ItemKey).HasMaxLength(64).IsRequired();
        b.Property(x => x.Metric).HasConversion<string>().HasMaxLength(32);
        b.Property(x => x.UnitPrice).HasColumnType("numeric(19,4)").IsRequired();
        b.Property(x => x.Description).HasMaxLength(256);
    }
}

public class UsageRecordConfiguration : IEntityTypeConfiguration<UsageRecord>
{
    public void Configure(EntityTypeBuilder<UsageRecord> b)
    {
        b.ToTable("usage_record");
        b.HasKey(x => x.Id);
        b.Property(x => x.Metric).HasConversion<string>().HasMaxLength(32).IsRequired();
        b.HasIndex(x => new { x.TenantId, x.Metric, x.RecordedDate }).IsUnique();
    }
}

public class CouponConfiguration : IEntityTypeConfiguration<Coupon>
{
    public void Configure(EntityTypeBuilder<Coupon> b)
    {
        b.ToTable("coupon");
        b.HasKey(x => x.Id);
        b.Property(x => x.Code).HasMaxLength(64).IsRequired();
        b.HasIndex(x => x.Code).IsUnique();
        b.Property(x => x.Description).HasMaxLength(256);
        b.Property(x => x.DiscountType).HasConversion<string>().HasMaxLength(16);
        b.Property(x => x.DiscountValue).HasColumnType("numeric(19,4)").IsRequired();
        b.Property(x => x.CurrencyCode).HasMaxLength(3);
        b.Property(x => x.IsActive).HasDefaultValue(true);
    }
}
