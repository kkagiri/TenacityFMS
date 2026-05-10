/**
 * File: VehicleReportsPage.js
 * Purpose: Replace placeholder vehicle report tiles with real report entry points that map to the current reports module and existing vehicle exports.
 * Dependencies: react, react-router-dom, usePermissions, report source registry, reports navigation helper
 * Last Modified: 2026-03-10
 *
 * Key Functions:
 * - VehicleReportsPage: Vehicle reporting landing page with live report sources, existing exports, and identified feature gaps
 */
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../../hooks/usePermissions';
import { getAllReportSources } from '../../reports/sources';
import { reportsRoutes } from '../../reports/utils/navigationHelper';
import './VehicleReportsPage.scss';

const LEGACY_ROUTE_BY_SOURCE = {
  'vehicle-consumption': reportsRoutes.vehicleConsumption,
  'consumption-by-refills': reportsRoutes.consumptionRefills,
};

const CORE_VEHICLE_REPORT_IDS = ['vehicle-consumption', 'route-analysis'];

const OPERATIONAL_EXPORTS = [
  {
    id: 'maintenance-export',
    title: 'Maintenance Alerts Export',
    description:
      'The maintenance workspace already supports direct grid export for alert reviews and maintenance follow-up.',
    icon: 'fa-light fa-wrench',
    badge: 'Available now',
    badgeTone: 'success',
    route: '/vehicles/maintenance',
    actionLabel: 'Open Maintenance',
    helperText: 'Uses the existing export tools inside the maintenance grid.',
  },
  {
    id: 'transfer-pdf',
    title: 'Vehicle Transfer Checkup Reports',
    description:
      'Transfer history already supports PDF report downloads and list export for completed transfer checkup records.',
    icon: 'fa-light fa-truck-arrow-right',
    badge: 'Available now',
    badgeTone: 'success',
    route: '/vehicles/transfers',
    actionLabel: 'Open Transfers',
    helperText: 'Includes PDF download for completed transfer reports.',
  },
];

const MISSING_REPORTS = [
  {
    id: 'fleet-performance-gap',
    title: 'Fleet Performance',
    description:
      'The old tile existed only as a placeholder. There is no registered vehicle KPI source in the current reports engine.',
    missingReason: 'Needs a backend aggregation endpoint and a report source definition.',
    fallbackRoute: '/vehicles/dashboard',
    fallbackLabel: 'Open Dashboard',
  },
  {
    id: 'cost-analysis-gap',
    title: 'Cost Analysis',
    description:
      'Fuel, maintenance, and transfer costs are not yet blended into a single fleet cost report.',
    missingReason: 'Needs a combined financial dataset and report source.',
    fallbackRoute: '/vehicles/maintenance',
    fallbackLabel: 'Review Maintenance',
  },
  {
    id: 'driver-performance-gap',
    title: 'Driver Performance',
    description:
      'No current source calculates driver scorecards, efficiency ranking, or driver-behavior KPIs.',
    missingReason: 'Needs driver-linked telemetry and report templates.',
    fallbackRoute: '/vehicles/fleet',
    fallbackLabel: 'Open Fleet',
  },
];

const toneClassMap = {
  success: 'vehicle-reports-page__badge--success',
  info: 'vehicle-reports-page__badge--info',
  warning: 'vehicle-reports-page__badge--warning',
};

const VehicleReportsPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canManageReportSchedules = hasPermission('_Manage_ReportSchedules');

  const availableVehicleReports = useMemo(() => {
    return getAllReportSources()
      .filter((source) => (
        Array.isArray(source.parameters)
        && source.parameters.some((parameter) => parameter.key === 'vehicleId')
      ))
      .filter((source) => !source.permission || hasPermission(source.permission))
      .map((source) => ({
        id: source.id,
        title: source.name,
        description: source.description,
        icon: source.icon || 'fa-light fa-file-chart-column',
        category: source.category,
        isCoreVehicleReport: CORE_VEHICLE_REPORT_IDS.includes(source.id),
        formats: source.supportedFormats || [],
        openRoute: reportsRoutes.engineSource(source.id),
        scheduleRoute: canManageReportSchedules
          ? `${reportsRoutes.scheduling}?source=${encodeURIComponent(source.id)}`
          : null,
        legacyRoute: LEGACY_ROUTE_BY_SOURCE[source.id] || null,
      }))
      .sort((left, right) => {
        if (left.isCoreVehicleReport && !right.isCoreVehicleReport) {
          return -1;
        }

        if (!left.isCoreVehicleReport && right.isCoreVehicleReport) {
          return 1;
        }

        return left.title.localeCompare(right.title);
      });
  }, [canManageReportSchedules, hasPermission]);

  const summary = {
    available: availableVehicleReports.length,
    exports: OPERATIONAL_EXPORTS.length,
    missing: MISSING_REPORTS.length,
  };

  return (
    <div className="vehicle-reports-page tw-flex tw-flex-col tw-gap-6">
      <section className="vehicle-reports-page__hero tw-rounded-xl tw-border tw-bg-white tw-p-6">
        <div className="tw-flex tw-flex-col tw-gap-4 lg:tw-flex-row lg:tw-items-start lg:tw-justify-between">
          <div className="tw-max-w-4xl">
            <div className="vehicle-reports-page__eyebrow">
              <i className="fa-light fa-chart-column"></i>
              <span>Vehicle reporting audit</span>
            </div>

            <h2 className="tw-mt-3 tw-text-2xl tw-font-semibold tw-text-slate-900">
              Vehicle reports now point to live features instead of placeholders
            </h2>

            <p className="tw-mt-3 tw-text-sm tw-leading-6 tw-text-slate-600">
              This page now blends the current report engine, the vehicle-specific report sources already wired in
              the reports module, and the export tools that already exist inside vehicle operations.
            </p>
          </div>

          <div className="vehicle-reports-page__summary-grid">
            <div className="vehicle-reports-page__summary-card">
              <span className="vehicle-reports-page__summary-value">{summary.available}</span>
              <span className="vehicle-reports-page__summary-label">Live vehicle report sources</span>
            </div>
            <div className="vehicle-reports-page__summary-card">
              <span className="vehicle-reports-page__summary-value">{summary.exports}</span>
              <span className="vehicle-reports-page__summary-label">Existing vehicle exports</span>
            </div>
            <div className="vehicle-reports-page__summary-card vehicle-reports-page__summary-card--warning">
              <span className="vehicle-reports-page__summary-value">{summary.missing}</span>
              <span className="vehicle-reports-page__summary-label">Still missing report integrations</span>
            </div>
          </div>
        </div>
      </section>

      <section className="tw-grid tw-gap-4 xl:tw-grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="vehicle-reports-page__panel tw-rounded-xl tw-border tw-bg-white tw-p-6">
          <div className="vehicle-reports-page__section-header">
            <div>
              <h3 className="tw-text-lg tw-font-semibold tw-text-slate-900">Live reports from the reports module</h3>
              <p className="tw-mt-1 tw-text-sm tw-text-slate-500">
                These report entries are already backed by report-engine sources and can be opened or scheduled now.
              </p>
            </div>
            <button
              type="button"
              className="m365-btn m365-btn--ghost"
              onClick={() => navigate(`${reportsRoutes.list}?view=gallery`)}
            >
              <i className="fa-light fa-grid-2"></i>
              Browse all reports
            </button>
          </div>

          <div className="tw-mt-5 tw-grid tw-gap-4 md:tw-grid-cols-2">
            {availableVehicleReports.map((report) => (
              <article key={report.id} className="vehicle-reports-page__card">
                <div className="vehicle-reports-page__card-top">
                  <div className="vehicle-reports-page__icon-wrap">
                    <i className={report.icon}></i>
                  </div>
                  <span className={`vehicle-reports-page__badge ${report.isCoreVehicleReport ? 'vehicle-reports-page__badge--info' : 'vehicle-reports-page__badge--success'}`}>
                    {report.isCoreVehicleReport ? 'Core vehicle report' : 'Available now'}
                  </span>
                </div>

                <div className="tw-mt-4">
                  <h4 className="tw-text-base tw-font-semibold tw-text-slate-900">{report.title}</h4>
                  <p className="tw-mt-2 tw-text-sm tw-leading-6 tw-text-slate-600">{report.description}</p>
                </div>

                <div className="tw-mt-4 tw-flex tw-flex-wrap tw-gap-2">
                  <span className="vehicle-reports-page__meta-pill">
                    <i className="fa-light fa-folder"></i>
                    {report.category}
                  </span>
                  {report.formats.map((format) => (
                    <span key={`${report.id}-${format}`} className="vehicle-reports-page__meta-pill vehicle-reports-page__meta-pill--format">
                      {format.toUpperCase()}
                    </span>
                  ))}
                </div>

                <div className="tw-mt-5 tw-flex tw-flex-wrap tw-gap-2">
                  <button
                    type="button"
                    className="m365-btn m365-btn--primary"
                    onClick={() => navigate(report.openRoute)}
                  >
                    <i className="fa-light fa-play"></i>
                    Open report
                  </button>
                  <button
                    type="button"
                    className="m365-btn m365-btn--ghost"
                    onClick={() => navigate(report.scheduleRoute)}
                  >
                    <i className="fa-light fa-calendar-plus"></i>
                    Schedule
                  </button>
                  {report.legacyRoute && (
                    <button
                      type="button"
                      className="m365-btn m365-btn--text"
                      onClick={() => navigate(report.legacyRoute)}
                    >
                      <i className="fa-light fa-arrow-up-right-from-square"></i>
                      Legacy view
                    </button>
                  )}
                </div>
              </article>
            ))}

            {availableVehicleReports.length === 0 && (
              <div className="vehicle-reports-page__empty-state tw-col-span-full">
                <i className="fa-light fa-lock-keyhole"></i>
                <h4 className="tw-text-base tw-font-semibold tw-text-slate-900">No vehicle report sources are visible</h4>
                <p className="tw-text-sm tw-text-slate-500">
                  Either the related reporting permissions are missing or no vehicle-linked sources are currently registered.
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="vehicle-reports-page__stack tw-flex tw-flex-col tw-gap-4">
          <section className="vehicle-reports-page__panel tw-rounded-xl tw-border tw-bg-white tw-p-6">
            <h3 className="tw-text-lg tw-font-semibold tw-text-slate-900">Report orchestration</h3>
            <p className="tw-mt-1 tw-text-sm tw-text-slate-500">
              The report center already provides discovery, scheduling, and monitoring for the live report sources.
            </p>

            <div className="tw-mt-5 tw-flex tw-flex-col tw-gap-3">
              <button type="button" className="m365-btn m365-btn--ghost vehicle-reports-page__wide-btn" onClick={() => navigate(reportsRoutes.list)}>
                <i className="fa-light fa-list"></i>
                All report sources
              </button>
              {canManageReportSchedules && (
                <button type="button" className="m365-btn m365-btn--ghost vehicle-reports-page__wide-btn" onClick={() => navigate(reportsRoutes.scheduling)}>
                  <i className="fa-light fa-calendar-clock"></i>
                  Scheduling
                </button>
              )}
              <button type="button" className="m365-btn m365-btn--ghost vehicle-reports-page__wide-btn" onClick={() => navigate(reportsRoutes.monitoring)}>
                <i className="fa-light fa-waveform-lines"></i>
                Monitoring
              </button>
            </div>
          </section>

          <section className="vehicle-reports-page__panel tw-rounded-xl tw-border tw-bg-white tw-p-6">
            <h3 className="tw-text-lg tw-font-semibold tw-text-slate-900">Already available in vehicle operations</h3>
            <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-3">
              {OPERATIONAL_EXPORTS.map((item) => (
                <article key={item.id} className="vehicle-reports-page__compact-card">
                  <div className="tw-flex tw-items-start tw-justify-between tw-gap-3">
                    <div className="tw-flex tw-gap-3">
                      <span className="vehicle-reports-page__compact-icon">
                        <i className={item.icon}></i>
                      </span>
                      <div>
                        <h4 className="tw-text-sm tw-font-semibold tw-text-slate-900">{item.title}</h4>
                        <p className="tw-mt-1 tw-text-sm tw-leading-6 tw-text-slate-600">{item.description}</p>
                      </div>
                    </div>
                    <span className={`vehicle-reports-page__badge ${toneClassMap[item.badgeTone]}`}>
                      {item.badge}
                    </span>
                  </div>

                  <div className="tw-mt-3 tw-flex tw-items-center tw-justify-between tw-gap-3">
                    <span className="tw-text-xs tw-text-slate-500">{item.helperText}</span>
                    <button type="button" className="m365-btn m365-btn--text" onClick={() => navigate(item.route)}>
                      <i className="fa-light fa-arrow-right"></i>
                      {item.actionLabel}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="vehicle-reports-page__panel tw-rounded-xl tw-border tw-bg-white tw-p-6">
        <div className="vehicle-reports-page__section-header">
          <div>
            <h3 className="tw-text-lg tw-font-semibold tw-text-slate-900">Identified report gaps from the old placeholder screen</h3>
            <p className="tw-mt-1 tw-text-sm tw-text-slate-500">
              These are the report concepts that were displayed before but are still not connected to real data or templates.
            </p>
          </div>
        </div>

        <div className="tw-mt-5 tw-grid tw-gap-4 md:tw-grid-cols-2 xl:tw-grid-cols-4">
          {MISSING_REPORTS.map((item) => (
            <article key={item.id} className="vehicle-reports-page__gap-card">
              <span className="vehicle-reports-page__badge vehicle-reports-page__badge--warning">
                Missing integration
              </span>
              <h4 className="tw-mt-4 tw-text-base tw-font-semibold tw-text-slate-900">{item.title}</h4>
              <p className="tw-mt-2 tw-text-sm tw-leading-6 tw-text-slate-600">{item.description}</p>
              <p className="tw-mt-3 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-amber-700">
                {item.missingReason}
              </p>

              <button
                type="button"
                className="m365-btn m365-btn--text tw-mt-4"
                onClick={() => navigate(item.fallbackRoute)}
              >
                <i className="fa-light fa-arrow-up-right-from-square"></i>
                {item.fallbackLabel}
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default VehicleReportsPage;
