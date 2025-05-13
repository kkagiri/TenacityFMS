import React from "react";
import { SelectBox } from "devextreme-react/select-box";
//claude - created filter component for dashboard

export const DashboardFilters = ({
  sites,
  selectedSite,
  setSelectedSite,
  selectedTimeframe,
  setSelectedTimeframe,
  selectedVehicleType,
  setSelectedVehicleType,
}) => {
  const timeframeOptions = [
    { value: "day", text: "Day" },
    { value: "week", text: "Week" },
    { value: "month", text: "Month" },
  ];

  const vehicleTypeOptions = [
    { value: "all", text: "All Types" },
    { value: "TEX", text: "TEX" },
    { value: "WEX", text: "WEX" },
    { value: "BHL", text: "BHL" },
    { value: "MG", text: "MG" },
    { value: "SB", text: "SB" },
    { value: "TP", text: "TP" },
    { value: "PM", text: "PM" },
    { value: "PickUP", text: "PickUP" },
  ];

  const siteOptions = [
    { value: "all", text: "All Sites" },
    ...sites.map((site) => ({ value: site.id.toString(), text: site.name })),
  ];

  return (
    <div className="filters-container">
      <div>
        <SelectBox
          dataSource={siteOptions}
          value={selectedSite}
          onValueChanged={(e) => setSelectedSite(e.value)}
          width={180}
          placeholder="Select Site"
        />
      </div>
      <div>
        <SelectBox
          dataSource={timeframeOptions}
          value={selectedTimeframe}
          onValueChanged={(e) => setSelectedTimeframe(e.value)}
          width={180}
          placeholder="Select Timeframe"
        />
      </div>
      <div>
        <SelectBox
          dataSource={vehicleTypeOptions}
          value={selectedVehicleType}
          onValueChanged={(e) => setSelectedVehicleType(e.value)}
          width={180}
          placeholder="Vehicle Type"
        />
      </div>
    </div>
  );
};
