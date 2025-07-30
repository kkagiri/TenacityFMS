import React, { useState } from 'react';
import { Button } from 'devextreme-react/button';
import IssueTrackerFormPage from '../IssueTrackerFormPage';
import notify from 'devextreme/ui/notify';

const QuickCreateIssuePopup = ({
  triggerButtonText = "Quick Create Issue",
  triggerButtonIcon = "fa-light fa-plus-circle",
  onIssueCreated = null,
  prefilledData = {},
  workflowType = "quick-create"
}) => {
  const [isPopupVisible, setIsPopupVisible] = useState(false);

  const handleOpenPopup = () => {
    setIsPopupVisible(true);
  };

  const handleClosePopup = () => {
    setIsPopupVisible(false);
  };

  const handleIssueCreated = (newIssue) => {
    setIsPopupVisible(false);

    notify({
      message: `Issue "${newIssue.problemTitle}" created successfully!`,
      type: 'success',
      displayTime: 3000,
      position: {
        my: 'top center',
        at: 'top center',
        of: window,
        offset: '0 20'
      }
    });

    // Call parent callback if provided
    if (onIssueCreated) {
      onIssueCreated(newIssue);
    }
  };

  return (
    <>
      <Button
        text={triggerButtonText}
        icon={triggerButtonIcon}
        type="default"
        stylingMode="contained"
        onClick={handleOpenPopup}
        className="tw-bg-orange-600 tw-text-white"
      />

      {isPopupVisible && (
        <IssueTrackerFormPage
          isPopup={true}
          workflowType={workflowType}
          prefilledData={prefilledData}
          onClose={handleClosePopup}
          onSave={handleIssueCreated}
        />
      )}
    </>
  );
};

export default QuickCreateIssuePopup;
