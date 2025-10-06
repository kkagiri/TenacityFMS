/**
 * File: QuickActions.js
 * Purpose: Provide a centralized launcher for tank stock management forms, coordinating popup state and shared datasets.
 * Dependencies: React, Redux Toolkit, DevExtreme DropDownButton/Popup, tankActions, siteActions
 * Last Modified: 2025-10-06
 *
 * Key Functions/Components:
 * - QuickActions: Hosts the stock management dropdown and ensures forms receive preloaded site/tank data
 * - handleStockSubmit: Standardizes success handling across forms
 * - renderPopup: Renders the active form within a shared popup wrapper
 */
import React, { useState, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DropDownButton } from "devextreme-react/drop-down-button";
import { Popup } from "devextreme-react/popup";
import notify from "devextreme/ui/notify";
// import TankStockErrorHandler from '../../../utils/tankStockErrorHandler';
import "./QuickActions.scss";

// Form imports
import OpeningStockForm from "../forms/OpeningStockForm";
import ClosingStockForm from "../forms/ClosingStockForm";
import TankDeliveryForm from "../forms/TankDeliveryForm";
import TankTransferForm from "../forms/TankTransferForm";
import ManualRefillForm from "../forms/ManualRefillForm";

// API actions
// Note: Forms handle their own dispatching. QuickActions only coordinates UI.
import { fetchSiteList } from "../../../redux/actions/siteActions";
import { fetchTanks } from "../../../redux/actions/tankActions";

const POPUP_CONFIG = {
  openingStock: {
    title: "Opening Stock",
    Form: OpeningStockForm,
    width: "90%",
    maxWidth: "650px",
    // Use viewport-relative height to allow internal scrolling
    maxHeight: "80vh",
    height: "auto",
  },
  closingStock: {
    title: "Closing Stock",
    Form: ClosingStockForm,
    width: "90%",
    maxWidth: "600px",
    maxHeight: "80vh",
    height: "auto",
  },
  delivery: {
    title: "Delivery",
    Form: TankDeliveryForm,
    width: "95%",
    maxWidth: "1000px",
    maxHeight: "80vh",
    height: "auto",
  },
  transfer: {
    title: "Transfer",
    Form: TankTransferForm,
    width: "90%",
    maxWidth: "800px",
    maxHeight: "80vh",
    height: "auto",
  },
  manualRefill: {
    title: "Manual Refill",
    Form: ManualRefillForm,
    width: "90%",
    maxWidth: "700px",
    maxHeight: "85vh",

    height: "auto",
  },
};

