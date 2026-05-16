/**
 * File:          deviceProvider.ts
 * Purpose:       FMS.Admin device-provider API DTO types.
 * Dependencies:  tenant types
 * Last Modified: 2026-05-15
 *
 * Key Functions:
 * - Type declarations for operator provider and mapping payloads.
 */

import type { PaginationMetadata } from "./tenant";

export type OperatorDeviceProvider = {
  providerId: number;
  tenantId: string;
  tenantCode: string;
  tenantName: string;
  tenantKind: string;
  providerName: string;
  displayName: string;
  description?: string | null;
  deviceCategory: string;
  isEnabled: boolean;
  isDefault: boolean;
  priorityOrder: number;
  configurationData: string;
  createdAt: string;
  updatedAt: string;
};

export type OperatorDeviceProviderListPayload = {
  items: OperatorDeviceProvider[];
  pagination: PaginationMetadata;
};

export type OperatorDeviceProviderMapping = {
  mappingId: number;
  tenantId: string;
  tenantCode: string;
  tenantName: string;
  providerId: number;
  providerName: string;
  deviceCategory: string;
  vehicleId?: number | null;
  fuelingDeviceId?: number | null;
  externalDeviceId?: string | null;
  deviceIMEI?: string | null;
  deviceName?: string | null;
  deviceType?: string | null;
  isActive: boolean;
  createdAt: string;
};

export type OperatorDeviceProviderMappingListPayload = {
  items: OperatorDeviceProviderMapping[];
  count: number;
};
