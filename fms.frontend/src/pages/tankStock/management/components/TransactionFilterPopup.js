import React, { useState, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Popup } from "devextreme-react/popup";
import { Form, SimpleItem, Label } from "devextreme-react/form";
import Button from "devextreme-react/button";
import { ScrollView } from "devextreme-react/scroll-view";
import { fetchUsersForFilter } from "../../../../redux/actions/userActions";

const TransactionFilterPopup = ({
  visible,
  onHiding,
  currentFilters,
  onApplyFilters,
}) => {
  const dispatch = useDispatch();
  const sites = useSelector((state) => state.site.sites);
  const tanks = useSelector((state) => state.tank.tanks);
  const usersForFilter = useSelector((state) => state.user.usersForFilter);

  const [filters, setFilters] = useState({
    siteId: null,
    tankId: null,
    recordedBy: null,
    startDate: null,
    endDate: null,
  });

  const [filteredTanks, setFilteredTanks] = useState([]);

  // Initialize filters when popup opens
  useEffect(() => {
    if (visible && currentFilters) {
      setFilters({
        siteId: currentFilters.siteId || null,
        tankId: currentFilters.tankId || null,
        recordedBy: currentFilters.recordedBy || null,
        startDate: currentFilters.startDate
          ? new Date(currentFilters.startDate)
          : null,
        endDate: currentFilters.endDate
          ? new Date(currentFilters.endDate)
          : null,
      });

      // Load users for filter dropdown
      dispatch(fetchUsersForFilter());
    }
  }, [visible, currentFilters, dispatch]);

  // Filter tanks based on selected site
  useEffect(() => {
    if (filters.siteId) {
      setFilteredTanks(tanks.filter((tank) => tank.siteId === filters.siteId));
    } else {
      setFilteredTanks(tanks);
    }
  }, [filters.siteId, tanks]);

  const handleSiteChange = useCallback((e) => {
    setFilters((prev) => ({
      ...prev,
      siteId: e.value,
      tankId: null, // Reset tank when site changes
    }));
  }, []);

  const handleFieldChange = useCallback(
    (field) => (e) => {
      setFilters((prev) => ({
        ...prev,
        [field]: e.value,
      }));
    },
    []
  );

  const handleApply = useCallback(() => {
    const filterParams = {
      siteId: filters.siteId,
      tankId: filters.tankId,
      recordedBy: filters.recordedBy,
      startDate: filters.startDate?.toISOString(),
      endDate: filters.endDate?.toISOString(),
      includeVehicleNames: true,
    };

    console.log("Applying filters from popup:", filterParams);

    // Close popup immediately, then apply filters
    onHiding();
    onApplyFilters(filterParams);
  }, [filters, onApplyFilters, onHiding]);

  const handleReset = useCallback(() => {
    setFilters({
      siteId: null,
      tankId: null,
      recordedBy: null,
      startDate: null,
      endDate: null,
    });
  }, []);

  const handleQuickFilter = useCallback((days) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    setFilters((prev) => ({
      ...prev,
      startDate,
      endDate,
    }));
  }, []);

  return (
    <Popup
      visible={visible}
      onHiding={onHiding}
      dragEnabled={false}
      showTitle={true}
      title="Filter Transaction History"
      width="90%"
      maxWidth={600}
      height={500} // Fixed height to enable scrolling
      showCloseButton={true}
      className="transaction-filter-popup"
    >
      {/* Use ScrollView with fixed height, fallback to native scroll if needed */}
      <ScrollView height={440}>
        <div className="tw-p-4">
          {/* Header */}
          <div className="tw-mb-6">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-2 tw-flex tw-items-center">
              <i className="fa-light fa-filter tw-mr-2 tw-text-blue-600"></i>
              Filter Options
            </h3>
            <p className="tw-text-gray-600 tw-text-sm">
              Set filters to narrow down transaction history results
            </p>
          </div>

          {/* Quick Date Filters */}
          <div className="tw-mb-6">
            <h4 className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-3">
              Quick Date Ranges
            </h4>
            <div className="tw-flex tw-flex-wrap tw-gap-2">
              <Button
                text="Today"
                onClick={() => handleQuickFilter(1)}
                stylingMode="outlined"
                className="tw-text-xs"
              />
              <Button
                text="Last 3 Days"
                onClick={() => handleQuickFilter(3)}
                stylingMode="outlined"
                className="tw-text-xs"
              />
              <Button
                text="Last Week"
                onClick={() => handleQuickFilter(7)}
                stylingMode="outlined"
                className="tw-text-xs"
              />
              <Button
                text="Last Month"
                onClick={() => handleQuickFilter(30)}
                stylingMode="outlined"
                className="tw-text-xs"
              />
            </div>
          </div>

          {/* Filter Form */}
          <Form
            formData={filters}
            showColonAfterLabel={true}
            labelLocation="top"
            colCount={2}
            className="tw-mb-6"
          >
            <SimpleItem
              dataField="siteId"
              editorType="dxSelectBox"
              editorOptions={{
                items: [{ id: null, name: "All Sites" }, ...(sites || [])],
                displayExpr: "name",
                valueExpr: "id",
                onValueChanged: handleSiteChange,
                value: filters.siteId,
                placeholder: "Select site",
                width: "100%",
              }}
            >
              <Label text="Site" />
            </SimpleItem>

            <SimpleItem
              dataField="tankId"
              editorType="dxSelectBox"
              editorOptions={{
                items: [{ id: null, name: "All Tanks" }, ...filteredTanks],
                displayExpr: "name",
                valueExpr: "id",
                onValueChanged: handleFieldChange("tankId"),
                value: filters.tankId,
                placeholder: "Select tank",
                width: "100%",
                disabled: !filters.siteId,
              }}
            >
              <Label text="Tank" />
            </SimpleItem>

            <SimpleItem
              dataField="recordedBy"
              editorType="dxSelectBox"
              editorOptions={{
                items: [
                  { id: null, userName: "All Users" },
                  ...(usersForFilter || []),
                ],
                displayExpr: "userName",
                valueExpr: "id",
                onValueChanged: handleFieldChange("recordedBy"),
                value: filters.recordedBy,
                placeholder: "Select user",
                width: "100%",
              }}
            >
              <Label text="Recorded By" />
            </SimpleItem>

            <SimpleItem
              dataField="startDate"
              editorType="dxDateBox"
              editorOptions={{
                value: filters.startDate,
                max: new Date(),
                displayFormat: "yyyy-MM-dd",
                type: "date",
                onValueChanged: handleFieldChange("startDate"),
                width: "100%",
              }}
            >
              <Label text="Start Date" />
            </SimpleItem>

            <SimpleItem
              dataField="endDate"
              editorType="dxDateBox"
              editorOptions={{
                value: filters.endDate,
                max: new Date(),
                displayFormat: "yyyy-MM-dd",
                type: "date",
                onValueChanged: handleFieldChange("endDate"),
                width: "100%",
              }}
            >
              <Label text="End Date" />
            </SimpleItem>
          </Form>

          {/* Current Filter Summary */}
          {(filters.siteId ||
            filters.tankId ||
            filters.recordedBy ||
            filters.startDate ||
            filters.endDate) && (
            <div className="tw-mb-6 tw-p-3 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg">
              <h4 className="tw-text-sm tw-font-medium tw-text-blue-800 tw-mb-2">
                Current Filters
              </h4>
              <div className="tw-text-xs tw-text-blue-700">
                {filters.siteId && (
                  <div>
                    Site:{" "}
                    {sites?.find((s) => s.id === filters.siteId)?.name ||
                      "Unknown"}
                  </div>
                )}
                {filters.tankId && (
                  <div>
                    Tank:{" "}
                    {filteredTanks?.find((t) => t.id === filters.tankId)
                      ?.name || "Unknown"}
                  </div>
                )}
                {filters.startDate && (
                  <div>From: {filters.startDate.toLocaleDateString()}</div>
                )}
                {filters.endDate && (
                  <div>To: {filters.endDate.toLocaleDateString()}</div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="tw-flex tw-justify-between tw-space-x-3">
            <Button
              text="Reset"
              onClick={handleReset}
              stylingMode="outlined"
              className="tw-min-w-24"
            >
              <i className="fa-light fa-refresh tw-mr-2"></i>
              Reset
            </Button>

            <div className="tw-flex tw-space-x-3">
              <Button
                text="Cancel"
                onClick={onHiding}
                stylingMode="outlined"
                className="tw-min-w-24"
              >
                <i className="fa-light fa-times tw-mr-2"></i>
                Cancel
              </Button>
              <Button
                text="Apply Filters"
                onClick={handleApply}
                type="default"
                className="tw-min-w-32"
              >
                <i className="fa-light fa-check tw-mr-2"></i>
                Apply
              </Button>
            </div>
          </div>
        </div>
      </ScrollView>
    </Popup>
  );
};

export default TransactionFilterPopup;
