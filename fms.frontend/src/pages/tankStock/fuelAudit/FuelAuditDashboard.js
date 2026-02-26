import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from 'devextreme-react/button';
import {
  fetchFuelAudits,
  selectAudits,
  selectLoading
} from '../../../redux/slices/fuelAuditSlice';
import { usePermissions } from '../../../hooks/usePermissions';

/**
 * Fuel Audit Dashboard
 * Overview of fuel audit status, recent audits, and key metrics
 */
const FuelAuditDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const audits = useSelector(selectAudits);
  const loading = useSelector(selectLoading);
  const { hasPermission } = usePermissions();

  // Local state to track if initial load is complete (prevents DOM conflicts during first render)
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if user has fuel audit permission
  const isAdmin = hasPermission('_Create_FuelAudit');

  useEffect(() => {
    dispatch(fetchFuelAudits({ pageSize: 10 })).finally(() => {
      // Mark as initialized after fetch completes to allow proper re-render
      setIsInitialized(true);
    });
  }, [dispatch]);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (!audits || audits.length === 0) {
      return {
        total: 0,
        draft: 0,
        calculated: 0,
        finalized: 0,
        withFlags: 0,
        avgVariance: 0
      };
    }

    return {
      total: audits.length,
      draft: audits.filter(a => a.status === 'Draft').length,
      calculated: audits.filter(a => a.status === 'Calculated').length,
      finalized: audits.filter(a => a.status === 'Finalized').length,
      withFlags: audits.filter(a => a.unresolvedFlags > 0).length,
      avgVariance: audits.reduce((sum, a) => sum + (a.variancePercentage || 0), 0) / audits.length
    };
  }, [audits]);

  // Get recent audits
  const recentAudits = useMemo(() => {
    return audits.slice(0, 5);
  }, [audits]);

  const getStatusBadge = (status) => {
    const statusMap = {
      Draft: { className: 'draft', icon: 'fa-file-pen' },
      Calculated: { className: 'calculated', icon: 'fa-calculator' },
      Finalized: { className: 'finalized', icon: 'fa-check-circle' },
      Cancelled: { className: 'cancelled', icon: 'fa-times-circle' }
    };
    const config = statusMap[status] || statusMap.Draft;
    return (
      <span className={`status-badge ${config.className}`}>
        <i className={`fa-light ${config.icon}`}></i>
        {status}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Show loading indicator until initial fetch completes
  // Use plain div spinner instead of <i> to avoid font-awesome/DevExtreme conflicts
  if (!isInitialized) {
    return (
      <div className="tw-p-6 tw-flex tw-items-center tw-justify-center tw-h-64">
        <div className="tw-text-center">
          <div className="tw-w-10 tw-h-10 tw-border-4 tw-border-blue-600 tw-border-t-transparent tw-rounded-full tw-animate-spin tw-mx-auto tw-mb-4"></div>
          <p className="tw-text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-p-6">
      {/* Stats Grid */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6 tw-mb-8">
        {/* Total Audits */}
        <div className="audit-stat-card">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total Audits</div>
            </div>
            <div className="stat-icon tw-bg-blue-100 tw-text-blue-600">
              <i className="fa-light fa-file-invoice"></i>
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="audit-stat-card">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <div className="stat-value">{stats.draft + stats.calculated}</div>
              <div className="stat-label">In Progress</div>
              <div className="stat-trend">
                <span className="tw-text-gray-500">{stats.draft} draft, {stats.calculated} calculated</span>
              </div>
            </div>
            <div className="stat-icon tw-bg-yellow-100 tw-text-yellow-600">
              <i className="fa-light fa-hourglass-half"></i>
            </div>
          </div>
        </div>

        {/* Finalized */}
        <div className="audit-stat-card">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <div className="stat-value">{stats.finalized}</div>
              <div className="stat-label">Finalized</div>
            </div>
            <div className="stat-icon tw-bg-green-100 tw-text-green-600">
              <i className="fa-light fa-check-double"></i>
            </div>
          </div>
        </div>

        {/* With Flags */}
        <div className="audit-stat-card">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <div className="stat-value">{stats.withFlags}</div>
              <div className="stat-label">Require Attention</div>
              {stats.avgVariance > 0 && (
                <div className={`stat-trend ${stats.avgVariance > 2 ? 'negative' : 'positive'}`}>
                  <i className={`fa-light ${stats.avgVariance > 2 ? 'fa-arrow-up' : 'fa-arrow-down'}`}></i>
                  {stats.avgVariance.toFixed(1)}% avg variance
                </div>
              )}
            </div>
            <div className="stat-icon tw-bg-red-100 tw-text-red-600">
              <i className="fa-light fa-flag"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-6 tw-mb-8">
        {isAdmin && (
          <Button
            type="default"
            stylingMode="outlined"
            onClick={() => navigate('/tankstock/fuel-audit/create')}
            className="quick-action-btn"
          >
            <div className="tw-flex tw-flex-col tw-items-start tw-p-4">
              <i className="fa-light fa-plus-circle tw-text-3xl tw-mb-3"></i>
              <h3 className="tw-text-lg tw-font-semibold tw-mb-1">Create New Audit</h3>
              <p className="tw-text-sm tw-opacity-70">Start a new fuel reconciliation audit</p>
            </div>
          </Button>
        )}

        <Button
          type="default"
          stylingMode="outlined"
          onClick={() => navigate('/tankstock/fuel-audit/gps-monitor')}
          className="quick-action-btn"
        >
          <div className="tw-flex tw-flex-col tw-items-start tw-p-4">
            <i className="fa-light fa-satellite tw-text-3xl tw-mb-3"></i>
            <h3 className="tw-text-lg tw-font-semibold tw-mb-1">GPS Fleet Monitor</h3>
            <p className="tw-text-sm tw-opacity-70">Real-time vehicle fuel positions</p>
          </div>
        </Button>

        <Button
          type="default"
          stylingMode="outlined"
          onClick={() => navigate('/tankstock/fuel-audit/list')}
          className="quick-action-btn"
        >
          <div className="tw-flex tw-flex-col tw-items-start tw-p-4">
            <i className="fa-light fa-list-check tw-text-3xl tw-mb-3"></i>
            <h3 className="tw-text-lg tw-font-semibold tw-mb-1">View All Audits</h3>
            <p className="tw-text-sm tw-opacity-70">Browse and manage all audits</p>
          </div>
        </Button>
      </div>

      {/* Recent Audits */}
      <div className="audit-list-container">
        <div className="audit-list-header">
          <h2 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-clock tw-text-gray-400"></i>
            Recent Audits
          </h2>
          <Button
            text="View All"
            type="default"
            stylingMode="outlined"
            icon="fa-light fa-arrow-right"
            rtlEnabled={true}
            onClick={() => navigate('/tankstock/fuel-audit/list')}
          />
        </div>

        {loading.audits ? (
          <div className="tw-p-12 tw-text-center">
            <i className="fa-light fa-spinner-third fa-spin tw-text-3xl tw-text-blue-600 tw-mb-4"></i>
            <p className="tw-text-gray-500">Loading audits...</p>
          </div>
        ) : recentAudits.length === 0 ? (
          <div className="tw-p-12 tw-text-center">
            <i className="fa-light fa-file-invoice tw-text-4xl tw-text-gray-300 tw-mb-4"></i>
            <h3 className="tw-text-lg tw-font-medium tw-text-gray-600 tw-mb-2">No Audits Yet</h3>
            <p className="tw-text-gray-500 tw-mb-4">Create your first fuel audit to get started</p>
            {isAdmin && (
              <Button
                text="Create Audit"
                type="default"
                stylingMode="outlined"
                icon="fa-light fa-plus"
                onClick={() => navigate('/tankstock/fuel-audit/create')}
              />
            )}
          </div>
        ) : (
          <div className="tw-divide-y tw-divide-gray-100">
            {recentAudits.map((audit) => (
              <div
                key={audit.id}
                onClick={() => navigate(`/tankstock/fuel-audit/detail/${audit.id}`)}
                className="tw-px-6 tw-py-4 hover:tw-bg-gray-50 tw-cursor-pointer tw-flex tw-items-center tw-justify-between"
              >
                <div className="tw-flex tw-items-center tw-gap-4">
                  <div className="tw-w-10 tw-h-10 tw-rounded-lg tw-bg-blue-100 tw-flex tw-items-center tw-justify-center">
                    <i className="fa-light fa-file-invoice tw-text-blue-600"></i>
                  </div>
                  <div>
                    <div className="tw-font-medium tw-text-gray-800">{audit.auditNumber}</div>
                    <div className="tw-text-sm tw-text-gray-500">
                      {formatDate(audit.auditPeriodStart)} - {formatDate(audit.auditPeriodEnd)}
                    </div>
                  </div>
                </div>

                <div className="tw-flex tw-items-center tw-gap-4">
                  {audit.variancePercentage !== null && (
                    <div className={`variance-indicator ${Math.abs(audit.variancePercentage) < 1 ? 'low' :
                        Math.abs(audit.variancePercentage) < 3 ? 'medium' :
                          Math.abs(audit.variancePercentage) < 5 ? 'high' : 'critical'
                      }`}>
                      <i className="fa-light fa-chart-mixed"></i>
                      {audit.variancePercentage?.toFixed(2)}%
                    </div>
                  )}
                  {getStatusBadge(audit.status)}
                  <i className="fa-light fa-chevron-right tw-text-gray-400"></i>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6 tw-mt-8">
        {/* How It Works */}
        <div className="tw-bg-white tw-rounded-xl tw-shadow-sm tw-border tw-border-gray-100 tw-p-6">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-circle-question tw-text-blue-600"></i>
            How Fuel Audit Works
          </h3>
          <div className="tw-space-y-4">
            <div className="tw-flex tw-gap-3">
              <div className="tw-w-8 tw-h-8 tw-rounded-full tw-bg-blue-100 tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                <span className="tw-text-blue-600 tw-font-semibold tw-text-sm">1</span>
              </div>
              <div>
                <div className="tw-font-medium tw-text-gray-800">Create Audit</div>
                <div className="tw-text-sm tw-text-gray-500">Select period and tanks for reconciliation</div>
              </div>
            </div>
            <div className="tw-flex tw-gap-3">
              <div className="tw-w-8 tw-h-8 tw-rounded-full tw-bg-blue-100 tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                <span className="tw-text-blue-600 tw-font-semibold tw-text-sm">2</span>
              </div>
              <div>
                <div className="tw-font-medium tw-text-gray-800">Auto-Populate Data</div>
                <div className="tw-text-sm tw-text-gray-500">Tank readings from TankVolumeHistory + GPS data</div>
              </div>
            </div>
            <div className="tw-flex tw-gap-3">
              <div className="tw-w-8 tw-h-8 tw-rounded-full tw-bg-blue-100 tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                <span className="tw-text-blue-600 tw-font-semibold tw-text-sm">3</span>
              </div>
              <div>
                <div className="tw-font-medium tw-text-gray-800">Calculate Variances</div>
                <div className="tw-text-sm tw-text-gray-500">System calculates expected vs actual fuel</div>
              </div>
            </div>
            <div className="tw-flex tw-gap-3">
              <div className="tw-w-8 tw-h-8 tw-rounded-full tw-bg-green-100 tw-flex tw-items-center tw-justify-center tw-flex-shrink-0">
                <span className="tw-text-green-600 tw-font-semibold tw-text-sm">4</span>
              </div>
              <div>
                <div className="tw-font-medium tw-text-gray-800">Review & Finalize</div>
                <div className="tw-text-sm tw-text-gray-500">Resolve flags and finalize the audit</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="tw-bg-white tw-rounded-xl tw-shadow-sm tw-border tw-border-gray-100 tw-p-6">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-chart-line tw-text-green-600"></i>
            Audit Performance
          </h3>
          <div className="tw-space-y-4">
            <div className="tw-flex tw-items-center tw-justify-between">
              <span className="tw-text-gray-600">Average Variance</span>
              <span className={`tw-font-semibold ${stats.avgVariance > 2 ? 'tw-text-red-600' : 'tw-text-green-600'}`}>
                {stats.avgVariance.toFixed(2)}%
              </span>
            </div>
            <div className="tw-flex tw-items-center tw-justify-between">
              <span className="tw-text-gray-600">Completion Rate</span>
              <span className="tw-font-semibold tw-text-gray-800">
                {stats.total > 0 ? ((stats.finalized / stats.total) * 100).toFixed(0) : 0}%
              </span>
            </div>
            <div className="tw-flex tw-items-center tw-justify-between">
              <span className="tw-text-gray-600">Audits This Month</span>
              <span className="tw-font-semibold tw-text-gray-800">{stats.total}</span>
            </div>
            <div className="tw-flex tw-items-center tw-justify-between">
              <span className="tw-text-gray-600">Pending Flags</span>
              <span className={`tw-font-semibold ${stats.withFlags > 0 ? 'tw-text-orange-600' : 'tw-text-green-600'}`}>
                {stats.withFlags}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuelAuditDashboard;
