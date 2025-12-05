/**
 * Step7AuditReport.js
 * Step 7: Final Audit Report - Printable Summary & Complete
 *
 * This is a comprehensive printable audit report that includes:
 * - Header with audit details and company logo placeholder
 * - Executive summary with key metrics
 * - Tank reconciliation table
 * - Vehicle consumption table by category
 * - System variance analysis
 * - Flags and issues summary
 * - Signature/approval section
 * - Print and Finalize actions
 */

import React, { useMemo, useCallback, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from 'devextreme-react/button';
import { TextArea } from 'devextreme-react/text-area';
import { Popup } from 'devextreme-react/popup';
import notify from 'devextreme/ui/notify';

import {
  selectWizard,
  selectWizardDraftAudit,
  setWizardNotes,
  resetWizard
} from '../../../../../../redux/slices/fuelAuditSlice';
import { finalizeAuditAction } from '../../../../../../redux/slices/fuelAuditSlice';

import './Step7AuditReport.scss';

// Category configuration for display
const CATEGORY_CONFIG = {
  1: { name: 'GPS Fleet', icon: 'fa-satellite', color: 'tw-text-green-700', bgColor: 'tw-bg-green-50' },
  2: { name: 'Full Tank Policy', icon: 'fa-gas-pump', color: 'tw-text-yellow-700', bgColor: 'tw-bg-yellow-50' },
  3: { name: 'Equipment', icon: 'fa-gear', color: 'tw-text-orange-700', bgColor: 'tw-bg-orange-50' },
  4: { name: 'Cross-Site', icon: 'fa-arrow-right-arrow-left', color: 'tw-text-cyan-700', bgColor: 'tw-bg-cyan-50' },
  5: { name: 'External', icon: 'fa-user-plus', color: 'tw-text-pink-700', bgColor: 'tw-bg-pink-50' }
};

const Step7AuditReport = ({ onFinalize, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const reportRef = useRef(null);

  const wizard = useSelector(selectWizard);
  const draftAudit = useSelector(selectWizardDraftAudit);
  const sites = useSelector((state) => state.site?.sites || []);

  const [showFinalizePopup, setShowFinalizePopup] = useState(false);
  const [finalizationNotes, setFinalizationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get selected sites
  const selectedSites = useMemo(() => {
    const siteIds = Array.isArray(wizard.siteIds) ? wizard.siteIds : [];
    return sites.filter(s => siteIds.includes(s.id || s.siteId));
  }, [sites, wizard.siteIds]);

  // Get site names for display
  const siteNamesDisplay = useMemo(() => {
    if (selectedSites.length === 0) return 'N/A';
    return selectedSites.map(s => s.name || s.siteName).join(', ');
  }, [selectedSites]);

  // Get tank data
  const tankData = useMemo(() => {
    return wizard.tankPreview || [];
  }, [wizard.tankPreview]);

  // Get vehicle data grouped by category
  const vehicleData = useMemo(() => {
    const tankRefills = wizard.tankRefills || [];
    const selected = tankRefills.filter(v => wizard.selectedVehicleIds?.includes(v.vehicleId));

    const grouped = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    selected.forEach(v => {
      const cat = v.vehicleCategory || 3;
      if (grouped[cat]) grouped[cat].push(v);
    });

    return { all: selected, grouped };
  }, [wizard.tankRefills, wizard.selectedVehicleIds]);

  // Calculate reconciliation totals
  const reconciliation = useMemo(() => {
    // Tank totals
    const tankOpening = tankData.reduce((sum, t) => sum + (t.openingStock || 0), 0);
    const tankClosing = tankData.reduce((sum, t) => sum + (t.closingStock || 0), 0);
    const tankDeliveries = tankData.reduce((sum, t) => sum + (t.totalDeliveries || 0), 0);
    const tankDispensed = tankData.reduce((sum, t) => sum + (t.totalDispensed || 0), 0);
    const tankExpected = tankOpening + tankDeliveries - tankDispensed;
    const tankVariance = tankClosing - tankExpected;

    // Vehicle totals by category
    const catTotals = {};
    Object.keys(vehicleData.grouped).forEach(cat => {
      const vehicles = vehicleData.grouped[cat];
      catTotals[cat] = {
        count: vehicles.length,
        opening: vehicles.reduce((sum, v) => sum + (v.openingFuel || 0), 0),
        closing: vehicles.reduce((sum, v) => sum + (v.closingFuel || 0), 0),
        refueled: vehicles.reduce((sum, v) => sum + (v.totalFuelAmount || 0), 0),
        consumption: vehicles.reduce((sum, v) => sum + (v.consumption || v.gpsMeasuredConsumption || 0), 0),
        variance: vehicles.reduce((sum, v) => sum + (v.vehicleVariance || 0), 0),
        withFlags: vehicles.filter(v => v.hasVarianceFlag).length
      };
    });

    // System totals
    const vehicleOpening = Object.values(catTotals).reduce((sum, c) => sum + c.opening, 0);
    const vehicleClosing = Object.values(catTotals).reduce((sum, c) => sum + c.closing, 0);
    const totalRefueled = Object.values(catTotals).reduce((sum, c) => sum + c.refueled, 0);
    const totalConsumption = Object.values(catTotals).reduce((sum, c) => sum + c.consumption, 0);

    const systemOpening = tankOpening + vehicleOpening;
    const systemClosing = tankClosing + vehicleClosing;
    const expectedClosing = systemOpening + tankDeliveries - totalConsumption;
    const systemVariance = systemClosing - expectedClosing;
    const systemVariancePct = systemOpening > 0 ? (systemVariance / systemOpening) * 100 : 0;

    // Confidence calculation
    const totalVehicles = vehicleData.all.length;
    const vehiclesWithGPS = vehicleData.grouped[1].length + vehicleData.grouped[4].length;
    const confidenceScore = totalVehicles > 0 ? (vehiclesWithGPS / totalVehicles) * 100 : 0;
    const confidenceLevel = confidenceScore >= 70 ? 'HIGH' : confidenceScore >= 40 ? 'MEDIUM' : 'LOW';

    // Flags
    const totalFlags = vehicleData.all.filter(v => v.hasVarianceFlag).length;
    const hasSystemFlag = Math.abs(systemVariancePct) > 1.0;

    return {
      tank: { opening: tankOpening, closing: tankClosing, deliveries: tankDeliveries, dispensed: tankDispensed, expected: tankExpected, variance: tankVariance },
      vehicle: { opening: vehicleOpening, closing: vehicleClosing, refueled: totalRefueled, consumption: totalConsumption },
      byCategory: catTotals,
      system: { opening: systemOpening, closing: systemClosing, expected: expectedClosing, variance: systemVariance, variancePct: systemVariancePct },
      confidence: { score: confidenceScore, level: confidenceLevel },
      flags: { total: totalFlags, hasSystemFlag }
    };
  }, [tankData, vehicleData]);

  // Format helpers
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-GB', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const formatNumber = (num, decimals = 0) => {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  // Print handler
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Finalize/Complete handler
  const handleFinalize = useCallback(async () => {
    // Use the parent's onFinalize if provided
    if (onFinalize) {
      setShowFinalizePopup(false);
      await onFinalize();
      return;
    }

    // Fallback to direct finalization if no parent handler
    if (!draftAudit.auditId) {
      notify('No audit to finalize', 'error', 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await dispatch(finalizeAuditAction({
        auditId: draftAudit.auditId,
        notes: finalizationNotes || wizard.notes
      })).unwrap();

      if (result.isSuccess) {
        notify('Audit finalized successfully!', 'success', 3000);
        setShowFinalizePopup(false);
        dispatch(resetWizard());
        navigate('/tankstock/fuel-audit');
      } else {
        notify(result.message || 'Failed to finalize audit', 'error', 4000);
      }
    } catch (error) {
      console.error('Error finalizing audit:', error);
      notify('An error occurred while finalizing the audit', 'error', 4000);
    } finally {
      setIsSubmitting(false);
    }
  }, [dispatch, navigate, draftAudit.auditId, finalizationNotes, wizard.notes, onFinalize]);

  return (
    <div className="step7-audit-report tw-h-full tw-flex tw-flex-col">
      {/* Action Bar - Not printed */}
      <div className="tw-flex tw-items-center tw-justify-between tw-px-6 tw-py-3 tw-bg-gray-100 tw-border-b print:tw-hidden">
        <div className="tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-file-invoice tw-text-blue-600"></i>
          <span className="tw-font-semibold tw-text-gray-700">Audit Report Preview</span>
          {draftAudit.auditNumber && (
            <span className="tw-text-sm tw-text-gray-500">({draftAudit.auditNumber})</span>
          )}
        </div>
        <div className="tw-flex tw-items-center tw-gap-3">
          <Button
            text="Print Report"
            icon="fa-light fa-print"
            type="default"
            stylingMode="outlined"
            onClick={handlePrint}
          />
          <Button
            text="Complete Audit"
            icon="fa-light fa-check-circle"
            type="success"
            stylingMode="contained"
            onClick={() => setShowFinalizePopup(true)}
          />
        </div>
      </div>

      {/* Printable Report Content */}
      <div ref={reportRef} className="audit-report-content tw-flex-1 tw-overflow-auto tw-p-6 tw-bg-white">
        {/* Report Header */}
        <div className="report-header tw-border-b-2 tw-border-gray-800 tw-pb-4 tw-mb-6">
          <div className="tw-flex tw-justify-between tw-items-start">
            <div>
              <h1 className="tw-text-2xl tw-font-bold tw-text-gray-900">FUEL AUDIT REPORT</h1>
              <p className="tw-text-lg tw-text-gray-600 tw-mt-1">{wizard.auditType || 'Weekly'} Reconciliation</p>
            </div>
            <div className="tw-text-right">
              <p className="tw-text-lg tw-font-bold tw-text-blue-700">{draftAudit.auditNumber || 'DRAFT'}</p>
              <p className="tw-text-sm tw-text-gray-500">Generated: {formatDateTime(new Date())}</p>
            </div>
          </div>
        </div>

        {/* Audit Information */}
        <div className="report-section tw-mb-6">
          <h2 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-border-b tw-pb-2 tw-mb-3">
            <i className="fa-light fa-info-circle tw-mr-2"></i>Audit Information
          </h2>
          <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4 tw-text-sm">
            <div>
              <p className="tw-text-gray-500">Site(s)</p>
              <p className="tw-font-semibold tw-text-gray-800">{siteNamesDisplay}</p>
            </div>
            <div>
              <p className="tw-text-gray-500">Period Start</p>
              <p className="tw-font-semibold tw-text-gray-800">{formatDate(wizard.periodStart)}</p>
            </div>
            <div>
              <p className="tw-text-gray-500">Period End</p>
              <p className="tw-font-semibold tw-text-gray-800">{formatDate(wizard.periodEnd)}</p>
            </div>
            <div>
              <p className="tw-text-gray-500">Status</p>
              <p className="tw-font-semibold tw-text-yellow-600">
                <i className="fa-light fa-clock tw-mr-1"></i>Draft
              </p>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="report-section tw-mb-6">
          <h2 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-border-b tw-pb-2 tw-mb-3">
            <i className="fa-light fa-chart-pie tw-mr-2"></i>Executive Summary
          </h2>
          <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4">
            <div className="tw-bg-blue-50 tw-rounded-lg tw-p-4 tw-text-center">
              <p className="tw-text-xs tw-text-gray-500 tw-uppercase">Tanks</p>
              <p className="tw-text-2xl tw-font-bold tw-text-blue-700">{tankData.length}</p>
            </div>
            <div className="tw-bg-purple-50 tw-rounded-lg tw-p-4 tw-text-center">
              <p className="tw-text-xs tw-text-gray-500 tw-uppercase">Vehicles</p>
              <p className="tw-text-2xl tw-font-bold tw-text-purple-700">{vehicleData.all.length}</p>
            </div>
            <div className="tw-bg-green-50 tw-rounded-lg tw-p-4 tw-text-center">
              <p className="tw-text-xs tw-text-gray-500 tw-uppercase">Total Dispensed</p>
              <p className="tw-text-2xl tw-font-bold tw-text-green-700">{formatNumber(reconciliation.vehicle.refueled)} L</p>
            </div>
            <div className={`tw-rounded-lg tw-p-4 tw-text-center ${
              reconciliation.flags.hasSystemFlag ? 'tw-bg-red-50' : 'tw-bg-green-50'
            }`}>
              <p className="tw-text-xs tw-text-gray-500 tw-uppercase">System Variance</p>
              <p className={`tw-text-2xl tw-font-bold ${
                reconciliation.flags.hasSystemFlag ? 'tw-text-red-700' : 'tw-text-green-700'
              }`}>
                {reconciliation.system.variancePct >= 0 ? '+' : ''}{formatNumber(reconciliation.system.variancePct, 2)}%
              </p>
            </div>
          </div>
        </div>

        {/* Tank Reconciliation Table */}
        <div className="report-section tw-mb-6">
          <h2 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-border-b tw-pb-2 tw-mb-3">
            <i className="fa-light fa-database tw-mr-2"></i>Tank Reconciliation
          </h2>
          <table className="tw-w-full tw-text-sm tw-border tw-border-gray-300">
            <thead className="tw-bg-gray-100">
              <tr>
                <th className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-left">Tank</th>
                <th className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right">Opening (L)</th>
                <th className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right">Deliveries (L)</th>
                <th className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right">Dispensed (L)</th>
                <th className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right">Expected (L)</th>
                <th className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right">Closing (L)</th>
                <th className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right">Variance (L)</th>
              </tr>
            </thead>
            <tbody>
              {tankData.length > 0 ? tankData.map((tank, idx) => {
                const expected = (tank.openingStock || 0) + (tank.totalDeliveries || 0) - (tank.totalDispensed || 0);
                const variance = (tank.closingStock || 0) - expected;
                return (
                  <tr key={tank.tankId || idx} className={idx % 2 === 0 ? 'tw-bg-white' : 'tw-bg-gray-50'}>
                    <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-font-medium">{tank.tankName}</td>
                    <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right">{formatNumber(tank.openingStock)}</td>
                    <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right tw-text-green-600">+{formatNumber(tank.totalDeliveries)}</td>
                    <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right tw-text-red-600">-{formatNumber(tank.totalDispensed)}</td>
                    <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right">{formatNumber(expected)}</td>
                    <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right tw-font-semibold">{formatNumber(tank.closingStock)}</td>
                    <td className={`tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right tw-font-semibold ${
                      variance < 0 ? 'tw-text-red-600' : variance > 0 ? 'tw-text-green-600' : ''
                    }`}>
                      {variance >= 0 ? '+' : ''}{formatNumber(variance)}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="7" className="tw-border tw-border-gray-300 tw-px-3 tw-py-4 tw-text-center tw-text-gray-500">
                    No tank data available
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="tw-bg-gray-200 tw-font-semibold">
              <tr>
                <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2">TOTAL</td>
                <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right">{formatNumber(reconciliation.tank.opening)}</td>
                <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right tw-text-green-700">+{formatNumber(reconciliation.tank.deliveries)}</td>
                <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right tw-text-red-700">-{formatNumber(reconciliation.tank.dispensed)}</td>
                <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right">{formatNumber(reconciliation.tank.expected)}</td>
                <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right">{formatNumber(reconciliation.tank.closing)}</td>
                <td className={`tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right ${
                  reconciliation.tank.variance < 0 ? 'tw-text-red-700' : 'tw-text-green-700'
                }`}>
                  {reconciliation.tank.variance >= 0 ? '+' : ''}{formatNumber(reconciliation.tank.variance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Vehicle Summary by Category */}
        <div className="report-section tw-mb-6">
          <h2 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-border-b tw-pb-2 tw-mb-3">
            <i className="fa-light fa-truck tw-mr-2"></i>Vehicle Summary by Category
          </h2>
          <table className="tw-w-full tw-text-sm tw-border tw-border-gray-300">
            <thead className="tw-bg-gray-100">
              <tr>
                <th className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-left">Category</th>
                <th className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-center">Vehicles</th>
                <th className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right">Opening (L)</th>
                <th className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right">Refueled (L)</th>
                <th className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right">Consumption (L)</th>
                <th className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right">Closing (L)</th>
                <th className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-center">Flags</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((cat, idx) => {
                const catConfig = CATEGORY_CONFIG[cat];
                const catData = reconciliation.byCategory[cat];
                if (catData.count === 0) return null;
                return (
                  <tr key={cat} className={idx % 2 === 0 ? 'tw-bg-white' : 'tw-bg-gray-50'}>
                    <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2">
                      <span className={`tw-font-medium ${catConfig.color}`}>
                        <i className={`fa-light ${catConfig.icon} tw-mr-2`}></i>
                        {catConfig.name}
                      </span>
                    </td>
                    <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-center">{catData.count}</td>
                    <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right">{formatNumber(catData.opening)}</td>
                    <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right tw-text-green-600">+{formatNumber(catData.refueled)}</td>
                    <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right tw-text-red-600">-{formatNumber(catData.consumption)}</td>
                    <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right tw-font-semibold">{formatNumber(catData.closing)}</td>
                    <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-center">
                      {catData.withFlags > 0 ? (
                        <span className="tw-text-red-600 tw-font-semibold">
                          <i className="fa-light fa-flag tw-mr-1"></i>{catData.withFlags}
                        </span>
                      ) : (
                        <span className="tw-text-green-600"><i className="fa-light fa-check"></i></span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="tw-bg-gray-200 tw-font-semibold">
              <tr>
                <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2">TOTAL</td>
                <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-center">{vehicleData.all.length}</td>
                <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right">{formatNumber(reconciliation.vehicle.opening)}</td>
                <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right tw-text-green-700">+{formatNumber(reconciliation.vehicle.refueled)}</td>
                <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right tw-text-red-700">-{formatNumber(reconciliation.vehicle.consumption)}</td>
                <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-right">{formatNumber(reconciliation.vehicle.closing)}</td>
                <td className="tw-border tw-border-gray-300 tw-px-3 tw-py-2 tw-text-center">
                  {reconciliation.flags.total > 0 ? (
                    <span className="tw-text-red-700">{reconciliation.flags.total}</span>
                  ) : (
                    <span className="tw-text-green-700">0</span>
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* System Reconciliation Summary */}
        <div className="report-section tw-mb-6">
          <h2 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-border-b tw-pb-2 tw-mb-3">
            <i className="fa-light fa-scale-balanced tw-mr-2"></i>System Reconciliation
          </h2>
          <div className={`tw-p-4 tw-rounded-lg tw-border-2 ${
            reconciliation.flags.hasSystemFlag
              ? 'tw-bg-red-50 tw-border-red-300'
              : 'tw-bg-green-50 tw-border-green-300'
          }`}>
            <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4 tw-mb-4">
              <div>
                <p className="tw-text-xs tw-text-gray-500">System Opening</p>
                <p className="tw-text-xl tw-font-bold tw-text-gray-800">{formatNumber(reconciliation.system.opening)} L</p>
              </div>
              <div>
                <p className="tw-text-xs tw-text-gray-500">Expected Closing</p>
                <p className="tw-text-xl tw-font-bold tw-text-gray-800">{formatNumber(reconciliation.system.expected)} L</p>
              </div>
              <div>
                <p className="tw-text-xs tw-text-gray-500">Actual Closing</p>
                <p className="tw-text-xl tw-font-bold tw-text-gray-800">{formatNumber(reconciliation.system.closing)} L</p>
              </div>
              <div>
                <p className="tw-text-xs tw-text-gray-500">Variance</p>
                <p className={`tw-text-xl tw-font-bold ${
                  reconciliation.flags.hasSystemFlag ? 'tw-text-red-700' : 'tw-text-green-700'
                }`}>
                  {reconciliation.system.variance >= 0 ? '+' : ''}{formatNumber(reconciliation.system.variance)} L
                  ({reconciliation.system.variancePct >= 0 ? '+' : ''}{formatNumber(reconciliation.system.variancePct, 2)}%)
                </p>
              </div>
            </div>
            <div className="tw-flex tw-items-center tw-justify-between tw-pt-3 tw-border-t tw-border-gray-300">
              <div className="tw-flex tw-items-center tw-gap-2">
                <span className="tw-text-sm tw-text-gray-600">Data Confidence:</span>
                <span className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-semibold ${
                  reconciliation.confidence.level === 'HIGH' ? 'tw-bg-green-100 tw-text-green-700' :
                  reconciliation.confidence.level === 'MEDIUM' ? 'tw-bg-yellow-100 tw-text-yellow-700' :
                  'tw-bg-red-100 tw-text-red-700'
                }`}>
                  {reconciliation.confidence.level} ({formatNumber(reconciliation.confidence.score, 0)}%)
                </span>
              </div>
              {reconciliation.flags.hasSystemFlag && (
                <span className="tw-text-sm tw-text-red-700 tw-font-medium">
                  <i className="fa-light fa-exclamation-triangle tw-mr-1"></i>
                  Variance exceeds 1% threshold - investigation recommended
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="report-section tw-mb-6">
          <h2 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-border-b tw-pb-2 tw-mb-3">
            <i className="fa-light fa-sticky-note tw-mr-2"></i>Audit Notes
          </h2>
          <div className="print:tw-hidden">
            <TextArea
              value={wizard.notes || ''}
              onValueChanged={(e) => dispatch(setWizardNotes(e.value))}
              placeholder="Add any notes, observations, or comments for this audit report..."
              height={100}
            />
          </div>
          <div className="tw-hidden print:tw-block tw-p-3 tw-bg-gray-50 tw-rounded tw-min-h-[80px]">
            {wizard.notes || <span className="tw-text-gray-400 tw-italic">No notes provided</span>}
          </div>
        </div>

        {/* Signature Section - Print Only */}
        <div className="report-section tw-mt-8 tw-pt-6 tw-border-t-2 tw-border-gray-300">
          <div className="tw-grid tw-grid-cols-2 tw-gap-8">
            <div>
              <p className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-12">Prepared By:</p>
              <div className="tw-border-b tw-border-gray-400 tw-mb-2"></div>
              <p className="tw-text-xs tw-text-gray-500">Name & Signature</p>
              <p className="tw-text-xs tw-text-gray-500 tw-mt-1">Date: ________________</p>
            </div>
            <div>
              <p className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-12">Approved By:</p>
              <div className="tw-border-b tw-border-gray-400 tw-mb-2"></div>
              <p className="tw-text-xs tw-text-gray-500">Name & Signature</p>
              <p className="tw-text-xs tw-text-gray-500 tw-mt-1">Date: ________________</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="report-footer tw-mt-8 tw-pt-4 tw-border-t tw-text-center tw-text-xs tw-text-gray-400">
          <p>This is a system-generated report from FMS Fuel Audit System</p>
          <p>Report ID: {draftAudit.auditNumber || 'DRAFT'} | Generated: {formatDateTime(new Date())}</p>
        </div>
      </div>

      {/* Finalize Popup */}
      <Popup
        visible={showFinalizePopup}
        onHiding={() => setShowFinalizePopup(false)}
        title="Complete Audit"
        width={450}
        height="auto"
        showCloseButton={true}
        dragEnabled={false}
      >
        <div className="tw-p-4">
          <div className="tw-mb-4">
            <div className="tw-flex tw-items-center tw-gap-2 tw-text-green-700 tw-mb-2">
              <i className="fa-light fa-check-circle tw-text-xl"></i>
              <span className="tw-font-semibold">Ready to Complete</span>
            </div>
            <p className="tw-text-sm tw-text-gray-600">
              This will finalize audit <strong>{draftAudit.auditNumber}</strong> and lock it for further editing.
              The report will be marked as complete.
            </p>
          </div>

          <div className="tw-mb-4">
            <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-block tw-mb-2">
              Finalization Notes (Optional)
            </label>
            <TextArea
              value={finalizationNotes}
              onValueChanged={(e) => setFinalizationNotes(e.value)}
              placeholder="Add any final notes or approval comments..."
              height={80}
            />
          </div>

          {reconciliation.flags.hasSystemFlag && (
            <div className="tw-mb-4 tw-p-3 tw-bg-yellow-50 tw-border tw-border-yellow-300 tw-rounded">
              <div className="tw-flex tw-items-start tw-gap-2">
                <i className="fa-light fa-exclamation-triangle tw-text-yellow-600 tw-mt-0.5"></i>
                <div className="tw-text-sm">
                  <p className="tw-font-medium tw-text-yellow-800">Variance Warning</p>
                  <p className="tw-text-yellow-700">
                    System variance ({formatNumber(reconciliation.system.variancePct, 2)}%) exceeds threshold.
                    Are you sure you want to complete this audit?
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="tw-flex tw-justify-end tw-gap-3 tw-pt-3 tw-border-t">
            <Button
              text="Cancel"
              stylingMode="outlined"
              onClick={() => setShowFinalizePopup(false)}
            />
            <Button
              text={isSubmitting ? "Completing..." : "Complete Audit"}
              type="success"
              stylingMode="contained"
              icon="fa-light fa-check"
              disabled={isSubmitting}
              onClick={handleFinalize}
            />
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default Step7AuditReport;
