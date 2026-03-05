/**
 * WizardProgress.js
 * Progress indicator component for the wizard
 */

import React from 'react';
import { STEP_CONFIG } from './wizardConstants';

const WizardProgress = ({ currentStep }) => {
  return (
    <div
      className="wizard-progress tw-px-6 tw-py-4 tw-border-b"
      style={{ background: 'var(--fms-surface)', borderColor: 'var(--fms-border)' }}
    >
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
                  className="tw-absolute tw-top-4 tw-right-1/2 tw-w-full tw-h-0.5 -tw-z-10"
                  style={{
                    transform: 'translateX(50%)',
                    background: isCompleted ? '#22c55e' : 'var(--fms-border)',
                  }}
                />
              )}

              {/* Step circle */}
              <div
                className={`tw-relative tw-z-10 tw-w-8 tw-h-8 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-text-sm tw-font-medium tw-transition-all tw-duration-200 ${
                  isCurrent ? 'tw-shadow-md tw-ring-4' : 'tw-shadow-sm'
                }`}
                style={
                  isCompleted
                    ? { background: '#22c55e', color: '#ffffff' }
                    : isCurrent
                    ? { background: '#3b82f6', color: '#ffffff', '--tw-ring-color': 'rgba(59,130,246,0.25)' }
                    : { background: 'var(--fms-surface-secondary)', color: 'var(--fms-text-secondary)', border: '1px solid var(--fms-border)' }
                }
              >
                {isCompleted ? (
                  <span className="tw-inline-block">✓</span>
                ) : (
                  stepInfo.step
                )}
              </div>

              {/* Step title */}
              <span
                className="tw-mt-2 tw-text-xs tw-text-center tw-transition-colors"
                style={
                  isCurrent
                    ? { color: '#3b82f6', fontWeight: 600 }
                    : isCompleted
                    ? { color: '#22c55e', fontWeight: 500 }
                    : { color: 'var(--fms-text-secondary)' }
                }
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
