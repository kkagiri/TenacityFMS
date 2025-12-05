/**
 * CreateAuditWizard.js
 *
 * Main 7-Step Wizard for creating/editing fuel audits.
 *
 * Steps:
 *   1: Site & Period Selection
 *   2: Tank Selection
 *   3: Tank Data Preview
 *   4: Vehicle Selection (with real driver data)
 *   5: GPS Data Preview
 *   6: Fuel Reconciliation View
 *   7: Audit Report & Finalize
 *
 * Uses Redux state.fuelAudit.wizard which is 1-indexed (step: 1 = first step).
 *
 * URL Routing:
 *   - /tankstock/fuel-audit/create - New audit (starts at step 1)
 *   - /tankstock/fuel-audit/edit/:reportId - Edit existing audit
 *   - /tankstock/fuel-audit/edit/:reportId/step/:stepNumber - Edit at specific step
 */

import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import notify from 'devextreme/ui/notify';

// Redux actions
import {
  setWizardStep,
  resetWizard,
  createNewAudit,
  saveDraftAudit,
  loadDraftToWizard,
  selectWizard,
  selectLoading,
  selectWizardDraftAudit
} from '../../../../../redux/slices/fuelAuditSlice';
import { fetchFuelAuditById } from '../../../../../redux/slices/fuelAuditThunks';
import { fetchSiteList } from '../../../../../redux/actions/siteActions';

// Step components - imported from step folders
import Step1SitePeriod from './step1/Step1SitePeriod';
import Step2TankSelection from './step2/Step2TankSelection';
import Step3TankPreview from './step3/Step3TankPreview';
import Step4VehicleSelection from './step4/Step4VehicleSelection';
import Step5VehiclePreview from './step5/Step5VehiclePreview';
import { Step6Reconciliation } from './step6';
import { Step7AuditReport } from './step7';

// Common components
import { WizardProgress, TOTAL_STEPS } from './common';

// Styles
import '../CreateAuditWizard.scss';

