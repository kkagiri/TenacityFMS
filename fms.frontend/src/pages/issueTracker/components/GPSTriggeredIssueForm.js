import React, { useState } from 'react';
import IssueTrackerFormPage from '../IssueTrackerFormPage';
import notify from 'devextreme/ui/notify';

const GPSTriggeredIssueForm = ({
  gpsData,
  onClose,
  onSave,
  isVisible = true
}) => {
  const [formVisible, setFormVisible] = useState(isVisible);

  const handleCloseForm = () => {
    setFormVisible(false);
    if (onClose) {
      onClose();
    }
  };

  const handleSaveIssue = (savedIssue) => {
    setFormVisible(false);

    notify({
      message: `GPS-triggered issue "${savedIssue.problemTitle}" created successfully!`,
      type: 'success',
      displayTime: 4000,
      position: {
        my: 'top center',
        at: 'top center',
        of: window,
        offset: '0 20'
      }
    });

    if (onSave) {
      onSave(savedIssue);
    }
  };

  if (!formVisible) {
    return null;
  }

  return (
    <IssueTrackerFormPage
      isPopup={true}
      workflowType="gps-triggered"
      gpsData={gpsData}
      onClose={handleCloseForm}
      onSave={handleSaveIssue}
      prefilledData={{
        problemTitle: gpsData?.suggestedTitle || 'GPS Alert - Vehicle Issue Detected',
        problemDescription: gpsData?.suggestedDescription || 'Automated issue created due to GPS signal anomaly.',
        categoryName: 'GPS/Tracking',
        priorityName: gpsData?.severity || 'High',
        isUrgent: gpsData?.isUrgent || true,
        vehicleId: gpsData?.vehicleId,
        vehicleName: gpsData?.vehicleName,
        gpsLatitude: gpsData?.latitude,
        gpsLongitude: gpsData?.longitude,
        gpsAddress: gpsData?.address,
        gpsTimestamp: gpsData?.timestamp ? new Date(gpsData.timestamp) : new Date()
      }}
    />
  );
};

export default GPSTriggeredIssueForm;
