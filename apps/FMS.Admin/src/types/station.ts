/**
 * File:          station.ts
 * Purpose:       Type definitions for operator station provisioning APIs.
 * Dependencies:  tenant pagination type
 * Last Modified: 2026-05-20
 */
import type { PaginationMetadata } from './tenant';

export type OperatorStation = {
  id: number;
  tenantId: string;
  tenantName?: string | null;
  name: string;
  isActive: boolean;
  siteAdministratorId?: string | null;
  gpsGateTagId?: number | null;
  gpsGateTagName?: string | null;
  gpsGeofenceId?: number | null;
  gpsGeofenceName?: string | null;
  tankCount: number;
  vehicleCount: number;
};

export type StationListPayload = {
  items: OperatorStation[];
  pagination: PaginationMetadata;
};