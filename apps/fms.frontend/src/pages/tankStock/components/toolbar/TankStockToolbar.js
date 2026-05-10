import React, { useState, useCallback } from 'react';
import { Toolbar, Item as ToolbarItem } from 'devextreme-react/toolbar';
import { Button } from 'devextreme-react/button';
import { SelectBox } from 'devextreme-react/select-box';
import { CheckBox } from 'devextreme-react/check-box';
import { DateRangeBox } from 'devextreme-react/date-range-box';
import { Popup } from 'devextreme-react/popup';
import  notify  from 'devextreme/ui/notify';
import ScrollView from "devextreme-react/scroll-view";
import DropDownButton from "devextreme-react/drop-down-button";
import { DatePeriods } from "../../../../components/Shared/datePeriods";

// Form imports - these need to be adjusted based on actual location
import OpeningStockForm from '../../forms/OpeningStockForm';
import ClosingStockForm from '../../forms/ClosingStockForm';
import TankDeliveryForm from '../../forms/TankDeliveryForm';
import TankTransferForm from '../../forms/TankTransferForm';

const POPUP_CONFIG = {
  openingStock: {
    title: "Opening Stock",
    Form: OpeningStockForm,
    width: "100%",
    maxWidth: "800px",
    height: "auto",
  },
  closingStock: {
    title: "Closing Stock",
    Form: ClosingStockForm,
    width: "90%",
    maxWidth: "800px",
    height: "auto",
  },
  delivery: {
    title: "Delivery",
    Form: TankDeliveryForm,
    width: "100%",
    maxWidth: "1000px",
    height: "100%",
  },
  transfer: {
    title: "Transfer",
    Form: TankTransferForm,
    width: "90%",
    maxWidth: "800px",
    height: "auto",
  },
};

