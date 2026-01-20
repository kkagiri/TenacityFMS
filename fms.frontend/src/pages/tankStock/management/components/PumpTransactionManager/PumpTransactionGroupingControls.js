import React from "react";
import { Button } from "devextreme-react/button";
import CheckBox from "devextreme-react/check-box";

const PumpTransactionGroupingControls = ({
  groupBy,
  hasActiveGrouping,
  isGroupsExpanded,
  onGroupByChange,
  onClearGrouping,
  onToggleExpandGroups,
}) => {
  return (
    <div className="tw-mt-3 tw-p-3 tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg">
      <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-center tw-gap-3">
        {/* Grouping Options */}
        <div className="tw-flex tw-items-center tw-gap-4 tw-flex-wrap">
          <label className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-flex tw-items-center">
            <i className="fa-light fa-layer-group tw-mr-2"></i>
            Group By:
          </label>

          {/* Date Checkbox */}
          <div className="tw-flex tw-items-center">
            <CheckBox
              text="Date"
              value={groupBy.date}
              onValueChanged={(e) => onGroupByChange("date", e.value)}
            />
            <i className="fa-light fa-calendar tw-ml-1 tw-text-gray-500"></i>
          </div>

          {/* Site Checkbox */}
          <div className="tw-flex tw-items-center">
            <CheckBox
              text="Site"
              value={groupBy.site}
              onValueChanged={(e) => onGroupByChange("site", e.value)}
            />
            <i className="fa-light fa-building tw-ml-1 tw-text-gray-500"></i>
          </div>

          {/* Tank Checkbox */}
          <div className="tw-flex tw-items-center">
            <CheckBox
              text="Tank"
              value={groupBy.tank}
              onValueChanged={(e) => onGroupByChange("tank", e.value)}
            />
            <i className="fa-light fa-gas-pump tw-ml-1 tw-text-gray-500"></i>
          </div>

          {/* Vehicle Checkbox */}
          <div className="tw-flex tw-items-center">
            <CheckBox
              text="Vehicle"
              value={groupBy.vehicle}
              onValueChanged={(e) => onGroupByChange("vehicle", e.value)}
            />
            <i className="fa-light fa-truck tw-ml-1 tw-text-gray-500"></i>
          </div>

          {/* PTS Device Checkbox */}
          <div className="tw-flex tw-items-center">
            <CheckBox
              text="PTS Device"
              value={groupBy.ptsDevice}
              onValueChanged={(e) => onGroupByChange("ptsDevice", e.value)}
            />
            <i className="fa-light fa-microchip tw-ml-1 tw-text-gray-500"></i>
          </div>

          {/* Clear Grouping Button */}
          {hasActiveGrouping && (
            <Button
              text="Clear"
              icon="fa-light fa-times"
              onClick={onClearGrouping}
              stylingMode="text"
              type="danger"
              hint="Clear all groupings"
            />
          )}
        </div>

        {/* Group Controls */}
        {hasActiveGrouping && (
          <div className="tw-flex tw-items-center tw-gap-2 tw-border-l tw-border-gray-300 tw-pl-4">
            <Button
              text={isGroupsExpanded ? "Collapse All" : "Expand All"}
              icon={
                isGroupsExpanded ? "fa-light fa-compress" : "fa-light fa-expand"
              }
              onClick={onToggleExpandGroups}
              stylingMode="outlined"
              type="default"
            />
          </div>
        )}

        {/* Active Grouping Indicator */}
        {hasActiveGrouping && (
          <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-blue-600 tw-ml-auto">
            <i className="fa-light fa-info-circle"></i>
            <span>
              Grouped by:{" "}
              {[
                groupBy.date && "Date",
                groupBy.site && "Site",
                groupBy.tank && "Tank",
                groupBy.vehicle && "Vehicle",
                groupBy.ptsDevice && "PTS Device",
              ]
                .filter(Boolean)
                .join(" → ")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PumpTransactionGroupingControls;
