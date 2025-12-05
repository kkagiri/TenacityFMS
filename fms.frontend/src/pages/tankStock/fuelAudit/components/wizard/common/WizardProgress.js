/**
 * WizardProgress.js
 * Progress indicator component for the wizard
 */

import React from 'react';
import { STEP_CONFIG } from './wizardConstants';

const WizardProgress = ({ currentStep }) => {
  return (
    <div className="wizard-progress tw-px-6 tw-py-4 tw-border-b tw-bg-white">
      <div className="tw-flex tw-justify-between tw-items-center">
        {STEP_CONFIG.map((stepInfo, index) => {
          const isCompleted = stepInfo.step < currentStep;
          const isCurrent = stepInfo.step === currentStep;

          return (
            <div
              key={`step-${stepInfo.step}`}
              className={`tw-flex tw-flex-col tw-items-center tw-flex-1 ${
                index > 0 ? 'tw-relative' : ''
              }`}
            >
              {/* Connector line */}
              {index > 0 && (
                <div
                  className={`tw-absolute tw-top-4 tw-right-1/2 tw-w-full tw-h-0.5 -tw-z-10 ${
                    isCompleted ? 'tw-bg-green-500' : 'tw-bg-gray-200'
                  }`}
                  style={{ transform: 'translateX(50%)' }}
                />
              )}

              {/* Step circle */}
              <div
                className={`tw-relative tw-z-10 tw-w-8 tw-h-8 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-text-sm tw-font-medium tw-transition-all tw-duration-200 ${
                  isCompleted
                    ? 'tw-bg-green-500 tw-text-white tw-shadow-sm'
                    : isCurrent
                    ? 'tw-bg-blue-500 tw-text-white tw-shadow-md tw-ring-4 tw-ring-blue-100'
                    : 'tw-bg-gray-200 tw-text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <span className="tw-inline-block">✓</span>
                ) : (
                  stepInfo.step
                )}
              </div>

              {/* Step title */}
              <span
                className={`tw-mt-2 tw-text-xs tw-text-center tw-transition-colors ${
                  isCurrent
                    ? 'tw-text-blue-600 tw-font-semibold'
                    : isCompleted
                    ? 'tw-text-green-600 tw-font-medium'
                    : 'tw-text-gray-500'
                }`}
              >
                {stepInfo.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WizardProgress;
