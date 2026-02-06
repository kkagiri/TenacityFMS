/**
 * File: ScheduleReportEmailDialog.js
 * Purpose: Reusable popup dialog for configuring recurring report email schedules
 * Dependencies: React, DevExtreme Popup/TagBox/DateBox/SelectBox/TextBox/TextArea/Button
 * Last Modified: 2026-02-03
 *
 * Key Components:
 * - ScheduleReportEmailDialog: Collects scope, cadence, report metadata, and recipients
 */
import React, { useEffect, useMemo } from "react";
import Popup from "devextreme-react/popup";
import TagBox from "devextreme-react/tag-box";
import DateBox from "devextreme-react/date-box";
import SelectBox from "devextreme-react/select-box";
import TextBox from "devextreme-react/text-box";
import TextArea from "devextreme-react/text-area";
import Button from "devextreme-react/button";
import {
  DAY_OF_WEEK_OPTIONS,
  REPORT_FORMAT_OPTIONS,
  REPORT_NAME_PREFIX,
  REPORT_PERIOD_OPTIONS,
  WEEK_OF_MONTH_OPTIONS,
  createDateFromTimeString,
  filterTankIdsBySelectedSites,
  getEffectiveReportWindowForRun,
  getNextRunDateTime,
  toIsoDate,
  toTimeString,
} from "./reportEmailScheduleUtils";

