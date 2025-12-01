/**
 * CreateAuditWizard.js
 *
 * Main 6-Step Wizard for creating new fuel audits.
 *
 * Steps:
 *   1: Site & Period Selection
 *   2: Tank Selection
 *   3: Tank Data Preview
 *   4: Vehicle Selection (with real driver data)
 *   5: GPS Data Preview
 *   6: Review & Create
 *
 * Uses Redux state.fuelAudit.wizard which is 1-indexed (step: 1 = first step).
 */

import React, { useEffect, useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from 'devextreme-react/button';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';

// Redux actions
import {
  setWizardStep,
  resetWizard,
  createNewAudit,
  selectWizard,
  selectLoading
} from '../../../../../redux/slices/fuelAuditSlice';
import { fetchSiteList } from '../../../../../redux/actions/siteActions';

// Step components
import Step1SitePeriod from './Step1SitePeriod';
import Step2TankSelection from './Step2TankSelection';
import Step3TankPreview from './Step3TankPreview';
import Step4VehicleSelection from './Step4VehicleSelection';
import Step5GpsPreview from './Step5GpsPreview';
import Step6ReviewCreate from './Step6ReviewCreate';
import WizardProgress from './WizardProgress';

// Constants
import { TOTAL_STEPS } from './wizardConstants';

// Styles
import '../CreateAuditWizard.scss';

const CreateAuditWizard = ({ onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const wizard = useSelector(selectWizard);
  const loading = useSelector(selectLoading);

  // Local state for auto-populate option
  const [autoPopulate, setAutoPopulate] = useState(true);

  // Current step from wizard state (1-indexed)
  const currentStep = wizard.step;

  // Load sites on mount
  useEffect(() => {
    dispatch(fetchSiteList());
  }, [dispatch]);

  // Handle close/cancel
  const handleClose = useCallback(() => {
    dispatch(resetWizard());
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
        if (!wizard.siteId) {
          notify('Please select a site', 'warning', 3000);
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

    if (currentStep < TOTAL_STEPS) {
      dispatch(setWizardStep(currentStep + 1));
    }
  }, [currentStep, dispatch, validateStep]);

  // Navigate to previous step
  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      dispatch(setWizardStep(currentStep - 1));
    }
  }, [currentStep, dispatch]);

  // Create the audit
  const handleCreateAudit = useCallback(async () => {
    // Final validation
    if (!wizard.siteId || !wizard.periodStart || !wizard.periodEnd) {
      notify('Missing required audit information', 'error', 3000);
      return;
    }

    if (!wizard.selectedTankIds?.length || !wizard.selectedVehicleIds?.length) {
      notify('Please select at least one tank and one vehicle', 'error', 3000);
      return;
    }

    try {
      const auditData = {
        siteId: wizard.siteId,
        auditType: wizard.auditType || 'Weekly',
        periodStart: wizard.periodStart,
        periodEnd: wizard.periodEnd,
        tankIds: wizard.selectedTankIds,
        vehicleIds: wizard.selectedVehicleIds,
        includeGpsFleet: wizard.includeGpsFleet,
        includePickups: wizard.includePickups,
        notes: wizard.notes,
        autoPopulateTankReadings: autoPopulate
      };

      const result = await dispatch(createNewAudit(auditData));

      if (result.payload?.isSuccess) {
        notify('Fuel audit created successfully!', 'success', 3000);
        dispatch(resetWizard());
        navigate('/tankstock/fuel-audit');
      } else {
        const errorMsg = result.payload?.message || 'Failed to create audit';
        notify(errorMsg, 'error', 4000);
      }
    } catch (error) {
      console.error('Error creating audit:', error);
      notify('An error occurred while creating the audit', 'error', 4000);
    }
  }, [dispatch, wizard, autoPopulate, navigate]);

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
        return <Step5GpsPreview />;
      case 6:
        return (
          <Step6ReviewCreate
            autoPopulate={autoPopulate}
            onAutoPopulateChange={setAutoPopulate}
          />
        );
      default:
        return <Step1SitePeriod />;
    }
  };

  return (
    <div className="create-audit-wizard-page tw-h-full tw-flex tw-flex-col tw-bg-gray-100">
      {/* Full Page Header */}
      <div className="wizard-page-header tw-bg-gradient-to-r tw-from-blue-600 tw-to-blue-700 tw-px-6 tw-py-4 tw-shadow-md">
        <div className="tw-max-w-6xl tw-mx-auto tw-flex tw-justify-between tw-items-center">
          <div className="tw-flex tw-items-center tw-gap-4">
            <button
              onClick={handleClose}
              className="tw-text-white tw-opacity-80 hover:tw-opacity-100 tw-transition-opacity tw-p-2 tw-rounded-lg hover:tw-bg-white/10"
              title="Back to Fuel Audit"
            >
              <i className="fa-light fa-arrow-left tw-text-xl"></i>
            </button>
            <div>
              <h1 className="tw-text-xl tw-font-bold tw-text-white tw-flex tw-items-center">
                <i className="fa-light fa-plus-circle tw-mr-3"></i>
                Create New Fuel Audit
              </h1>
              <p className="tw-text-blue-100 tw-text-sm tw-mt-0.5">
                Step {currentStep} of {TOTAL_STEPS}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="tw-text-white tw-opacity-80 hover:tw-opacity-100 tw-transition-opacity tw-px-4 tw-py-2 tw-rounded-lg tw-border tw-border-white/30 hover:tw-bg-white/10 tw-flex tw-items-center tw-gap-2"
            title="Cancel and go back"
          >
            <i className="fa-light fa-times"></i>
            <span className="tw-hidden sm:tw-inline">Cancel</span>
          </button>
        </div>
      </div>

      {/* Progress Indicator - Full Width */}
      <div className="tw-bg-white tw-border-b tw-shadow-sm">
        <div className="tw-max-w-6xl tw-mx-auto">
          <WizardProgress currentStep={currentStep} />
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="tw-flex-1 tw-overflow-auto tw-py-6">
        <div className="tw-max-w-6xl tw-mx-auto tw-px-4">
          <div className="tw-bg-white tw-rounded-xl tw-shadow-lg tw-min-h-[500px]">
            {renderStepContent()}
          </div>
        </div>
      </div>

      {/* Footer Actions - Fixed at Bottom */}
      <div className="wizard-footer tw-bg-white tw-border-t tw-shadow-lg tw-px-6 tw-py-4">
        <div className="tw-max-w-6xl tw-mx-auto tw-flex tw-justify-between tw-items-center">
          {/* Cancel button */}
          <Button
            text="Cancel"
            type="normal"
            stylingMode="outlined"
            onClick={handleClose}
            icon="fa-light fa-times"
          />

          {/* Navigation buttons */}
          <div className="tw-flex tw-gap-3">
            {/* Back button */}
            {currentStep > 1 && (
              <Button
                text="Back"
                type="normal"
                stylingMode="outlined"
                icon="fa-light fa-arrow-left"
                onClick={handleBack}
              />
            )}

            {/* Next / Create button */}
            {currentStep < TOTAL_STEPS ? (
              <Button
                text="Next"
                type="default"
                icon="fa-light fa-arrow-right"
                rtlEnabled={true}
                onClick={handleNext}
              />
            ) : (
              <Button
                text={loading.create ? "Creating..." : "Create Audit"}
                type="success"
                icon={loading.create ? "" : "fa-light fa-check"}
                onClick={handleCreateAudit}
                disabled={loading.create}
              >
                {loading.create && (
                  <LoadIndicator
                    className="tw-mr-2"
                    height={16}
                    width={16}
                    visible={true}
                  />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAuditWizard;
