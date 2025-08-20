import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { DropDownButton } from 'devextreme-react/drop-down-button';
import { Popup } from 'devextreme-react/popup';
import notify from 'devextreme/ui/notify';
// import TankStockErrorHandler from '../../../utils/tankStockErrorHandler';
import './QuickActions.scss';

// Form imports
import OpeningStockForm from '../forms/OpeningStockForm';
import ClosingStockForm from '../forms/ClosingStockForm';
import TankDeliveryForm from '../forms/TankDeliveryForm';
import TankTransferForm from '../forms/TankTransferForm';
import ManualRefillForm from '../forms/ManualRefillForm';

// API actions
// Note: Forms handle their own dispatching. QuickActions only coordinates UI.

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
  }
};

const QuickActions = ({ collapsed = false, onRefreshData }) => {
  // const dispatch = useDispatch();
  const sites = useSelector((state) => state.site.sites);
  const user = useSelector((state) => state.auth.user);

  const [popupVisibility, setPopupVisibility] = useState({
    openingStock: false,
    closingStock: false,
    delivery: false,
    transfer: false,
    manualRefill: false,
  });

  const [currentForm, setCurrentForm] = useState(null);
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
      icon: "fa-light fa-fuel-pump",
      type: "normal",
    }
  ];




  const handleStockManagementClick = useCallback((e) => {
    const actionKey = e.itemData.key;
    setCurrentForm(actionKey);
    setPopupVisibility(prev => ({ ...prev, [actionKey]: true }));
  }, []);

  const handlePopupVisibility = useCallback((popupName, isVisible) => {
    setPopupVisibility(prev => ({ ...prev, [popupName]: isVisible }));
    if (!isVisible) {
      setCurrentForm(null);
    }
  }, []);

  // Forms dispatch themselves; onSubmit here means success -> close & refresh
  const handleStockSubmit = useCallback((formData, actionType) => {
    // Close popup on success
    handlePopupVisibility(currentForm, false);
    // Optional toast
    const actionTypeDisplay = actionType && typeof actionType === 'string'
      ? actionType.charAt(0).toUpperCase() + actionType.slice(1)
      : 'Stock';
    notify({ message: `${actionTypeDisplay} saved`, type: 'success', displayTime: 2000 });
    // Refresh parent data if provided
    if (onRefreshData) onRefreshData();
  }, [currentForm, onRefreshData, handlePopupVisibility]);

  const handleOpeningStockSubmit = useCallback((formData) =>
    handleStockSubmit(formData, 'opening'), [handleStockSubmit]);

  const handleClosingStockSubmit = useCallback((formData) =>
    handleStockSubmit(formData, 'closing'), [handleStockSubmit]);

  const handleDeliverySubmit = useCallback((formData) =>
    handleStockSubmit(formData, 'delivery'), [handleStockSubmit]);

  const handleTransferSubmit = useCallback((formData) =>
    handleStockSubmit(formData, 'transfer'), [handleStockSubmit]);

  const handleManualRefillSubmit = useCallback((formData) =>
    handleStockSubmit(formData, 'manualRefill'), [handleStockSubmit]);

  const renderPopup = () => {
    if (!currentForm) return null;

    const config = POPUP_CONFIG[currentForm];
    const FormComponent = config.Form;

    let submitHandler;
    switch (currentForm) {
      case 'openingStock':
        submitHandler = handleOpeningStockSubmit;
        break;
      case 'closingStock':
        submitHandler = handleClosingStockSubmit;
        break;
      case 'delivery':
        submitHandler = handleDeliverySubmit;
        break;
      case 'transfer':
        submitHandler = handleTransferSubmit;
        break;
      case 'manualRefill':
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
        position={{ my: 'center', at: 'center', of: window }}
        wrapperAttr={{
          class: 'stock-management-popup'
        }}
      >
        <FormComponent
          onSubmit={submitHandler}
          isLoading={false}
          sites={sites}
          user={user}
          onCancel={() => handlePopupVisibility(currentForm, false)}
        />
      </Popup>
    );
  };

  if (collapsed) {
    return (
      <div className="tw-flex tw-justify-center">
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
            title: "Stock Management Actions"
          }}
        />
        {renderPopup()}
      </div>
    );
  }

  return (
    <div className="tw-w-full">
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
        width="100%"
      />
      {renderPopup()}
    </div>
  );
};

export default QuickActions;
