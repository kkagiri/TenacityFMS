/**
 * File:          salesPipeline.ts
 * Purpose:       Type definitions for operator sales pipeline APIs.
 * Dependencies:  tenant pagination type
 * Last Modified: 2026-05-20
 */
import type { PaginationMetadata } from './tenant';

export type SalesPipelineItem = {
  id: string;
  source: 'manual' | 'onboarding' | string;
  recordType: string;
  customerName: string;
  contactEmail: string;
  contactPhone?: string | null;
  planId: string;
  planName: string;
  currencyCode: string;
  billingCycle: string;
  priceOverride?: number | null;
  status: string;
  salesRep?: string | null;
  notes?: string | null;
  latestFollowUpNote?: string | null;
  latestFollowUpAtUtc?: string | null;
  createdAtUtc: string;
  lastStageAtUtc?: string | null;
  provisionedTenantId?: string | null;
  provisionedSubscriptionId?: string | null;
};

export type SalesPipelineListPayload = {
  items: SalesPipelineItem[];
  pagination: PaginationMetadata;
};