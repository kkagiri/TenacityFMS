import type { PaginationMetadata } from './tenant';

export type OperatorUserSummary = {
  id: string;
  userName: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  isActive: boolean;
  roles: string[];
};

export type OperatorUserDetail = OperatorUserSummary & {
  phoneNumber?: string | null;
  emailConfirmed: boolean;
  requirePasswordChangeOnFirstLogin: boolean;
};

export type OperatorUserListPayload = {
  items: OperatorUserSummary[];
  pagination: PaginationMetadata;
};

export type CreateOperatorUserPayload = {
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  roleName?: string | null;
  sendOnboardingEmail?: boolean;
};

export type PatchOperatorUserPayload = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  isActive?: boolean;
  roles?: string[];
};
