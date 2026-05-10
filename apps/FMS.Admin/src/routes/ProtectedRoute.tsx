/**
 * File:          ProtectedRoute.tsx
 * Purpose:       Guards FMS.Admin routes to platform-operator JWTs only.
 * Dependencies:  react-router-dom, Redux auth state
 * Last Modified: 2026-05-10
 *
 * Key Functions:
 * - ProtectedRoute(): Redirects unauthenticated or non-operator users.
 */

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "../store/hooks";

export default function ProtectedRoute() {
  const location = useLocation();
  const { token, claims } = useAppSelector((state) => state.auth);
  const isOperator = Boolean(
    token && claims.tenantKind === "system" && claims.isPlatformOperator,
  );

  if (!isOperator) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
