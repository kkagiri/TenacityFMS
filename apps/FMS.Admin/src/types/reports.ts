/**
 * File:          reports.ts
 * Purpose:       Shared operator reporting DTO types for FMS.Admin.
 * Dependencies:  None
 * Last Modified: 2026-05-20
 */

export interface UsageReportRow {
  tenantId: string;
  tenantCode: string;
  tenantName: string;
  tenantKind: string;
  fuelVolume: number;
  transactionCount: number;
  activeDeviceCount: number;
}

export interface UsageReportPayload {
  fromUtc: string;
  toUtc: string;
  totals: {
    fuelVolume: number;
    transactionCount: number;
    activeDeviceCount: number;
    tenantCount: number;
  };
  items: UsageReportRow[];
}

export interface RevenueReportRow {
  tenantId: string;
  invoiceCount: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  outstandingAmount: number;
}

export interface RevenueReportPayload {
  fromUtc: string;
  toUtc: string;
  totals: {
    invoiceCount: number;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
    amountPaid: number;
    outstandingAmount: number;
  };
  items: RevenueReportRow[];
}

export interface AuditLogRow {
  id: number;
  userId: string;
  userName?: string | null;
  email?: string | null;
  operatorTenantId?: string | null;
  targetTenantId?: string | null;
  action: string;
  controller?: string | null;
  actionName?: string | null;
  parameters?: string | null;
  ipAddress?: string | null;
  timestamp: string;
  isCrossTenantAction: boolean;
}

export interface AuditLogPayload {
  items: AuditLogRow[];
  pagination: {
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
}