const ScheduleReportEmailDialog = ({
  visible,
  onHiding,
  sites,
  tanks,
  usersForFilter,
  scheduleConfig,
  onScheduleConfigChange,
  onSchedule,
  isScheduling,
}) => {
  const selectedSiteIds = scheduleConfig?.siteIds || [];
  const selectedTankIds = scheduleConfig?.tankIds || [];
  const selectedRecipients = useMemo(
    () =>
      (Array.isArray(scheduleConfig?.recipientIds) ? scheduleConfig.recipientIds : [])
        .filter((id) => id !== null && id !== undefined && id !== "")
        .map((id) => String(id)),
    [scheduleConfig?.recipientIds]
  );
  const periodType = scheduleConfig?.periodType || "daily";
  const selectedDayOfWeekIds = useMemo(() => {
    const configuredDayIds = Array.isArray(scheduleConfig?.scheduleDayOfWeekIds)
      ? scheduleConfig.scheduleDayOfWeekIds.filter(Boolean)
      : [];

    if (configuredDayIds.length) {
      return configuredDayIds;
    }

    return [scheduleConfig?.scheduleDayOfWeek || "monday"];
  }, [scheduleConfig]);
  const scheduleDayOfWeek =
    scheduleConfig?.scheduleDayOfWeek || selectedDayOfWeekIds[0] || "monday";
  const scheduleWeekOfMonth = scheduleConfig?.scheduleWeekOfMonth || "first";
  const scheduleTime = scheduleConfig?.scheduleTime || "08:00";
  const reportName = scheduleConfig?.reportName || "";
  const reportDescription = scheduleConfig?.reportDescription || "";

  const filteredTanks = useMemo(() => {
    if (!selectedSiteIds.length) return tanks || [];
    return (tanks || []).filter((tank) => selectedSiteIds.includes(tank.siteId));
  }, [tanks, selectedSiteIds]);

  const recipientOptions = useMemo(
    () =>
      (usersForFilter || [])
        .map((user) => {
          const rawId = user?.userId ?? user?.id;
          if (rawId === null || rawId === undefined || rawId === "") {
            return null;
          }

          return {
            id: String(rawId),
            name:
              user?.userName ||
              user?.username ||
              user?.name ||
              `User ${rawId}`,
          };
        })
        .filter(Boolean),
    [usersForFilter]
  );

  // Only filter tank IDs when dialog is visible to prevent infinite loop
  useEffect(() => {
    if (!visible) return;

    const validTankIds = filterTankIdsBySelectedSites({
      tankIds: selectedTankIds,
      siteIds: selectedSiteIds,
      tanks,
    });

    const hasChanged =
      validTankIds.length !== selectedTankIds.length ||
      validTankIds.some((id, index) => id !== selectedTankIds[index]);

    if (hasChanged) {
      onScheduleConfigChange({ tankIds: validTankIds });
    }
  }, [visible, selectedTankIds, selectedSiteIds, tanks, onScheduleConfigChange]);

  const nextRunDate = useMemo(
    () =>
      getNextRunDateTime({
        periodType,
        scheduleDayOfWeek,
        scheduleDayOfWeekIds: selectedDayOfWeekIds,
        scheduleWeekOfMonth,
        scheduleTime,
      }),
    [
      periodType,
      scheduleDayOfWeek,
      selectedDayOfWeekIds,
      scheduleWeekOfMonth,
      scheduleTime,
    ]
  );

  const reportWindow = useMemo(
    () =>
      getEffectiveReportWindowForRun({
        periodType,
        runDate: nextRunDate,
      }),
    [periodType, nextRunDate]
  );

  const summaryRange = reportWindow
    ? `${toIsoDate(reportWindow.startDate)} to ${toIsoDate(reportWindow.endDate)}`
    : "N/A";

  const nextRunText =
    nextRunDate && !Number.isNaN(nextRunDate.getTime())
      ? nextRunDate.toLocaleString()
      : "N/A";

  return (
    <Popup
      visible={visible}
      onHiding={onHiding}
      showTitle={true}
      title="Schedule Report Email"
      width={940}
      height={700}
      showCloseButton={true}
      dragEnabled={true}
      resizeEnabled={true}
      className="schedule-report-popup"
    >
      <div className="tw-flex tw-flex-col tw-gap-4 tw-p-4">
        <div className="tw-rounded-md tw-border tw-border-slate-200 tw-bg-white tw-p-4">
          <div className="tw-mb-3 tw-text-sm tw-font-semibold tw-text-slate-800">
            1. Report Details
          </div>
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Report Name
              </label>
              <div className="tw-mb-1 tw-text-xs tw-text-gray-500">
                Prefix is always:{" "}
                <span className="tw-font-medium">{REPORT_NAME_PREFIX}</span>
              </div>
              <TextBox
                value={reportName}
                onValueChanged={(e) =>
                  onScheduleConfigChange({ reportName: e.value || "" })
                }
                placeholder="e.g. Weekly Site Summary"
                width="100%"
              />
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Description
              </label>
              <TextArea
                value={reportDescription}
                onValueChanged={(e) =>
                  onScheduleConfigChange({ reportDescription: e.value || "" })
                }
                placeholder="Describe what this scheduled report is for."
                minHeight={90}
              />
            </div>
          </div>
        </div>

        <div className="tw-rounded-md tw-border tw-border-slate-200 tw-bg-white tw-p-4">
          <div className="tw-mb-3 tw-text-sm tw-font-semibold tw-text-slate-800">
            2. Period & Timing
          </div>
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Period
              </label>
              <SelectBox
                dataSource={REPORT_PERIOD_OPTIONS}
                valueExpr="id"
                displayExpr="name"
                value={periodType}
                onValueChanged={(e) =>
                  onScheduleConfigChange({ periodType: e.value })
                }
                width="100%"
              />
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Day Selector
              </label>
              <TagBox
                dataSource={DAY_OF_WEEK_OPTIONS}
                valueExpr="id"
                displayExpr="name"
                value={selectedDayOfWeekIds}
                onValueChanged={(e) => {
                  const selectedValues = Array.isArray(e.value)
                    ? e.value.filter(Boolean)
                    : [];
                  const normalizedDayIds = selectedValues.length
                    ? selectedValues
                    : ["monday"];

                  onScheduleConfigChange({
                    scheduleDayOfWeekIds: normalizedDayIds,
                    scheduleDayOfWeek: normalizedDayIds[0],
                  });
                }}
                placeholder="Select one or more days"
                searchEnabled={true}
                showSelectionControls={true}
                applyValueMode="useButtons"
                maxDisplayedTags={4}
              />
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Week Selector
              </label>
              <SelectBox
                dataSource={WEEK_OF_MONTH_OPTIONS}
                valueExpr="id"
                displayExpr="name"
                value={scheduleWeekOfMonth}
                onValueChanged={(e) =>
                  onScheduleConfigChange({ scheduleWeekOfMonth: e.value })
                }
                width="100%"
                disabled={periodType !== "monthly"}
              />
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Schedule Time
              </label>
              <DateBox
                type="time"
                value={createDateFromTimeString(scheduleTime)}
                onValueChanged={(e) =>
                  onScheduleConfigChange({
                    scheduleTime: e.value ? toTimeString(e.value) : "08:00",
                  })
                }
                displayFormat="HH:mm"
                width="100%"
              />
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Report Format
              </label>
              <SelectBox
                dataSource={REPORT_FORMAT_OPTIONS}
                valueExpr="id"
                displayExpr="name"
                value={scheduleConfig?.format || "pdf"}
                onValueChanged={(e) => onScheduleConfigChange({ format: e.value })}
                width="100%"
              />
            </div>
          </div>
        </div>

        <div className="tw-rounded-md tw-border tw-border-slate-200 tw-bg-white tw-p-4">
          <div className="tw-mb-3 tw-text-sm tw-font-semibold tw-text-slate-800">
            3. Parameters
          </div>
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Sites
              </label>
              <TagBox
                dataSource={sites || []}
                displayExpr="name"
                valueExpr="id"
                value={selectedSiteIds}
                onValueChanged={(e) =>
                  onScheduleConfigChange({ siteIds: e.value })
                }
                placeholder="All sites"
                searchEnabled={true}
                showSelectionControls={true}
                applyValueMode="useButtons"
                maxDisplayedTags={3}
              />
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Tanks
              </label>
              <TagBox
                dataSource={filteredTanks}
                displayExpr="name"
                valueExpr="id"
                value={selectedTankIds}
                onValueChanged={(e) =>
                  onScheduleConfigChange({ tankIds: e.value })
                }
                placeholder="All tanks"
                searchEnabled={true}
                showSelectionControls={true}
                applyValueMode="useButtons"
                maxDisplayedTags={3}
              />
            </div>
          </div>

          <div className="tw-mt-4">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Recipients
            </label>
            <TagBox
              dataSource={recipientOptions}
              displayExpr="name"
              valueExpr="id"
              value={selectedRecipients}
              onValueChanged={(e) =>
                onScheduleConfigChange({
                  recipientIds: (Array.isArray(e.value) ? e.value : [])
                    .filter((id) => id !== null && id !== undefined && id !== "")
                    .map((id) => String(id)),
                })
              }
              placeholder="Select users"
              searchEnabled={true}
              showSelectionControls={true}
              applyValueMode="useButtons"
            />
          </div>
        </div>

        <div className="tw-rounded-md tw-border tw-border-blue-100 tw-bg-blue-50 tw-p-3 tw-text-sm tw-text-blue-900">
          <div className="tw-font-medium tw-mb-1">Schedule summary</div>
          <div>Next run: {nextRunText}</div>
          <div>Effective report range: {summaryRange}</div>
          <div>Sites selected: {selectedSiteIds.length || "All"}</div>
          <div>Tanks selected: {selectedTankIds.length || "All"}</div>
          <div>Recipients selected: {selectedRecipients.length}</div>
        </div>

        <div className="tw-flex tw-justify-end tw-gap-2 tw-pt-2">
          <Button
            text="Cancel"
            icon="fa-light fa-times"
            stylingMode="outlined"
            onClick={onHiding}
          />
          <Button
            text={isScheduling ? "Scheduling..." : "Schedule Email"}
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
};

export default ScheduleReportEmailDialog;
