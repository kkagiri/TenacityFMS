export type OperatorUser = {
  id: string;
  userName: string;
  email?: string | null;
  roles: string[];
};

export type OperatorLoginResponse = {
  token: string;
  refreshToken?: string | null;
  user: OperatorUser;
};

export type JwtTenantClaims = {
  tenantKind: 'system' | 'client' | 'customer';
  tenantId: string | null;
  isPlatformOperator: boolean;
};