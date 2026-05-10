/**
 * File:          TenantDetailPage.tsx
 * Purpose:       Operator tenant detail page with hierarchy and counts.
 * Dependencies:  apiClient, react-router-dom, tenant types
 * Last Modified: 2026-05-10
 *
 * Key Functions:
 * - TenantDetailPage(): Loads one tenant detail from operator APIs.
 * - HierarchyNode(): Renders descendant tenant hierarchy.
 */

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiClient, unwrapResponse } from "../api/apiClient";
import type {
  OperatorTenantDetail,
  OperatorTenantHierarchyNode,
} from "../types/tenant";

const formatTenantKind = (kind: string) =>
  kind.charAt(0).toUpperCase() + kind.slice(1);

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString();
};

function HierarchyNode({ node }: { node: OperatorTenantHierarchyNode }) {
  return (
    <li className="operator-hierarchy__item">
      <div className="operator-hierarchy__node">
        <i className="fa-light fa-building" />
        <span>{node.name}</span>
        <span className="operator-hierarchy__meta">
          {formatTenantKind(node.tenantKind)}
        </span>
        <span
          className={`operator-status operator-status--${node.isActive ? "active" : "inactive"}`}
        >
          {node.isActive ? "Active" : "Inactive"}
        </span>
      </div>
      {node.children.length > 0 && (
        <ul className="operator-hierarchy__children">
          {node.children.map((child) => (
            <HierarchyNode key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function TenantDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [tenant, setTenant] = useState<OperatorTenantDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;

    let isMounted = true;
    const loadTenant = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get(
          `/v1/operator/tenants/${tenantId}`,
        );
        const payload = unwrapResponse<OperatorTenantDetail>(response.data);
        if (isMounted) setTenant(payload);
      } catch (caught) {
        const message =
          caught && typeof caught === "object" && "response" in caught
            ? (
                caught as {
                  response?: { data?: { message?: string; Message?: string } };
                }
              ).response?.data?.message ||
              (caught as { response?: { data?: { Message?: string } } })
                .response?.data?.Message
            : null;
        if (isMounted) setError(message || "Unable to load tenant.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadTenant();

    return () => {
      isMounted = false;
    };
  }, [tenantId]);

  return (
    <div className="operator-page">
      <div className="m365-page-header">
        <div className="m365-page-header__left">
          <Link className="m365-btn m365-btn--ghost" to="/tenants">
            <i className="fa-light fa-chevron-left" />
          </Link>
          <i className="fa-light fa-building m365-page-header__icon" />
          <h2 className="m365-page-header__title">
            {tenant?.name || "Tenant detail"}
          </h2>
        </div>
      </div>

      {loading && (
        <div className="operator-table__empty">Loading tenant...</div>
      )}
      {error && (
        <div className="m365-info-banner m365-info-banner--error">
          <i className="fa-light fa-circle-info m365-info-banner__icon" />
          <span className="m365-info-banner__text">{error}</span>
        </div>
      )}

      {tenant && (
        <>
          <div className="operator-detail-grid">
            <div className="operator-detail-row">
              <span>Code</span>
              <strong>{tenant.code}</strong>
            </div>
            <div className="operator-detail-row">
              <span>Kind</span>
              <strong>{formatTenantKind(tenant.tenantKind)}</strong>
            </div>
            <div className="operator-detail-row">
              <span>Status</span>
              <strong>{tenant.isActive ? "Active" : "Inactive"}</strong>
            </div>
            <div className="operator-detail-row">
              <span>Parent</span>
              <strong>{tenant.parentTenantName || "None"}</strong>
            </div>
            <div className="operator-detail-row">
              <span>Created</span>
              <strong>{formatDate(tenant.createdAt)}</strong>
            </div>
            <div className="operator-detail-row">
              <span>Updated</span>
              <strong>{formatDate(tenant.updatedAt)}</strong>
            </div>
          </div>

          <div className="operator-summary-grid">
            <div className="operator-summary-tile">
              <i className="fa-light fa-users" />
              <div>
                <div className="operator-summary-tile__value">
                  {tenant.counts.users}
                </div>
                <div className="operator-summary-tile__label">Users</div>
              </div>
            </div>
            <div className="operator-summary-tile">
              <i className="fa-light fa-user-check" />
              <div>
                <div className="operator-summary-tile__value">
                  {tenant.counts.activeUsers}
                </div>
                <div className="operator-summary-tile__label">Active users</div>
              </div>
            </div>
            <div className="operator-summary-tile">
              <i className="fa-light fa-sitemap" />
              <div>
                <div className="operator-summary-tile__value">
                  {tenant.counts.descendantTenants}
                </div>
                <div className="operator-summary-tile__label">Descendants</div>
              </div>
            </div>
            <div className="operator-summary-tile">
              <i className="fa-light fa-location-dot" />
              <div>
                <div className="operator-summary-tile__value">
                  {tenant.counts.sites}
                </div>
                <div className="operator-summary-tile__label">Sites</div>
              </div>
            </div>
            <div className="operator-summary-tile">
              <i className="fa-light fa-car" />
              <div>
                <div className="operator-summary-tile__value">
                  {tenant.counts.vehicles}
                </div>
                <div className="operator-summary-tile__label">Vehicles</div>
              </div>
            </div>
          </div>

          <div className="operator-section">
            <div className="operator-section__header">
              <i className="fa-light fa-diagram-project" />
              <h3>Hierarchy</h3>
            </div>
            {tenant.hierarchy.length === 0 ? (
              <div className="operator-table__empty">No child tenants</div>
            ) : (
              <ul className="operator-hierarchy">
                {tenant.hierarchy.map((node) => (
                  <HierarchyNode key={node.id} node={node} />
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
