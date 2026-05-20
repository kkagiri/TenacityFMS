/*
 * File:          ManualSaleConfiguration.cs
 * Purpose:       EF configurations for ManualSale, OnboardingRequest, AuditLog.
 * Last Modified: 2026-04-29
 */
using FMS.Sales.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FMS.Sales.Persistence.Configurations;

public class ManualSaleConfiguration : IEntityTypeConfiguration<ManualSale>
{
    public void Configure(EntityTypeBuilder<ManualSale> b)
    {
        b.ToTable("manual_sale");
        b.HasKey(x => x.Id);
        b.Property(x => x.CustomerName).HasMaxLength(256).IsRequired();
        b.Property(x => x.ContactEmail).HasMaxLength(256).IsRequired();
        b.Property(x => x.ContactPhone).HasMaxLength(64);
        b.Property(x => x.CountryCode).HasMaxLength(8);
        b.Property(x => x.CompanyAddress).HasMaxLength(512);
        b.Property(x => x.CurrencyCode).HasMaxLength(3).IsRequired();
        b.Property(x => x.BillingCycle).HasConversion<string>().HasMaxLength(16);
        b.Property(x => x.PriceOverride).HasColumnType("numeric(19,4)");
        b.Property(x => x.PaymentTerms).HasMaxLength(32);
        b.Property(x => x.PurchaseOrderNumber).HasMaxLength(64);
        b.Property(x => x.SalesRep).HasMaxLength(128);
        b.Property(x => x.Notes).HasMaxLength(1024);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(16);
        b.Property(x => x.ApprovedBy).HasMaxLength(128);
        b.HasOne(x => x.Plan).WithMany().HasForeignKey(x => x.PlanId);
        b.HasOne(x => x.Currency).WithMany().HasForeignKey(x => x.CurrencyCode);
        b.HasMany(x => x.FollowUps).WithOne(x => x.ManualSale).HasForeignKey(x => x.ManualSaleId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class OnboardingRequestConfiguration : IEntityTypeConfiguration<OnboardingRequest>
{
    public void Configure(EntityTypeBuilder<OnboardingRequest> b)
    {
        b.ToTable("onboarding_request");
        b.HasKey(x => x.Id);
        b.Property(x => x.Email).HasMaxLength(256).IsRequired();
        b.Property(x => x.CompanyName).HasMaxLength(256).IsRequired();
        b.Property(x => x.CountryCode).HasMaxLength(8);
        b.Property(x => x.CurrencyCode).HasMaxLength(3).IsRequired();
        b.Property(x => x.BillingCycle).HasConversion<string>().HasMaxLength(16);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(16);
        b.Property(x => x.StripeCheckoutSessionId).HasMaxLength(128);
        b.HasOne(x => x.Plan).WithMany().HasForeignKey(x => x.PlanId);
        b.HasMany(x => x.FollowUps).WithOne(x => x.OnboardingRequest).HasForeignKey(x => x.OnboardingRequestId).OnDelete(DeleteBehavior.Cascade);
        b.HasIndex(x => x.Email);
    }
}

public class SalesPipelineFollowUpConfiguration : IEntityTypeConfiguration<SalesPipelineFollowUp>
{
    public void Configure(EntityTypeBuilder<SalesPipelineFollowUp> b)
    {
        b.ToTable("pipeline_follow_up");
        b.HasKey(x => x.Id);
        b.Property(x => x.Note).HasMaxLength(1024).IsRequired();
        b.Property(x => x.CreatedBy).HasMaxLength(128);
        b.HasIndex(x => x.ManualSaleId);
        b.HasIndex(x => x.OnboardingRequestId);
        b.HasIndex(x => x.CreatedAtUtc);
    }
}

public class SalesAuditLogConfiguration : IEntityTypeConfiguration<SalesAuditLog>
{
    public void Configure(EntityTypeBuilder<SalesAuditLog> b)
    {
        b.ToTable("audit_log");
        b.HasKey(x => x.Id);
        b.Property(x => x.EntityType).HasMaxLength(64).IsRequired();
        b.Property(x => x.Action).HasMaxLength(64).IsRequired();
        b.Property(x => x.Actor).HasMaxLength(128);
        b.Property(x => x.PayloadJson).HasColumnType("jsonb");
        b.HasIndex(x => new { x.EntityType, x.EntityId });
    }
}
