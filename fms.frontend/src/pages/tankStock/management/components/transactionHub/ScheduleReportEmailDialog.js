/**
 * File: ScheduleReportEmailDialog.js
 * Purpose: Popup dialog for scheduling Transaction Volume History report emails
 * Dependencies: React, DevExtreme Popup/TagBox/DateBox/Button
 * Last Modified: 2026-01-21
 *
 * Key Components:
 * - ScheduleReportEmailDialog: Collects recipients and schedule time
 */
import React from 'react';
import Popup from 'devextreme-react/popup';
import TagBox from 'devextreme-react/tag-box';
import DateBox from 'devextreme-react/date-box';
import Button from 'devextreme-react/button';

const ScheduleReportEmailDialog = ({
  visible,
  onHiding,
  usersForFilter,
  recipientIds,
  onRecipientIdsChange,
  scheduledAt,
  onScheduledAtChange,
  onSchedule,
  isScheduling
}) => (
  <Popup
    visible={visible}
    onHiding={onHiding}
    showTitle={true}
    title="Schedule Report Email"
    width={720}
    height={420}
    showCloseButton={true}
    dragEnabled={true}
    resizeEnabled={true}
    className="schedule-report-popup"
  >
    <div className="tw-flex tw-flex-col tw-gap-4 tw-p-4">
      <div>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
          Recipients
        </label>
        <TagBox
          dataSource={usersForFilter}
          displayExpr="userName"
          valueExpr="userId"
          value={recipientIds}
          onValueChanged={(e) => onRecipientIdsChange(e.value)}
          placeholder="Select users"
          searchEnabled={true}
          showSelectionControls={true}
          applyValueMode="useButtons"
        />
      </div>

      <div>
        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
          Scheduled Send Time
        </label>
        <DateBox
          type="datetime"
          value={scheduledAt}
          onValueChanged={(e) => onScheduledAtChange(e.value)}
          displayFormat="yyyy-MM-dd HH:mm"
          width="100%"
        />
      </div>

      <div className="tw-flex tw-justify-end tw-gap-2 tw-pt-2">
        <Button
          text="Cancel"
          icon="fa-light fa-times"
          stylingMode="outlined"
          onClick={onHiding}
        />
        <Button
          text={isScheduling ? 'Scheduling...' : 'Schedule Email'}
          icon="fa-light fa-envelope"
          type="default"
          stylingMode="contained"
          onClick={onSchedule}
          disabled={isScheduling}
        />
      </div>
    </div>
  </Popup>
);

export default ScheduleReportEmailDialog;