const CreateAuditWizard = ({ onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { reportId, stepNumber } = useParams();

  // Redux state
  const wizard = useSelector(selectWizard);
  const loading = useSelector(selectLoading);
  const draftAudit = useSelector(selectWizardDraftAudit);

  // Get site names for display (from Redux store)
  const { sites } = useSelector((state) => state.site || { sites: [] });

  // Track step transitions to prevent DOM conflicts during async operations
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Track if we're in edit mode
  const isEditMode = !!reportId;

  // Track if draft data has been loaded
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  // Ref to track if component is mounted (prevent state updates after unmount)
  const isMountedRef = useRef(true);

  // Current step from wizard state (1-indexed)
  const currentStep = wizard.step;

  // Helper: Format date for display (short format)
  const formatDateShort = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Helper: Get selected site names
  const getSelectedSiteNames = () => {
    if (!wizard.siteIds || wizard.siteIds.length === 0 || !sites || sites.length === 0) return '';
    const selectedSites = sites.filter(s => wizard.siteIds.includes(s.id));
    if (selectedSites.length === 0) return '';
    if (selectedSites.length === 1) return selectedSites[0].name;
    if (selectedSites.length <= 2) return selectedSites.map(s => s.name).join(', ');
    return `${selectedSites[0].name} +${selectedSites.length - 1} more`;
  };

  // Build summary info for header
  const summaryInfo = useMemo(() => {
    const parts = [];

    // Sites
    const siteNames = getSelectedSiteNames();
    if (siteNames) {
      parts.push({ icon: 'fa-building', text: siteNames, key: 'sites' });
    }

    // Date range
    if (wizard.periodStart && wizard.periodEnd) {
      const dateRange = `${formatDateShort(wizard.periodStart)} - ${formatDateShort(wizard.periodEnd)}`;
      parts.push({ icon: 'fa-calendar', text: dateRange, key: 'dates' });
    }

    // Tank count (if selected)
    if (wizard.selectedTankIds && wizard.selectedTankIds.length > 0) {
      parts.push({ icon: 'fa-database', text: `${wizard.selectedTankIds.length} tank(s)`, key: 'tanks' });
    }

    // Vehicle count (if selected)
    if (wizard.selectedVehicleIds && wizard.selectedVehicleIds.length > 0) {
      parts.push({ icon: 'fa-truck', text: `${wizard.selectedVehicleIds.length} vehicle(s)`, key: 'vehicles' });
    }

    return parts;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizard.siteIds, wizard.periodStart, wizard.periodEnd, wizard.selectedTankIds, wizard.selectedVehicleIds, sites]);

  // Load sites on mount
  useEffect(() => {
    dispatch(fetchSiteList());
  }, [dispatch]);

  // Set mounted flag and cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load draft audit when in edit mode
  useEffect(() => {
    const loadDraftAudit = async () => {
      if (reportId && !isDraftLoaded) {
        console.log('[Wizard] Loading draft audit:', reportId);
        try {
          const result = await dispatch(fetchFuelAuditById({ auditId: reportId })).unwrap();
          if (result.isSuccess && result.data) {
            // Load the draft data into wizard state
            dispatch(loadDraftToWizard(result.data));
            setIsDraftLoaded(true);

            // If stepNumber is provided in URL, navigate to that step
            const targetStep = stepNumber ? parseInt(stepNumber, 10) : null;
            if (targetStep && targetStep >= 1 && targetStep <= TOTAL_STEPS) {
              dispatch(setWizardStep(targetStep));
            } else if (result.data.wizardStep) {
              // Resume from saved wizard step
              dispatch(setWizardStep(result.data.wizardStep));
            }

            console.log('[Wizard] Draft loaded successfully');
          } else {
            notify('Failed to load audit draft', 'error', 3000);
            navigate('/tankstock/fuel-audit');
          }
        } catch (error) {
          console.error('[Wizard] Error loading draft:', error);
          notify('Error loading audit draft', 'error', 3000);
          navigate('/tankstock/fuel-audit');
        }
      }
    };

    loadDraftAudit();
  }, [reportId, isDraftLoaded, stepNumber, dispatch, navigate]);

  // Sync URL with current step (for edit mode)
  useEffect(() => {
    if (!isEditMode || !isDraftLoaded || isTransitioning) return;

    // Build the expected URL based on current step
    const expectedPath = currentStep === 1
      ? `/tankstock/fuel-audit/edit/${reportId}`
      : `/tankstock/fuel-audit/edit/${reportId}/step/${currentStep}`;

    // Only update URL if it doesn't match (avoid infinite loops)
    if (location.pathname !== expectedPath) {
      navigate(expectedPath, { replace: true });
    }
  }, [currentStep, reportId, isEditMode, isDraftLoaded, isTransitioning, location.pathname, navigate]);

  // Reset wizard when switching from edit to create mode
  useEffect(() => {
    if (!reportId && isDraftLoaded) {
      // Switched from edit mode to create mode - reset
      dispatch(resetWizard());
      setIsDraftLoaded(false);
    }
  }, [reportId, isDraftLoaded, dispatch]);

  // Auto-save draft at each step - Returns a promise for proper async handling
  // Called AFTER step transition completes to avoid DOM conflicts with DevExtreme DataGrid
  const saveCurrentStepDraft = useCallback(async (step) => {
    // Don't save if component is unmounted
    if (!isMountedRef.current) {
      return Promise.resolve();
    }

    const siteIds = Array.isArray(wizard.siteIds) ? wizard.siteIds : [];

    // Don't save draft if no site selected yet (Step 1 incomplete)
    if (step === 1 && siteIds.length === 0) {
      return Promise.resolve();
    }

    // Prepare data based on current step
    const draftData = {
      auditId: draftAudit.auditId,
      wizardStep: step,
      siteIds: siteIds,
      periodStart: wizard.periodStart,
      periodEnd: wizard.periodEnd,
      auditType: wizard.auditType || 'Weekly',
      selectedTankIds: wizard.selectedTankIds || [],
      tankPreviewData: wizard.tankPreview?.map(tank => ({
        tankId: tank.tankId,
        tankName: tank.tankName,
        openingStock: tank.openingStock,
        closingStock: tank.closingStock,
        totalDeliveries: tank.totalDeliveries,
        totalDispensed: tank.totalDispensed,
        totalTransfersIn: tank.totalTransfersIn,
        totalTransfersOut: tank.totalTransfersOut,
        openingDataSource: tank.openingDataSource,
        closingDataSource: tank.closingDataSource,
        isEdited: tank.isEdited || false
      })) || [],
      selectedVehicleIds: wizard.selectedVehicleIds || [],
      includeGpsFleet: wizard.includeGpsFleet,
      includePickups: wizard.includePickups,
      // Enhanced vehicle GPS data mapping - includes all editable and GPS fields
      vehicleGpsData: wizard.tankRefills?.filter(v =>
        wizard.selectedVehicleIds?.includes(v.vehicleId)
      ).map(vehicle => ({
        vehicleId: vehicle.vehicleId,
        vehicleName: vehicle.vehicleNo || vehicle.vehicleName,
        vehicleCategory: vehicle.vehicleCategory,
        // Opening/closing fuel (editable)
        openingFuel: vehicle.openingFuel,
        closingFuel: vehicle.closingFuel,
        // Consumption data
        consumption: vehicle.consumption,
        gpsMeasuredConsumption: vehicle.gpsMeasuredConsumption,
        consumptionVariance: vehicle.consumptionVariance,
        vehicleVariance: vehicle.vehicleVariance,
        // Refill data
        totalFuelRefilled: vehicle.totalFuelAmount,
        refillCount: vehicle.refillCount,
        // Data source and quality
        dataSource: vehicle.dataSourcePrimary,
        dataQuality: vehicle.dataConfidence || vehicle.openingDataQuality,
        openingDataQuality: vehicle.openingDataQuality,
        closingDataQuality: vehicle.closingDataQuality,
        // GPS data metadata
        openingTimestamp: vehicle.openingTimestamp,
        closingTimestamp: vehicle.closingTimestamp,
        openingDaysFromRequested: vehicle.openingDaysFromRequested,
        closingDaysFromRequested: vehicle.closingDaysFromRequested,
        // Flags
        hasVarianceFlag: vehicle.hasVarianceFlag,
        varianceFlagMessage: vehicle.varianceFlagMessage,
        isEdited: vehicle.isEdited || false,
        gpsDataLoaded: vehicle.gpsDataLoaded || false
      })) || [],
      reconciliationData: wizard.reconciliationData,
      notes: wizard.notes
    };

    try {
      // Wait for the save to complete before returning
      const result = await dispatch(saveDraftAudit(draftData)).unwrap();
      console.log(`Draft saved at Step ${step}:`, result);
      return result;
    } catch (error) {
      console.error('Failed to save draft:', error);
      // Don't throw - allow navigation to continue
      return null;
    }
  }, [dispatch, wizard, draftAudit.auditId]);

  // Handle close/cancel
  const handleClose = useCallback(() => {
    dispatch(resetWizard());
    setIsDraftLoaded(false);
    if (onClose) {
      onClose();
    } else {
      navigate('/tankstock/fuel-audit');
    }
  }, [dispatch, onClose, navigate]);

  // Validate current step before moving forward
  const validateStep = useCallback((step) => {
    switch (step) {
      case 1:
        // Check for multi-site selection (siteIds array)
        const siteIds = Array.isArray(wizard.siteIds) ? wizard.siteIds : [];
        if (siteIds.length === 0) {
          notify('Please select at least one site', 'warning', 3000);
          return false;
        }
        if (!wizard.periodStart || !wizard.periodEnd) {
          notify('Please select audit period dates', 'warning', 3000);
          return false;
        }
        if (new Date(wizard.periodStart) > new Date(wizard.periodEnd)) {
          notify('Start date cannot be after end date', 'warning', 3000);
          return false;
        }
        return true;

      case 2:
        if (!wizard.selectedTankIds || wizard.selectedTankIds.length === 0) {
          notify('Please select at least one tank', 'warning', 3000);
          return false;
        }
        return true;

      case 3:
        // Tank preview is optional - can proceed without loading
        return true;

      case 4:
        if (!wizard.selectedVehicleIds || wizard.selectedVehicleIds.length === 0) {
          notify('Please select at least one vehicle', 'warning', 3000);
          return false;
        }
        return true;

      case 5:
        // GPS preview is optional - can proceed without loading
        return true;

      case 6:
        // Reconciliation view - optional, can proceed
        return true;

      case 7:
        // Review step - final validation before create
        return true;

      default:
        return true;
    }
  }, [wizard]);

  // Navigate to next step
  const handleNext = useCallback(() => {
    if (!validateStep(currentStep)) {
      return;
    }

    // Set transitioning state to show loading overlay and prevent rendering
    setIsTransitioning(true);

    const nextStep = currentStep + 1;

    // Change step after a brief delay for DevExtreme cleanup
    setTimeout(() => {
      if (currentStep < TOTAL_STEPS && isMountedRef.current) {
        dispatch(setWizardStep(nextStep));
      }
      // Clear transitioning state after step change completes
      setTimeout(() => {
        if (isMountedRef.current) {
          setIsTransitioning(false);

          // Save draft AFTER transition completes to persist wizard step progress
          // This avoids DOM conflicts with DevExtreme DataGrid during transition
          if (draftAudit.auditId) {
            saveCurrentStepDraft(nextStep);
          }
        }
      }, 150);
    }, 100);
  }, [currentStep, dispatch, validateStep, draftAudit.auditId, saveCurrentStepDraft]);

  // Navigate to previous step
  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setIsTransitioning(true);
      const prevStep = currentStep - 1;
      // Increased delay for backward navigation too
      setTimeout(() => {
        dispatch(setWizardStep(prevStep));
        setTimeout(() => {
          setIsTransitioning(false);

          // Save draft AFTER transition completes
          if (draftAudit.auditId) {
            saveCurrentStepDraft(prevStep);
          }
        }, 150);
      }, 100);
    }
  }, [currentStep, dispatch, draftAudit.auditId, saveCurrentStepDraft]);

  // Create the audit (finalize)
  const handleCreateAudit = useCallback(async () => {
    // Get siteIds array
    const siteIds = Array.isArray(wizard.siteIds) ? wizard.siteIds : [];

    // Final validation
    if (siteIds.length === 0 || !wizard.periodStart || !wizard.periodEnd) {
      notify('Missing required audit information', 'error', 3000);
      return;
    }

    if (!wizard.selectedTankIds?.length || !wizard.selectedVehicleIds?.length) {
      notify('Please select at least one tank and one vehicle', 'error', 3000);
      return;
    }

    try {
      const auditData = {
        siteIds: siteIds, // Array of site IDs for multi-site
        auditType: wizard.auditType || 'Weekly',
        periodStart: wizard.periodStart,
        periodEnd: wizard.periodEnd,
        tankIds: wizard.selectedTankIds,
        vehicleIds: wizard.selectedVehicleIds,
        includeGpsFleet: wizard.includeGpsFleet,
        includePickups: wizard.includePickups,
        notes: wizard.notes,
        autoPopulateTankReadings: true
      };

      const result = await dispatch(createNewAudit(auditData));

      if (result.payload?.isSuccess) {
        notify('Fuel audit finalized successfully!', 'success', 3000);
        dispatch(resetWizard());
        navigate('/tankstock/fuel-audit');
      } else {
        const errorMsg = result.payload?.message || 'Failed to finalize audit';
        notify(errorMsg, 'error', 4000);
      }
    } catch (error) {
      console.error('Error finalizing audit:', error);
      notify('An error occurred while finalizing the audit', 'error', 4000);
    }
  }, [dispatch, wizard, navigate]);

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1SitePeriod />;
      case 2:
        return <Step2TankSelection />;
      case 3:
        return <Step3TankPreview />;
      case 4:
        return <Step4VehicleSelection />;
      case 5:
        return <Step5VehiclePreview />;
      case 6:
        return <Step6Reconciliation />;
      case 7:
        return (
          <Step7AuditReport
            onFinalize={handleCreateAudit}
            onClose={handleClose}
          />
        );
      default:
        return <Step1SitePeriod />;
    }
  };

  return (
    <div className="create-audit-wizard-page tw-h-full tw-flex tw-flex-col tw-bg-white">
      {/* Wizard Panel - Full Screen */}
      <div className="tw-flex-1 tw-flex tw-flex-col tw-overflow-hidden">
        {/* Header with Title and Progress */}
        <div className="wizard-panel-header tw-bg-white tw-border-b tw-px-6 tw-py-4">
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
            <div className="tw-flex tw-items-center tw-gap-4 tw-flex-wrap">
              <h1 className="tw-text-xl tw-font-bold tw-text-gray-800 tw-flex tw-items-center">
                <span className="tw-mr-3 tw-text-blue-600">
                  <i className={`fa-light ${isEditMode ? 'fa-pen-to-square' : 'fa-plus-circle'}`}></i>
                </span>
                {isEditMode ? 'Edit Fuel Audit' : 'Create New Fuel Audit'}
              </h1>
              {/* Draft Status Indicator */}
              {(draftAudit.auditId || isEditMode) && (
                <span className="tw-text-xs tw-bg-yellow-100 tw-text-yellow-800 tw-px-2 tw-py-1 tw-rounded tw-flex tw-items-center tw-gap-1">
                  <span><i className="fa-light fa-floppy-disk"></i></span>
                  {isEditMode ? `Editing: ${draftAudit.auditNumber || reportId}` : `Draft: ${draftAudit.auditNumber}`}
                  {loading.saveDraft && (
                    <span className="tw-ml-1"><i className="fa-light fa-spinner fa-spin"></i></span>
                  )}
                </span>
              )}
              {/* Selection Summary Info */}
              {summaryInfo.length > 0 && (
                <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
                  <span className="tw-text-gray-300">|</span>
                  {summaryInfo.map((info, idx) => (
                    <span
                      key={info.key}
                      className="tw-text-xs tw-bg-gray-100 tw-text-gray-700 tw-px-2 tw-py-1 tw-rounded tw-flex tw-items-center tw-gap-1"
                    >
                      <span className="tw-text-gray-500"><i className={`fa-light ${info.icon}`}></i></span>
                      {info.text}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <span className="tw-text-sm tw-text-gray-500">
              Step {currentStep} of {TOTAL_STEPS}
            </span>
          </div>
          {/* Progress Indicator - Integrated */}
          <WizardProgress currentStep={currentStep} />
        </div>

        {/* Main Content Area - Scrollable */}
        <div className="tw-flex-1 tw-overflow-auto tw-relative">
          {/* Loading state when loading draft in edit mode */}
          {isEditMode && !isDraftLoaded && (
            <div className="tw-absolute tw-inset-0 tw-bg-white tw-flex tw-items-center tw-justify-center tw-z-50">
              <div className="tw-text-center">
                <div className="tw-w-10 tw-h-10 tw-border-4 tw-border-blue-600 tw-border-t-transparent tw-rounded-full tw-animate-spin tw-mx-auto tw-mb-3"></div>
                <span className="tw-text-gray-600">Loading audit data...</span>
              </div>
            </div>
          )}
          {/* Transition overlay to prevent rendering during step changes */}
          {isTransitioning && (
            <div className="tw-absolute tw-inset-0 tw-bg-white tw-bg-opacity-80 tw-flex tw-items-center tw-justify-center tw-z-50">
              <div className="tw-text-center">
                <div className="tw-w-8 tw-h-8 tw-border-4 tw-border-blue-600 tw-border-t-transparent tw-rounded-full tw-animate-spin tw-mx-auto tw-mb-2"></div>
                <span className="tw-text-sm tw-text-gray-500">Loading...</span>
              </div>
            </div>
          )}
          {/* Key forces React to remount the step component completely, avoiding DOM conflicts with DevExtreme DataGrid */}
          <div className="tw-h-full" key={`wizard-step-${currentStep}`}>
            {!isTransitioning && (!isEditMode || isDraftLoaded) && renderStepContent()}
          </div>
        </div>

        {/* Footer Actions - Fixed at Bottom */}
        <div className="wizard-footer tw-bg-white tw-border-t tw-px-6 tw-py-4 print:tw-hidden">
          <div className="tw-flex tw-justify-between tw-items-center">
            {/* Back button */}
            {currentStep > 1 ? (
              <button
                onClick={handleBack}
                disabled={isTransitioning}
                className={`dx-widget dx-button dx-button-mode-outlined dx-button-normal dx-button-has-text dx-button-has-icon ${isTransitioning ? 'dx-state-disabled' : ''}`}
                type="button"
                style={{ minWidth: '100px' }}
              >
                <div className="dx-button-content">
                  <span className="dx-button-text">← Back</span>
                </div>
              </button>
            ) : (
              <div style={{ width: '100px' }}></div>
            )}

            {/* Navigation buttons */}
            <div className="tw-flex tw-gap-3">
              {/* Cancel button */}
              <button
                onClick={handleClose}
                disabled={isTransitioning}
                className={`dx-widget dx-button dx-button-mode-outlined dx-button-normal dx-button-has-text ${isTransitioning ? 'dx-state-disabled' : ''}`}
                type="button"
                style={{ minWidth: '100px' }}
              >
                <div className="dx-button-content">
                  <span className="dx-button-text">Cancel</span>
                </div>
              </button>

              {/* Next button - not shown on step 7 (Report step has its own finalize) */}
              {currentStep < TOTAL_STEPS && (
                <button
                  onClick={handleNext}
                  disabled={isTransitioning}
                  className={`dx-widget dx-button dx-button-mode-contained dx-button-default dx-button-has-text ${isTransitioning ? 'dx-state-disabled' : ''}`}
                  type="button"
                  style={{ minWidth: '100px' }}
                >
                  <div className="dx-button-content">
                    <span className="dx-button-text">Next →</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAuditWizard;
