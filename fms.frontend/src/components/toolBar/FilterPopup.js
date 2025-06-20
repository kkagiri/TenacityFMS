import React, { useState, useCallback } from "react";
import { Popup, ToolbarItem } from "devextreme-react/popup";
import { SelectBox } from "devextreme-react/select-box";
import { DateRangeBox } from "devextreme-react/date-range-box";
import { CheckBox } from "devextreme-react/check-box";
import ScrollView from "devextreme-react/scroll-view";
import notify from "devextreme/ui/notify";
import { DatePeriods } from "../Shared/datePeriods";

const FilterPopup = ({
  visible,
  onHiding,
  sites,
  selectedSite,
  onApplyFilter,
}) => {
  //Cursor: Initialize filter state with yesterday as default
  const [filterState, setFilterState] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return {
      selectedDatePreset: 'Yesterday',
      customDateRange: [yesterday, yesterday],
      selectedSite: selectedSite || 'all',
      activeFilter: 'Yesterday'
    };
  });

  //Cursor: Get date periods from utility
  const datePeriods = DatePeriods();
  const siteOptions = [{ id: "all", name: "All Sites" }, ...sites];

  //Cursor: Handle date preset change
  const handleDatePresetChange = useCallback((presetName, isChecked) => {
    if (isChecked) {
      const period = datePeriods[presetName];
      const [startDate, endDate] = period.period.split('/').map(dateStr => new Date(dateStr));

      setFilterState(prev => ({
        ...prev,
        selectedDatePreset: presetName,
        customDateRange: [startDate, endDate],
        activeFilter: presetName
      }));
    }
  }, [datePeriods]);

  //Cursor: Handle custom date range change
  const handleCustomDateRangeChange = useCallback((e) => {
    if (e.value && e.value.length === 2) {
      setFilterState(prev => ({
        ...prev,
        customDateRange: e.value,
        selectedDatePreset: '',
        activeFilter: 'Custom Range'
      }));
    }
  }, []);

  //Cursor: Handle site filter change
  const handleSiteFilterChange = useCallback((e) => {
    setFilterState(prev => ({
      ...prev,
      selectedSite: e.value
    }));
  }, []);

  //Cursor: Handle apply filter
  const handleApplyFilter = useCallback(() => {
    const { customDateRange, selectedSite, activeFilter } = filterState;

    if (onApplyFilter) {
      onApplyFilter({
        dateRange: customDateRange,
        site: selectedSite,
        activeFilter: activeFilter
      });
    }

    onHiding();
    notify("Filters applied successfully", "success", 2000);
  }, [filterState, onApplyFilter, onHiding]);

  return (
    <Popup
      visible={visible}
      onHiding={onHiding}
      dragEnabled={false}
      showTitle={true}
      title="Filter Options"
      showCloseButton={true}
      width="400px"
      height="auto"
      position={{ my: "center", at: "center", of: window }}
    >
      <ScrollView height="auto">
        <div className="tw-p-4">
          {/* Site Selection */}
          <div className="tw-mb-4">
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">Site</label>
            <SelectBox
              dataSource={siteOptions}
              displayExpr="name"
              valueExpr="id"
              value={filterState.selectedSite}
              onValueChanged={handleSiteFilterChange}
              width="100%"
              placeholder="Select a site"
            />
          </div>

          {/* Date Presets */}
          <div className="tw-mb-4">
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">Quick Date Selection</label>
            {Object.keys(datePeriods).map((presetName) => (
              <div key={presetName} className="tw-mb-2">
                <CheckBox
                  text={presetName}
                  value={filterState.selectedDatePreset === presetName}
                  onValueChanged={(e) => handleDatePresetChange(presetName, e.value)}
                />
              </div>
            ))}
          </div>

          {/* Custom Date Range */}
          <div className="tw-mb-4">
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">Custom Date Range</label>
            <CheckBox
              text="Custom Range"
              value={filterState.activeFilter === 'Custom Range'}
              onValueChanged={(e) => {
                if (e.value) {
                  setFilterState(prev => ({
                    ...prev,
                    selectedDatePreset: '',
                    activeFilter: 'Custom Range'
                  }));
                }
              }}
              className="tw-mb-2"
            />
            <DateRangeBox
              value={filterState.customDateRange}
              onValueChanged={handleCustomDateRangeChange}
              disabled={filterState.activeFilter !== 'Custom Range'}
              width="100%"
              startDatePlaceholder="Start Date"
              endDatePlaceholder="End Date"
            />
          </div>
        </div>
      </ScrollView>

      <ToolbarItem
        widget="dxButton"
        toolbar="bottom"
        location="after"
        options={{
          text: "Cancel",
          icon: "close",
          type: "normal",
          stylingMode: "contained",
          onClick: onHiding,
        }}
      />
      <ToolbarItem
        widget="dxButton"
        toolbar="bottom"
        location="after"
        options={{
          text: "Apply Filter",
          icon: "check",
          type: "success",
          stylingMode: "contained",
          onClick: handleApplyFilter,
        }}
      />
    </Popup>
  );
};

export default FilterPopup;