import React, { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Button, Popup } from 'devextreme-react';
import { ToolbarItem } from 'devextreme-react/popup';
import OpeningStockForm from './forms/OpeningStockForm';
import ClosingStockForm from './forms/ClosingStockForm';
import TankDeliveryForm from './forms/TankDeliveryForm';
import TankTransferForm from './forms/TankTransferForm';
import {
  createTankTransfer
} from "../../redux/actions/tankStockAction";
import { createOpeningStock } from "../../redux/actions/OpeningStockActions";
import { createClosingStock } from "../../redux/actions/ClosingStockActions";
import { createDelivery } from "../../redux/actions/DeliveryActions";
import {
  prepareOpeningClosingStockParams,
  prepareDeliveryDTO,
  prepareTankTransferDTO
} from "../../utils/stockDataPreparation";
import notify from "devextreme/ui/notify";

const TestFormsPage = () => {
  const dispatch = useDispatch();
  const [popupVisibility, setPopupVisibility] = useState({
    openingStock: false,
    closingStock: false,
    delivery: false,
    transfer: false,
  });
  const [formData, setFormData] = useState({
    openingStock: {},
    closingStock: {},
    delivery: {},
    transfer: {},
  });
  const [isLoading, setIsLoading] = useState(false);

  const handlePopupVisibility = useCallback((formType, isVisible) => {
    setPopupVisibility(prev => ({ ...prev, [formType]: isVisible }));
  }, []);

  const updateFormData = useCallback((formType, data) => {
    setFormData(prev => ({ ...prev, [formType]: data }));
  }, []);

  const validateForm = useCallback((formType, data) => {
    switch (formType) {
      case 'openingStock':
      case 'closingStock':
        return data.tankId && data.amount && data.date;
      case 'delivery':
        return data.tankId && data.deliveryAmount && data.deliveryDate && data.supplierId;
      case 'transfer':
        return data.sourceTankId && data.destinationTankId && data.amount && data.date;
      default:
        return false;
    }
  }, []);

  const handleSubmit = useCallback(async (formType) => {
    const currentFormData = formData[formType];

    if (!validateForm(formType, currentFormData)) {
      notify('Please fill in all required fields', 'error', 3000);
      return;
    }

    setIsLoading(true);

    try {
      let action, prepareData, isQuery, successMessage;

      switch (formType) {
        case 'openingStock':
          action = createOpeningStock;
          prepareData = prepareOpeningClosingStockParams;
          isQuery = true;
          successMessage = 'Opening stock added successfully';
          break;
        case 'closingStock':
          action = createClosingStock;
          prepareData = prepareOpeningClosingStockParams;
          isQuery = true;
          successMessage = 'Closing stock added successfully';
          break;
        case 'delivery':
          action = createDelivery;
          prepareData = prepareDeliveryDTO;
          isQuery = false;
          successMessage = 'Delivery added successfully';
          break;
        case 'transfer':
          action = createTankTransfer;
          prepareData = prepareTankTransferDTO;
          isQuery = false;
          successMessage = 'Transfer added successfully';
          break;
        default:
          throw new Error('Invalid form type');
      }

      const preparedData = prepareData(currentFormData);
      let response;

      if (isQuery) {
        // For FromQuery parameters
        response = await dispatch(action(preparedData.tankId, preparedData.amount, preparedData.date));
      } else {
        // For FromBody DTOs
        response = await dispatch(action(preparedData));
      }

      if (response.success) {
        notify(response.message || successMessage, 'success', 3000);
        handlePopupVisibility(formType, false);
        // Reset form data
        setFormData(prev => ({ ...prev, [formType]: {} }));
      } else {
        notify(response.message || 'Operation failed', 'error', 5000);
      }
    } catch (error) {
      console.error(`Error in ${formType} submission:`, error);
      notify('An unexpected error occurred', 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  }, [formData, dispatch, validateForm, handlePopupVisibility]);

  const renderForm = useCallback((formType) => {
    const FormComponent = {
      openingStock: OpeningStockForm,
      closingStock: ClosingStockForm,
      delivery: TankDeliveryForm,
      transfer: TankTransferForm,
    }[formType];

    const titles = {
      openingStock: 'Opening Stock',
      closingStock: 'Closing Stock',
      delivery: 'Delivery',
      transfer: 'Transfer',
    };

    return (
      <Popup
        visible={popupVisibility[formType]}
        onHiding={() => handlePopupVisibility(formType, false)}
        dragEnabled={false}
        showTitle={true}
        title={titles[formType]}
        showCloseButton={true}
        width="90%"
        maxWidth="800px"
        height="90%"
        position={{ my: "center", at: "center", of: window }}
      >
        <FormComponent
          updateFormData={(data) => updateFormData(formType, data)}
          isLoading={isLoading}
          onSubmit={() => handleSubmit(formType)}
          onCancel={() => handlePopupVisibility(formType, false)}
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
            onClick: () => handlePopupVisibility(formType, false),
          }}
        />
        <ToolbarItem
          widget="dxButton"
          toolbar="bottom"
          location="after"
          options={{
            text: "Submit",
            icon: "save",
            type: "success",
            stylingMode: "contained",
            onClick: () => handleSubmit(formType),
            disabled: isLoading,
          }}
        />
      </Popup>
    );
  }, [popupVisibility, isLoading, handlePopupVisibility, updateFormData, handleSubmit]);

  return (
    <div className="tw-p-6">
      <h1 className="tw-text-2xl tw-font-bold tw-mb-6">Test Forms Page</h1>

      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
        <Button
          text="Opening Stock"
          icon="fa-light fa-lock-open"
          type="default"
          onClick={() => handlePopupVisibility('openingStock', true)}
        />
        <Button
          text="Closing Stock"
          icon="fa-light fa-lock"
          type="success"
          onClick={() => handlePopupVisibility('closingStock', true)}
        />
        <Button
          text="Delivery"
          icon="fa-light fa-truck-fast"
          type="normal"
          onClick={() => handlePopupVisibility('delivery', true)}
        />
        <Button
          text="Transfer"
          icon="fa-light fa-exchange"
          type="normal"
          onClick={() => handlePopupVisibility('transfer', true)}
        />
      </div>

      {/* Render all form popups */}
      {renderForm('openingStock')}
      {renderForm('closingStock')}
      {renderForm('delivery')}
      {renderForm('transfer')}
    </div>
  );
};

export default TestFormsPage;
