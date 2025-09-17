import React from 'react';
import { Popup } from 'devextreme-react/popup';
import { Button } from 'devextreme-react';
import { LoadPanel } from 'devextreme-react/load-panel';
import ScrollView from 'devextreme-react/scroll-view';
import './FutureRecordsConfirmationPopup.css';

/**
 * Popup component to display future records warnings and handle user confirmation
 */
const FutureRecordsConfirmationPopup = ({
  validationResult,
  onConfirm,
  onCancel,
  isVisible = true,
  isLoading = false
}) => {
  if (!validationResult || !validationResult.config.showWarning) {
    return null;
  }

  const { detailedWarning, policy, futureRecordsCount } = validationResult;

  const parseDetailedWarning = (detailedWarning) => {
    if (!detailedWarning) return null;

    try {
      // Split by newlines and filter empty lines
      const lines = detailedWarning.split('\n').filter(line => line.trim());

      const recordItems = [];
      let impactStatement = '';

      lines.forEach(line => {
        const trimmedLine = line.trim();

        // Skip section headers like "Affected future records:"
        if (trimmedLine.endsWith(':') && !trimmedLine.includes('record(s)')) {
          return;
        }

        // Extract record counts (look for patterns like "• 165 Dispensing record(s)")
        const recordMatch = trimmedLine.match(/^[•·*-]\s*(\d+)\s+(.+?)\s+record\(s\)/);
        if (recordMatch) {
          recordItems.push({
            count: parseInt(recordMatch[1]),
            type: recordMatch[2]
          });
        }
        // Extract impact statements (look for "Impact:" lines)
        else if (trimmedLine.startsWith('Impact:')) {
          impactStatement = trimmedLine.replace('Impact:', '').trim();
        }
      });

      return {
        recordItems,
        impactStatement
      };
    } catch (error) {
      console.warn('Error parsing detailed warning:', error);
      return null;
    }
  };

  const renderFormattedDetails = (detailedWarning) => {
    const parsedData = parseDetailedWarning(detailedWarning);

    if (!parsedData) {
      // Fallback to simple formatting
      return (
        <div className="future-records-details">
          <p>{detailedWarning}</p>
        </div>
      );
    }

    const { recordItems, impactStatement } = parsedData;

    return (
      <div className="future-records-details">
        {recordItems.length > 0 && (
          <div className="record-breakdown">
            <div className="record-list">
              {recordItems.map((item, index) => (
                <div key={index} className="record-item">
                  <span className="record-count-badge">{item.count}</span>
                  <span className="record-type">{item.type} record{item.count !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {impactStatement && (
          <div className="impact-note">
            <i className="fa-light fa-info-circle"></i>
            <span>{impactStatement}</span>
          </div>
        )}
      </div>
    );
  };

  const renderWarningContent = () => {
    return (
      <div className="future-records-warning-content">
        {/* Creative Info Bar Design */}
        <div className="impact-info-bar">
          <div className="info-bar-icon">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>
          <div className="info-bar-content">
            <div className="impact-summary">
              <span className="record-count">{futureRecordsCount || 'Multiple'}</span>
              <span className="impact-text">future records will be affected</span>
            </div>
            {policy && (
              <div className="policy-badge">
                <i className="fa-light fa-shield-check"></i>
                {policy}
              </div>
            )}
          </div>
        </div>

        {/* Simplified Impact Details */}
        {detailedWarning && (
          <div className="impact-details">
            <h4>Affected Records:</h4>
            {renderFormattedDetails(detailedWarning)}
          </div>
        )}
      </div>
    );
  };  return (
    <>
      <Popup
        visible={isVisible}
        onHiding={onCancel}
        showCloseButton={true}
        showTitle={true}
        title="Future Records Impact Confirmation"
        width={{ base: "95%", sm: "90%", md: 600, lg: 650 }}
        minWidth={320}
        maxWidth={700}
        height="auto"
        maxHeight="90vh"
        dragEnabled={true}
        resizeEnabled={false}
        position={{ my: 'center', at: 'center', of: window }}
        wrapperAttr={{
          class: 'future-records-confirmation-popup'
        }}
      >
        <div className="popup-content">
          <ScrollView className="popup-scroll-content" showScrollbar="onHover">
            {renderWarningContent()}
          </ScrollView>

          {/* Action Buttons */}
          <div className="popup-actions">
            <Button
              text="Cancel"
              onClick={onCancel}
              stylingMode="outlined"
              disabled={isLoading}
            >
              <i className="fa-light fa-times" style={{ marginRight: '8px' }}></i>
              Cancel
            </Button>
            <Button
              text="Proceed Anyway"
              onClick={onConfirm}
              type="default"
              disabled={isLoading}
            >
              <i className="fa-light fa-check" style={{ marginRight: '8px' }}></i>
              Proceed
            </Button>
          </div>
        </div>
      </Popup>

      {/* Loading Panel - Shows in the middle of the screen */}
      <LoadPanel
        visible={isLoading}
        message="Validating future records..."
        showIndicator={true}
        showPane={true}
        shading={true}
        position={{ my: 'center', at: 'center', of: window }}
        shadingColor="rgba(0, 0, 0, 0.4)"
        width={300}
        height={120}
      />
    </>
  );
};

export default FutureRecordsConfirmationPopup;
