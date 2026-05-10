import React, { useState, useMemo } from 'react';
import {
  MODE_DEFINITIONS,
  getCompatibleModesForWidget,
  groupModesByCategory,
  getModeContextHelp,
  getModeHelpText,
  getDefaultsForMode,
  validateModeForDataSource
} from '../../../utils/widgetModeCompatibility';

/**
 * ModeCard - Individual mode selection card
 */
const ModeCard = ({ mode, selected, onClick, disabled = false }) => {
  const colorClasses = {
    green: {
      border: selected ? 'tw-border-green-500' : 'tw-border-gray-200',
      bg: selected ? 'tw-bg-green-50' : 'tw-bg-white',
      text: 'tw-text-green-600',
      hover: 'hover:tw-border-green-300'
    },
    blue: {
      border: selected ? 'tw-border-blue-500' : 'tw-border-gray-200',
      bg: selected ? 'tw-bg-blue-50' : 'tw-bg-white',
      text: 'tw-text-blue-600',
      hover: 'hover:tw-border-blue-300'
    },
    purple: {
      border: selected ? 'tw-border-purple-500' : 'tw-border-gray-200',
      bg: selected ? 'tw-bg-purple-50' : 'tw-bg-white',
      text: 'tw-text-purple-600',
      hover: 'hover:tw-border-purple-300'
    },
    orange: {
      border: selected ? 'tw-border-orange-500' : 'tw-border-gray-200',
      bg: selected ? 'tw-bg-orange-50' : 'tw-bg-white',
      text: 'tw-text-orange-600',
      hover: 'hover:tw-border-orange-300'
    },
    teal: {
      border: selected ? 'tw-border-teal-500' : 'tw-border-gray-200',
      bg: selected ? 'tw-bg-teal-50' : 'tw-bg-white',
      text: 'tw-text-teal-600',
      hover: 'hover:tw-border-teal-300'
    },
    indigo: {
      border: selected ? 'tw-border-indigo-500' : 'tw-border-gray-200',
      bg: selected ? 'tw-bg-indigo-50' : 'tw-bg-white',
      text: 'tw-text-indigo-600',
      hover: 'hover:tw-border-indigo-300'
    }
  };

  const colors = colorClasses[mode.color] || colorClasses.blue;

  return (
    <button
      type="button"
      className={`tw-p-3 tw-border-2 tw-rounded-lg tw-transition-all tw-text-left tw-w-full
        ${colors.border} ${colors.bg} ${disabled ? 'tw-opacity-50 tw-cursor-not-allowed' : colors.hover}`}
      onClick={() => !disabled && onClick(mode.value)}
      disabled={disabled}
      aria-checked={selected}
      role="radio"
    >
      <div className="tw-flex tw-items-center tw-mb-1">
        <i className={`fa-light ${mode.icon} tw-text-lg ${colors.text} tw-mr-2`}></i>
        <span className="tw-font-semibold tw-text-sm tw-text-gray-800">{mode.label}</span>
        {mode.isRecommended && (
          <span className="tw-ml-auto tw-text-xs tw-bg-blue-100 tw-text-blue-700 tw-px-2 tw-py-0.5 tw-rounded">
            Recommended
          </span>
        )}
      </div>
      <p className="tw-text-xs tw-text-gray-600 tw-line-clamp-2">
        {mode.description}
      </p>
    </button>
  );
};

/**
 * ModeContextHelp - Help text panel showing mode-specific guidance
 */
const ModeContextHelp = ({ mode, widgetType }) => {
  const helpText = getModeHelpText(mode, widgetType);

  if (!helpText) return null;

  return (
    <div className="tw-mt-3 tw-p-3 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg">
      <div className="tw-flex tw-items-start">
        <i className="fa-light fa-info-circle tw-text-blue-600 tw-mr-2 tw-mt-0.5 tw-flex-shrink-0"></i>
        <div className="tw-text-xs tw-text-blue-800">
          {helpText}
        </div>
      </div>
    </div>
  );
};

/**
 * ModeSelector - Main mode selection component with hybrid UI
 */
