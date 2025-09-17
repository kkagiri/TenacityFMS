import React from 'react';
import { Button } from 'devextreme-react';
import ScrollView from 'devextreme-react/scroll-view';
import './FutureRecordsWarning.scss';

/**
 * Component to display future records warnings and handle user confirmation
 */
const FutureRecordsWarning = ({
  validationResult,
  onConfirm,
  onCancel,
  isVisible = true,
  className = ''
}) => {
  if (!isVisible || !validationResult || !validationResult.config.showWarning) {
    return null;
  }

  const { config, formattedMessage, detailedWarning, policy } = validationResult;

  const parseDetailedWarning = (detailedWarning) => {
    if (!detailedWarning) return null;

    try {
      // Check if it's already formatted with line breaks and sections
      const lines = detailedWarning.split('\n').filter(line => line.trim());

      const sections = [];
      let currentSection = null;

      lines.forEach(line => {
        const trimmedLine = line.trim();

        // Check for section headers (like "Affected future records:")
        if (trimmedLine.endsWith(':') && !trimmedLine.includes('record(s)')) {
          if (currentSection) {
            sections.push(currentSection);
          }
          currentSection = {
            title: trimmedLine,
            items: []
          };
        }
        // Check for bullet points or numbered items
        else if (trimmedLine.match(/^[•·*-]|\d+\s/)) {
          if (currentSection) {
            currentSection.items.push(trimmedLine);
          } else {
            sections.push({ title: null, items: [trimmedLine] });
          }
        }
        // Check for impact line
        else if (trimmedLine.toLowerCase().includes('impact:')) {
          sections.push({
            title: 'Impact:',
            items: [trimmedLine.replace(/^impact:\s*/i, '')]
          });
        }
        // Regular lines
        else if (trimmedLine) {
          if (currentSection) {
            currentSection.items.push(trimmedLine);
          } else {
            sections.push({ title: null, items: [trimmedLine] });
          }
        }
      });

      if (currentSection) {
        sections.push(currentSection);
      }

      return sections.length > 0 ? sections : null;
    } catch (error) {
      console.warn('Error parsing detailed warning:', error);
      return null;
    }
  };

  const renderFormattedDetails = (detailedWarning) => {
    const sections = parseDetailedWarning(detailedWarning);

    if (!sections) {
      // Fallback to original display if parsing fails
      return (
        <pre className="tw-whitespace-pre-wrap tw-font-mono tw-text-xs tw-leading-relaxed">
          {detailedWarning}
        </pre>
      );
    }

    return (
      <div className="tw-space-y-3">
        {sections.map((section, index) => (
          <div key={index} className="tw-space-y-1">
            {section.title && (
              <h6 className="tw-font-semibold tw-text-xs tw-text-current tw-mb-1">
                {section.title}
              </h6>
            )}
            <div className="tw-space-y-1">
              {section.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className="tw-text-xs tw-leading-relaxed tw-flex tw-items-start"
                >
                  {item.match(/^[•·*-]|\d+\s/) ? (
                    // Bullet point or numbered item
                    <div className="tw-flex tw-items-start tw-gap-2">
                      <span className="tw-text-current tw-opacity-60 tw-font-bold tw-mt-0.5">
                        {item.match(/^[•·*-]/) ? '•' : item.match(/^\d+/)?.[0] + '.'}
                      </span>
                      <span className="tw-flex-1">
                        {item.replace(/^[•·*-]\s*|\d+\s*/, '')}
                      </span>
                    </div>
                  ) : (
                    // Regular text
                    <span className="tw-block">{item}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const getAlertClassName = () => {
    const baseClass = 'future-records-warning tw-rounded tw-p-4 tw-mb-4 tw-border tw-border-solid';
    switch (config.alertType) {
      case 'error':
        return `${baseClass} tw-bg-red-50 tw-border-red-200 tw-text-red-800`;
      case 'warning':
        return `${baseClass} tw-bg-yellow-50 tw-border-yellow-200 tw-text-yellow-800`;
      case 'info':
        return `${baseClass} tw-bg-blue-50 tw-border-blue-200 tw-text-blue-800`;
      case 'success':
        return `${baseClass} tw-bg-green-50 tw-border-green-200 tw-text-green-800`;
      default:
        return `${baseClass} tw-bg-gray-50 tw-border-gray-200 tw-text-gray-800`;
    }
  };

  return (
    <div className={`${getAlertClassName()} ${className}`}>
      {/* Header with icon and title */}
      <div className="tw-flex tw-items-start tw-space-x-3">
        <div className="tw-flex-shrink-0">
          <i className={`${config.icon} ${config.iconClass} tw-text-lg`} />
        </div>

        <div className="tw-flex-1">
          {/* Main warning title */}
          <h4 className="tw-font-semibold tw-text-sm tw-mb-2">
            {config.blockSubmission ? 'Entry Blocked' :
             config.requiresConfirmation ? 'Confirmation Required' :
             'Information'}
          </h4>

          {/* Main message */}
          <p className="tw-text-sm tw-mb-3">
            {formattedMessage}
          </p>

          {/* Detailed warning with scroll view if available */}
          {detailedWarning && (
            <div className="tw-bg-white tw-bg-opacity-50 tw-rounded tw-mb-3">
              <div className="tw-font-medium tw-mb-1 tw-text-xs tw-px-3 tw-pt-2">Details:</div>
              <ScrollView
                className="tw-max-h-32"
                showScrollbar="onHover"
                scrollByContent={true}
                scrollByThumb={true}
                direction="vertical"
              >
                <div className="tw-px-3 tw-pb-2">
                  {renderFormattedDetails(detailedWarning)}
                </div>
              </ScrollView>
            </div>
          )}

          {/* Policy information */}
          <div className="tw-text-xs tw-opacity-75 tw-mb-3">
            Current policy: <span className="tw-font-medium">{policy}</span>
            {config.recommendedAction && (
              <span> • {config.recommendedAction}</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="tw-flex tw-space-x-2">
            {config.requiresConfirmation && onConfirm && (
              <Button
                text="Proceed Anyway"
                type="default"
                stylingMode="contained"
                onClick={onConfirm}
                disabled={config.blockSubmission}
                className="tw-text-xs"
              />
            )}

            {onCancel && (
              <Button
                text={config.blockSubmission ? "OK" : "Cancel"}
                type={config.blockSubmission ? "default" : "normal"}
                stylingMode="outlined"
                onClick={onCancel}
                className="tw-text-xs"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FutureRecordsWarning;
