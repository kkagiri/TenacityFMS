/*
 * File:          SalesDbContext.cs
 * Purpose:       EF Core DbContext for the Sales bounded context. Lives in
 *                the same Postgres database as the main FMS context but uses
 *                a separate migration history table and table prefix.
 * Last Modified: 2026-04-29
 */
using FMS.Sales.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace FMS.Sales.Persistence;

public class SalesDbContext : DbContext
{
    public const string MigrationsHistoryTable = "__sales_migrations_history";

    public SalesDbContext(DbContextOptions<SalesDbContext> options) : base(options)
    {
    }

    public DbSet<Currency> Currencies => Set<Currency>();
    public DbSet<Plan> Plans => Set<Plan>();
    public DbSet<PlanFeature> PlanFeatures => Set<PlanFeature>();
    public DbSet<PlanQuota> PlanQuotas => Set<PlanQuota>();
    public DbSet<PlanPrice> PlanPrices => Set<PlanPrice>();
    public DbSet<MeteredPrice> MeteredPrices => Set<MeteredPrice>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<SubscriptionItem> SubscriptionItems => Set<SubscriptionItem>();
    public DbSet<UsageRecord> UsageRecords => Set<UsageRecord>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceLine> InvoiceLines => Set<InvoiceLine>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<ManualSale> ManualSales => Set<ManualSale>();
    public DbSet<OnboardingRequest> OnboardingRequests => Set<OnboardingRequest>();
    public DbSet<SalesPipelineFollowUp> PipelineFollowUps => Set<SalesPipelineFollowUp>();
    public DbSet<SalesAuditLog> AuditLogs => Set<SalesAuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SalesDbContext).Assembly);

        // Prefix every table with sales_ so they are clearly bounded to this context.
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            var current = entity.GetTableName();
            if (!string.IsNullOrEmpty(current) && !current.StartsWith("sales_"))
            {
                entity.SetTableName($"sales_{current}");
            }
        }
    }
}