export default function ModeSelector({
  selectedMode,
  widgetType,
  dataSourceMeta,
  onChange
}) {
  const [showAdvancedModes, setShowAdvancedModes] = useState(false);

  // Get compatible modes for current widget type and data source
  const compatibleModes = useMemo(() => {
    const dataSourceModes = dataSourceMeta?.supportedModes || [];
    return getCompatibleModesForWidget(widgetType, dataSourceModes);
  }, [widgetType, dataSourceMeta]);

  // Group modes by category
  const modeGroups = useMemo(() => {
    return groupModesByCategory(compatibleModes);
  }, [compatibleModes]);

  // Validate current mode
  const modeValidation = useMemo(() => {
    return validateModeForDataSource(selectedMode, dataSourceMeta);
  }, [selectedMode, dataSourceMeta]);

  // Handle mode change with smart defaults
  const handleModeChange = (newMode) => {
    const defaults = getDefaultsForMode(newMode, widgetType);
    onChange(newMode, defaults);
  };

  // Get context help text
  const contextHelp = getModeContextHelp(widgetType);

  // Check if we have any advanced modes
  const hasAdvancedModes = modeGroups.advanced.length > 0;

  return (
    <div className="tw-space-y-4">
      {/* Header with simple/advanced toggle */}
      <div className="tw-flex tw-items-center tw-justify-between">
        <div>
          <label className="tw-block tw-text-sm tw-font-semibold tw-text-gray-800">
            <i className="fa-light fa-toggle-on tw-mr-2 tw-text-purple-600"></i>
            Data Mode
          </label>
          <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
            {contextHelp}
          </p>
        </div>
        {hasAdvancedModes && (
          <button
            type="button"
            className="tw-text-xs tw-text-blue-600 hover:tw-text-blue-700 tw-font-medium"
            onClick={() => setShowAdvancedModes(!showAdvancedModes)}
          >
            {showAdvancedModes ? (
              <>
                <i className="fa-light fa-eye-slash tw-mr-1"></i>
                Simple View
              </>
            ) : (
              <>
                <i className="fa-light fa-eye tw-mr-1"></i>
                Show Advanced
              </>
            )}
          </button>
        )}
      </div>

      {/* Validation Warning */}
      {!modeValidation.valid && (
        <div className="tw-p-3 tw-bg-yellow-50 tw-border tw-border-yellow-200 tw-rounded-lg">
          <div className="tw-flex tw-items-start">
            <i className="fa-light fa-triangle-exclamation tw-text-yellow-600 tw-mr-2 tw-mt-0.5"></i>
            <div className="tw-flex-1">
              <div className="tw-text-xs tw-text-yellow-800 tw-mb-2">
                {modeValidation.reason}
              </div>
              {modeValidation.alternatives.length > 0 && (
                <div className="tw-flex tw-flex-wrap tw-gap-2">
                  <span className="tw-text-xs tw-text-yellow-700">Try:</span>
                  {modeValidation.alternatives.slice(0, 3).map(alt => (
                    <button
                      key={alt}
                      type="button"
                      className="tw-text-xs tw-bg-yellow-100 tw-text-yellow-800 tw-px-2 tw-py-1 tw-rounded hover:tw-bg-yellow-200"
                      onClick={() => handleModeChange(alt)}
                    >
                      {MODE_DEFINITIONS[alt]?.label || alt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Real-time Modes */}
      {modeGroups.realtime.length > 0 && (
        <div>
          <div className="tw-text-xs tw-font-semibold tw-text-gray-600 tw-mb-2 tw-uppercase tw-tracking-wide">
            Real-time
          </div>
          <div className="tw-grid tw-grid-cols-1 tw-gap-2">
            {modeGroups.realtime.map(mode => (
              <ModeCard
                key={mode.value}
                mode={mode}
                selected={selectedMode === mode.value}
                onClick={handleModeChange}
              />
            ))}
          </div>
        </div>
      )}

      {/* Historical Modes */}
      {modeGroups.historical.length > 0 && (
        <div>
          <div className="tw-text-xs tw-font-semibold tw-text-gray-600 tw-mb-2 tw-uppercase tw-tracking-wide">
            Historical
          </div>
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-2">
            {modeGroups.historical.map(mode => (
              <ModeCard
                key={mode.value}
                mode={mode}
                selected={selectedMode === mode.value}
                onClick={handleModeChange}
              />
            ))}
          </div>
        </div>
      )}

      {/* Advanced Modes (collapsible) */}
      {showAdvancedModes && modeGroups.advanced.length > 0 && (
        <div>
          <div className="tw-text-xs tw-font-semibold tw-text-gray-600 tw-mb-2 tw-uppercase tw-tracking-wide tw-flex tw-items-center">
            <i className="fa-light fa-flask tw-mr-2"></i>
            Advanced
          </div>
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-2">
            {modeGroups.advanced.map(mode => (
              <ModeCard
                key={mode.value}
                mode={mode}
                selected={selectedMode === mode.value}
                onClick={handleModeChange}
              />
            ))}
          </div>
        </div>
      )}

      {/* Context-specific help */}
      {selectedMode && (
        <ModeContextHelp mode={selectedMode} widgetType={widgetType} />
      )}

      {/* No compatible modes message */}
      {compatibleModes.length === 0 && (
        <div className="tw-p-4 tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-text-center">
          <i className="fa-light fa-circle-exclamation tw-text-gray-400 tw-text-2xl tw-mb-2"></i>
          <p className="tw-text-sm tw-text-gray-600">
            No compatible data modes available for this configuration.
          </p>
        </div>
      )}
    </div>
  );
}
