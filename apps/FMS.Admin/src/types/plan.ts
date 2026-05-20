/**
 * File:          plan.ts
 * Purpose:       Type definitions for operator plan/pricing APIs.
 * Dependencies:  tenant pagination type
 * Last Modified: 2026-05-20
 */
import type { PaginationMetadata } from './tenant';

export type PlanPrice = {
  id: string;
  currencyCode: string;
  billingCycle: string;
  amount: number;
  isActive: boolean;
};

export type PlanQuota = {
  id: string;
  metric: string;
  includedUnits: number;
};

export type PlanFeature = {
  id: string;
  featureKey: string;
  featureValue: string;
};

export type OperatorPlan = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  isPublic: boolean;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
  prices: PlanPrice[];
  quotas: PlanQuota[];
  features: PlanFeature[];
};

export type PlanListPayload = {
  items: OperatorPlan[];
  pagination: PaginationMetadata;
};