export const TankStockToolbar = ({
  title,
  additionalToolbarContent,
  children,
  onOpeningStockSubmit,
  onDeliverySubmit,
  onTransferSubmit,
  onClosingStockSubmit,
  sites = [],
  onRefresh,
  onSiteChange,
  selectedSite,
  isLoading,
  onDateRangeChange,
  onFilterChange,
}) => {
  const [popupVisibility, setPopupVisibility] = useState({
    openingStock: false,
    closingStock: false,
    delivery: false,
    transfer: false,
    filter: false,
  });

  const [currentForm, setCurrentForm] = useState(null);
  const [formData, setFormData] = useState({
    openingStock: {},
    closingStock: {},
    delivery: {},
    transfer: {},
  });

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

  const datePeriods = DatePeriods();

  const stockManagementItems = [
    {
      key: "openingStock",
      text: "Opening Stock",
      icon: "fa-light fa-lock-open",
      type: "default",
    },
    {
      key: "closingStock",
      text: "Closing Stock",
      icon: "fa-light fa-lock",
      type: "success",
    },
    {
      key: "delivery",
      text: "Delivery",
      icon: "fa-light fa-truck-fast",
      type: "normal",
    },
    {
      key: "transfer",
      text: "Transfer",
      icon: "fa-light fa-exchange",
      type: "normal",
    },
  ];

  const handleStockManagementClick = (e) => {
    handlePopupVisibility(e.itemData.key, true);
  };

  const handlePopupVisibility = useCallback((popupName, isVisible) => {
    setPopupVisibility((prev) => ({ ...prev, [popupName]: isVisible }));
    setCurrentForm(isVisible ? popupName : null);
  }, []);

  const handleFilterPopup = useCallback(() => {
    setPopupVisibility((prev) => ({ ...prev, filter: !prev.filter }));
  }, []);

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

  const handleSiteFilterChange = useCallback((e) => {
    setFilterState(prev => ({
      ...prev,
      selectedSite: e.value
    }));
  }, []);

  const handleApplyFilter = useCallback(() => {
    const { customDateRange, selectedSite } = filterState;

    if (onDateRangeChange) {
      onDateRangeChange(customDateRange);
    }

    if (onSiteChange) {
      onSiteChange({ value: selectedSite });
    }

    if (onFilterChange) {
      onFilterChange({
        dateRange: customDateRange,
        site: selectedSite,
        activeFilter: filterState.activeFilter
      });
    }

    setPopupVisibility(prev => ({ ...prev, filter: false }));
    notify("Filters applied successfully", "success", 2000);
  }, [filterState, onDateRangeChange, onSiteChange, onFilterChange]);

  const getFilterSummary = useCallback(() => {
    const { activeFilter, selectedSite, customDateRange } = filterState;
    const siteName = sites?.find(site => site.id === selectedSite)?.name || 'All Sites';

    if (activeFilter === 'Custom Range' && customDateRange.length === 2) {
      const startDate = customDateRange[0].toLocaleDateString();
      const endDate = customDateRange[1].toLocaleDateString();
      return `${siteName} | ${startDate} - ${endDate}`;
    }

    return `${siteName} | ${activeFilter}`;
  }, [filterState, sites]);

  const validateOpeningClosingStock = (data) => {
    if (!data.tankId || !data.amount || !data.date) {
      notify("Please fill in all required fields", "error", 3000);
      return false;
    }
    if (data.date > new Date()) {
      notify("Date cannot be in the future", "error", 3000);
      return false;
    }
    return true;
  };

  const validateDelivery = (data) => {
    if (
      !data.tankId ||
      !data.manualDeliveryAmount ||
      !data.date ||
      !data.product ||
      !data.stockBeforeDelivery ||
      !data.stockAfterDelivery
    ) {
      notify("Please fill in all required fields", "error", 3000);
      return false;
    }

    if (data.stockAfterDelivery < data.stockBeforeDelivery) {
      notify(
        "Stock after delivery cannot be less than stock before delivery",
        "error",
        3000
      );
      return false;
    }

    if (data.deliveryDate > new Date()) {
      notify("Delivery date cannot be in the future", "error", 3000);
      return false;
    }

    return true;
  };

  const validateTransfer = (data) => {
    if (
      !data.sourceTankId ||
      !data.destinationTankId ||
      !data.amount ||
      !data.date
    ) {
      notify("Please fill in all required fields", "error", 3000);
      return false;
    }

    if (data.date > new Date()) {
      notify("Transfer date cannot be in the future", "error", 3000);
      return false;
    }

    if (
      data.sourceSiteId === data.destinationSiteId &&
      data.sourceTankId === data.destinationTankId
    ) {
      notify("Source and destination tanks cannot be the same", "error", 3000);
      return false;
    }

    return true;
  };

  const updateFormData = useCallback((formType, data) => {
    setFormData((prev) => ({ ...prev, [formType]: data }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!currentForm) return;

    const currentFormData = formData[currentForm];
    let isValid = false;

    switch (currentForm) {
      case 'openingStock':
      case 'closingStock':
        isValid = validateOpeningClosingStock(currentFormData);
        if (isValid) {
          const handler = currentForm === 'openingStock' ? onOpeningStockSubmit : onClosingStockSubmit;
          if (handler) await handler(currentFormData);
        }
        break;
      case 'delivery':
        isValid = validateDelivery(currentFormData);
        if (isValid && onDeliverySubmit) {
          await onDeliverySubmit(currentFormData);
        }
        break;
      case 'transfer':
        isValid = validateTransfer(currentFormData);
        if (isValid && onTransferSubmit) {
          await onTransferSubmit(currentFormData);
        }
        break;
      default:
        isValid = false;
    }

    if (isValid) {
      handlePopupVisibility(currentForm, false);
      updateFormData(currentForm, {});
      notify("Operation completed successfully", "success", 2000);
    }
  }, [
    currentForm,
    formData,
    onOpeningStockSubmit,
    onClosingStockSubmit,
    onDeliverySubmit,
    onTransferSubmit,
    handlePopupVisibility,
    updateFormData,
  ]);

  const handleCancel = useCallback(() => {
    if (currentForm) {
      handlePopupVisibility(currentForm, false);
      updateFormData(currentForm, {});
    }
  }, [currentForm, handlePopupVisibility, updateFormData]);

  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  const siteOptions = [{ id: "all", name: "All Sites" }, ...(sites || [])];

  const submitButtonOptions = useCallback(
    () => ({
      text: "Submit",
      icon: "save",
      type: "success",
      stylingMode: "contained",
      useSubmitBehavior: true,
      onClick: handleSubmit,
      disabled: isLoading,
    }),
    [handleSubmit, isLoading]
  );

  const renderFilterPopup = () => (
    <Popup
      visible={popupVisibility.filter}
      onHiding={() => setPopupVisibility(prev => ({ ...prev, filter: false }))}
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
          onClick: () => setPopupVisibility(prev => ({ ...prev, filter: false })),
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

  const renderPopups = () => {
    return Object.keys(POPUP_CONFIG).map((popupKey) => {
      const config = POPUP_CONFIG[popupKey];
      const { Form } = config;

      return (
        <Popup
          key={popupKey}
          visible={popupVisibility[popupKey]}
          onHiding={() => handlePopupVisibility(popupKey, false)}
          dragEnabled={false}
          showTitle={true}
          title={config.title}
          showCloseButton={true}
          width={config.width}
          height={config.height}
          maxWidth={config.maxWidth}
          position={{ my: "center", at: "center", of: window }}
        >
          <Form
            data={formData[popupKey]}
            onChange={(data) => updateFormData(popupKey, data)}
            sites={sites}
          />

          <ToolbarItem
            widget="dxButton"
            toolbar="bottom"
            location="after"
            options={{
              text: "Cancel",
              icon: "close",
              type: "normal",
              stylingMode: "contained",
              onClick: handleCancel,
            }}
          />
          <ToolbarItem
            widget="dxButton"
            toolbar="bottom"
            location="after"
            options={submitButtonOptions()}
          />
        </Popup>
      );
    });
  };

  return (
    <div className="view-wrapper view-wrapper-dashboard">
      <Toolbar className="theme-dependent">
        <ToolbarItem location="before">
          <span className="toolbar-header" style={{ paddingLeft: "10px" }}>
            {title}
          </span>
        </ToolbarItem>

        {additionalToolbarContent}

        <ToolbarItem location="after">
          <DropDownButton
            text="Manage Stocks"
            icon="add"
            type="success"
            items={stockManagementItems}
            onItemClick={handleStockManagementClick}
            displayExpr="text"
            keyExpr="key"
            stylingMode="contained"
          />
        </ToolbarItem>

        <ToolbarItem location="after">
          <div className="tw-flex tw-items-center tw-gap-2">
            <span className="tw-text-xs tw-text-gray-600 tw-max-w-xs tw-truncate" title={getFilterSummary()}>
              {getFilterSummary()}
            </span>
            <Button
              text="Filter"
              icon="fa-light fa-filter"
              stylingMode="outlined"
              onClick={handleFilterPopup}
              type="normal"
            />
          </div>
        </ToolbarItem>

        <ToolbarItem
          location="after"
          locateInMenu="auto"
          widget="dxButton"
          showText="inMenu"
        >
          <Button
            text="Refresh"
            icon="refresh"
            stylingMode="text"
            onClick={handleRefresh}
            disabled={isLoading}
          />
        </ToolbarItem>
      </Toolbar>
      {children}
      {renderPopups()}
      {renderFilterPopup()}
    </div>
  );
};

export default TankStockToolbar;
