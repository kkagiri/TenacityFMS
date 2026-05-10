/**
 * File: TransactionFilterPopup.js
 * Purpose: Provides a configurable popup form for filtering tank transaction history
 *          with site, tank, user, and date range criteria.
 * Dependencies: react, react-redux, devextreme-react Popup/Form/Button/ScrollView components,
 *               fetchUsersForFilter action.
 * Last Modified: 2025-11-04
 *
 * Key Components:
 * - TransactionFilterPopup: Renders the popup UI, manages local filter state, and
 *   communicates filter selections back to the parent component.
 */
import React, { useState, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Popup } from "devextreme-react/popup";
import { Form, SimpleItem, Label } from "devextreme-react/form";
import Button from "devextreme-react/button";
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
      width="100%"
      maxWidth={780}
      height="90vh"
      showCloseButton={true}
      className="transaction-filter-popup"
    >
      <div className="transaction-filter-popup__container">
        {/* Fixed Header */}
        <div className="transaction-filter-popup__header">
          <div className="tw-mb-2">
            <h3 className="tw-text-base tw-font-semibold tw-text-gray-800 tw-mb-0 tw-flex tw-items-center">
              <i className="fa-light fa-filter tw-mr-2 tw-text-blue-600"></i>
              Filter Options
            </h3>
            <p className="tw-text-gray-600 tw-text-xs tw-mt-0.5">
              Set filters to narrow down transaction history results
            </p>
          </div>

          {/* Current Filter Summary - Fixed at top */}
          {(filters.siteId ||
            filters.tankId ||
            filters.recordedBy ||
            filters.startDate ||
            filters.endDate) && (
            <div className="tw-p-2 tw-bg-blue-50 tw-border tw-border-blue-100 tw-rounded-lg">
              <h4 className="tw-text-xs tw-font-medium tw-text-blue-800 tw-mb-1">
                Current Filters
              </h4>
              <div className="tw-flex tw-flex-wrap tw-gap-x-4 tw-gap-y-1 tw-text-xs tw-text-blue-700">
                {filters.siteId && (
                  <div>
                    <span className="tw-font-semibold">Site:</span>{" "}
                    {sites?.find((s) => s.id === filters.siteId)?.name ||
                      "Unknown"}
                  </div>
                )}
                {filters.tankId && (
                  <div>
                    <span className="tw-font-semibold">Tank:</span>{" "}
                    {filteredTanks?.find((t) => t.id === filters.tankId)
                      ?.name || "Unknown"}
                  </div>
                )}
                {filters.recordedBy && (
                  <div>
                    <span className="tw-font-semibold">User:</span>{" "}
                    {usersForFilter?.find((u) => u.id === filters.recordedBy)
                      ?.userName || "Unknown"}
                  </div>
                )}
                {filters.startDate && (
                  <div>
                    <span className="tw-font-semibold">From:</span>{" "}
                    <span className="tw-text-blue-900">
                      {filters.startDate.toLocaleDateString()}
                    </span>
                  </div>
                )}
                {filters.endDate && (
                  <div>
                    <span className="tw-font-semibold">To:</span>{" "}
                    <span className="tw-text-blue-900">
                      {filters.endDate.toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="transaction-filter-popup__content">
          {/* Quick Date Filters */}
          <div className="tw-mb-6">
            <h4 className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-3">
              Quick Date Ranges
            </h4>
            <div className="transaction-filter-popup__quick-dates">
              <Button
                text="Today"
                icon="fa-light fa-calendar-day"
                type="default"
                stylingMode="outlined"
                onClick={() => handleQuickFilter(1)}
                className="transaction-filter-popup__quick-date-btn transaction-filter-popup__quick-date-btn--first"
              />
              <Button
                text="Last 3 Days"
                icon="fa-light fa-calendar-days"
                type="default"
                stylingMode="outlined"
                onClick={() => handleQuickFilter(3)}
                className="transaction-filter-popup__quick-date-btn"
              />
              <Button
                text="Last Week"
                icon="fa-light fa-calendar-week"
                type="default"
                stylingMode="outlined"
                onClick={() => handleQuickFilter(7)}
                className="transaction-filter-popup__quick-date-btn"
              />
              <Button
                text="Last Month"
                icon="fa-light fa-calendar-range"
                type="default"
                stylingMode="outlined"
                onClick={() => handleQuickFilter(30)}
                className="transaction-filter-popup__quick-date-btn transaction-filter-popup__quick-date-btn--last"
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
        </div>

        {/* Fixed Footer with Action Buttons */}
        <div className="transaction-filter-popup__footer">
          <div className="tw-flex tw-gap-3 tw-flex-1">
            <Button
              text="Cancel"
              icon="fa-light fa-times"
              onClick={onHiding}
              stylingMode="outlined"
              className="tw-flex-1 tw-min-w-0"
            />
            <Button
              text="Reset"
              icon="fa-light fa-refresh"
              onClick={handleReset}
              stylingMode="outlined"
              className="tw-flex-1 tw-min-w-0"
            />
          </div>

          <Button
            text="Apply Filters"
            icon="fa-light fa-check"
            onClick={handleApply}
            type="default"
            className="tw-flex-1 tw-min-w-0"
          />
        </div>
      </div>
    </Popup>
  );
};

export default TransactionFilterPopup;