const QuickActions = ({ collapsed = false, onRefreshData }) => {
  const dispatch = useDispatch();
  const sitesState = useSelector((state) => state.site.sites || []);
  const sitesLoading = useSelector((state) => state.site.loading);
  const tanksState = useSelector((state) => state.tank.tanks || []);
  const tanksLoading = useSelector((state) => state.tank.loading);
  const user = useSelector((state) => state.auth.user);

  const sites = sitesState || [];
  const tanks = tanksState || [];

  useEffect(() => {
    if (sites.length === 0) {
      dispatch(fetchSiteList());
    }
  }, [dispatch, sites.length]);

  useEffect(() => {
    if (tanks.length === 0) {
      dispatch(fetchTanks());
    }
  }, [dispatch, tanks.length]);

  const [popupVisibility, setPopupVisibility] = useState({
    openingStock: false,
    closingStock: false,
    delivery: false,
    transfer: false,
    manualRefill: false,
  });

  const [currentForm, setCurrentForm] = useState(null);
  const [prefilledFormData, setPrefilledFormData] = useState(null);
  // Local submit state handled by forms

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
    {
      key: "manualRefill",
      text: "Manual Refill",
      icon: "fa-light fa-book",
      type: "normal",
    },
  ];

  const handleStockManagementClick = useCallback((e) => {
    const actionKey = e.itemData.key;
    setCurrentForm(actionKey);
    setPopupVisibility((prev) => ({ ...prev, [actionKey]: true }));
  }, []);

  const handlePopupVisibility = useCallback((popupName, isVisible) => {
    setPopupVisibility((prev) => ({ ...prev, [popupName]: isVisible }));
    if (!isVisible) {
      setCurrentForm(null);
      setPrefilledFormData(null); // Clear prefilled data when closing
    }
  }, []);

  // Forms dispatch themselves; onSubmit here means success -> close & refresh
  const handleStockSubmit = useCallback(
    (formData, actionType) => {
      // Close popup on success
      handlePopupVisibility(currentForm, false);
      // Optional toast
      const actionTypeDisplay =
        actionType && typeof actionType === "string"
          ? actionType.charAt(0).toUpperCase() + actionType.slice(1)
          : "Stock";

      // Special message for closing stock created from opening stock validation
      let message = `${actionTypeDisplay} saved`;
      if (prefilledFormData?.reason && actionType === "closing") {
        message =
          "Required closing stock created successfully. You can now create your opening stock.";
      }

      notify({ message, type: "success", displayTime: 3000 });
      // Refresh parent data if provided
      if (onRefreshData) onRefreshData();
    },
    [currentForm, onRefreshData, handlePopupVisibility, prefilledFormData]
  );

  const handleOpeningStockSubmit = useCallback(
    (formData) => handleStockSubmit(formData, "opening"),
    [handleStockSubmit]
  );

  const handleClosingStockSubmit = useCallback(
    (formData) => handleStockSubmit(formData, "closing"),
    [handleStockSubmit]
  );

  const handleDeliverySubmit = useCallback(
    (formData) => handleStockSubmit(formData, "delivery"),
    [handleStockSubmit]
  );

  const handleTransferSubmit = useCallback(
    (formData) => handleStockSubmit(formData, "transfer"),
    [handleStockSubmit]
  );

  const handleManualRefillSubmit = useCallback(
    (formData) => handleStockSubmit(formData, "manualRefill"),
    [handleStockSubmit]
  );

  // Enhanced cancel handler to support form navigation
  const handleFormCancel = useCallback(
    (action, actionData) => {
      if (action === "create-closing-stock" && actionData) {
        // Close current form and open closing stock form with pre-filled data
        handlePopupVisibility(currentForm, false);

        // Set form data for closing stock
        setPrefilledFormData(actionData);
        setCurrentForm("closingStock");
        setPopupVisibility((prev) => ({ ...prev, closingStock: true }));

        // Show notification about the transition
        if (actionData.reason) {
          notify({
            message: "Opening closing stock form with required information.",
            type: "info",
            displayTime: 3000,
          });
        }
      } else {
        // Normal cancel - just close the popup
        setPrefilledFormData(null);
        handlePopupVisibility(currentForm, false);
      }
    },
    [currentForm, handlePopupVisibility]
  );

  const renderPopup = () => {
    if (!currentForm) return null;

    const config = POPUP_CONFIG[currentForm];
    const FormComponent = config.Form;

    let submitHandler;
    switch (currentForm) {
      case "openingStock":
        submitHandler = handleOpeningStockSubmit;
        break;
      case "closingStock":
        submitHandler = handleClosingStockSubmit;
        break;
      case "delivery":
        submitHandler = handleDeliverySubmit;
        break;
      case "transfer":
        submitHandler = handleTransferSubmit;
        break;
      case "manualRefill":
        submitHandler = handleManualRefillSubmit;
        break;
      default:
        submitHandler = () => {};
    }

    return (
      <Popup
        visible={popupVisibility[currentForm]}
        onHiding={() => handlePopupVisibility(currentForm, false)}
        title={config.title}
        width={config.width}
        maxWidth={config.maxWidth}
        maxHeight={config.maxHeight}
        height={config.height}
        showCloseButton={true}
        dragEnabled={true}
        resizeEnabled={false}
        position={{ my: "center", at: "center", of: window }}
        wrapperAttr={{
          class: "stock-management-popup",
        }}
      >
        <FormComponent
          onSubmit={submitHandler}
          isLoading={sitesLoading || tanksLoading}
          sites={sites}
          tanks={tanks}
          user={user}
          onCancel={handleFormCancel}
          prefilledData={
            currentForm === "closingStock" ? prefilledFormData : undefined
          }
        />
      </Popup>
    );
  };

  if (collapsed) {
    return (
      <div className="quick-actions-container tw-flex tw-justify-center">
        <DropDownButton
          icon="fa-light fa-plus"
          dropDownOptions={{
            width: 200,
          }}
          items={stockManagementItems}
          onItemClick={handleStockManagementClick}
          splitButton={false}
          useSelectMode={false}
          stylingMode="outlined"
          elementAttr={{
            title: "Stock Management Actions",
          }}
        />
        {renderPopup()}
      </div>
    );
  }

  return (
    <div className="quick-actions-container">
      <DropDownButton
        text="Stock Management"
        icon="fa-light fa-plus"
        dropDownOptions={{
          width: 250,
        }}
        items={stockManagementItems}
        onItemClick={handleStockManagementClick}
        splitButton={false}
        useSelectMode={false}
        stylingMode="contained"
        type="default"
        elementAttr={{
          title: "Stock Management Actions",
        }}
      />
      {renderPopup()}
    </div>
  );
};

export default QuickActions;
