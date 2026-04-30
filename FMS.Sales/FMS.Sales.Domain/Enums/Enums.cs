/*
 * File:          Enums.cs
 * Purpose:       Enumerations used across the Sales bounded context.
 * Last Modified: 2026-04-29
 */
namespace FMS.Sales.Domain.Enums;

public enum BillingCycle
{
    Monthly = 0,
    Annual = 1,
}

public enum SubscriptionStatus
{
    Trialing = 0,
    Active = 1,
    PastDue = 2,
    Cancelled = 3,
    Suspended = 4,
    Expired = 5,
}

public enum InvoiceStatus
{
    Draft = 0,
    Open = 1,
    Paid = 2,
    Void = 3,
    Uncollectible = 4,
}

public enum PaymentProvider
{
    Stripe = 0,
    Manual = 1,
    BankTransfer = 2,
    Paddle = 3,
    RazorPay = 4,
}

public enum PaymentStatus
{
    Pending = 0,
    Succeeded = 1,
    Failed = 2,
    Refunded = 3,
}

public enum MeterKey
{
    Sites = 0,
    Users = 1,
    Devices = 2,
    Vehicles = 3,
    RfidTags = 4,
    PtsPumps = 5,
    TankSensors = 6,
    Transactions = 7,
}

public enum ManualSaleStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2,
    Provisioned = 3,
    Cancelled = 4,
}

public enum OnboardingStatus
{
    Pending = 0,
    CheckoutStarted = 1,
    Completed = 2,
    Failed = 3,
    Expired = 4,
}

public enum DiscountType
{
    Percentage = 0,
    FixedAmount = 1,
}
