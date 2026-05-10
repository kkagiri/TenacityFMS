export type TenantKind = 'system' | 'client' | 'customer';

export type OperatorTenantSummary = {
  id: string;
  code: string;
  name: string;
  tenantKind: TenantKind;
  parentTenantId?: string | null;
  isActive: boolean;
  childrenCount: number;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

export type PaginationMetadata = {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export type OperatorTenantCounts = {
  directChildTenants: number;
  descendantTenants: number;
  users: number;
  activeUsers: number;
  sites: number;
  vehicles: number;
};

export type OperatorTenantHierarchyNode = {
  id: string;
  code: string;
  name: string;
  tenantKind: TenantKind;
  isActive: boolean;
  children: OperatorTenantHierarchyNode[];
};

export type OperatorTenantDetail = OperatorTenantSummary & {
  parentTenantName?: string | null;
  counts: OperatorTenantCounts;
  hierarchy: OperatorTenantHierarchyNode[];
};