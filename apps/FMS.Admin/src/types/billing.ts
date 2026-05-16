import type { PaginationMetadata } from './tenant';

export type SubscriptionStatus =
  | 'Trialing'
  | 'Active'
  | 'PastDue'
  | 'Cancelled'
  | 'Suspended'
  | 'Expired';

export type BillingCycle = 'Monthly' | 'Annual';

export type SubscriptionSummary = {
  id: string;
  tenantId: string;
  planId: string;
  planCode: string;
  planName: string;
  currencyCode: string;
  billingCycle: BillingCycle | string;
  status: SubscriptionStatus | string;
  paymentProvider: string;
  externalSubscriptionId?: string | null;
  startAtUtc: string;
  currentPeriodEndUtc?: string | null;
  cancelledAtUtc?: string | null;
};

export type SubscriptionListPayload = {
  items: SubscriptionSummary[];
  pagination: PaginationMetadata;
};

export type InvoiceStatus =
  | 'Draft'
  | 'Open'
  | 'Paid'
  | 'Void'
  | 'Uncollectible';

export type InvoiceSummary = {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  subscriptionId?: string | null;
  currencyCode: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  status: InvoiceStatus | string;
  periodStartUtc: string;
  periodEndUtc: string;
  issuedAtUtc: string;
  dueAtUtc: string;
  paidAtUtc?: string | null;
};

export type InvoiceListPayload = {
  items: InvoiceSummary[];
  pagination: PaginationMetadata;
};
