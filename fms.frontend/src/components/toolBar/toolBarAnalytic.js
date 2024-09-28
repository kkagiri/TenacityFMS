import React, { useState, useCallback } from 'react';
import Button from 'devextreme-react/button';
import Toolbar, { Item } from 'devextreme-react/toolbar';
import { Popup ,ToolbarItem} from 'devextreme-react/popup';
import { SelectBox } from 'devextreme-react/select-box';
import './toolbarAnalytics.scss';
import notify from 'devextreme/ui/notify';
import OpeningStockForm from './../tankStock/OpeningStockForm'
import ClosingStockForm from './../tankStock/ClosingStockForm';
import TankDeliveryForm from '../deliveryForms/TankDeliveryForm';
import TankTransferForm from '../tanktransfer/tankTransferForm';
import ScrollView from 'devextreme-react/scroll-view';
import DropDownButton from 'devextreme-react/drop-down-button';

const POPUP_CONFIG = {
  openingStock: {
    title: 'Opening Stock',
    Form: OpeningStockForm,
    width: '100%',
    maxWidth: '800px',
    height: 'auto',
  },
  closingStock: {
    title: 'Closing Stock',
    Form: ClosingStockForm,
    width: '90%',
    maxWidth: '800px',
    height: 'auto',
  },
  delivery: {
    title: 'Delivery',
    Form: TankDeliveryForm,
    width: '100%',
    maxWidth: '1000px',
    height: '100%',
  },
  transfer: {
    title: 'Transfer',
    Form: TankTransferForm,
    width: '90%',
    maxWidth: '800px',
    height: 'auto',
  },
};

export const ToolbarAnalytics = ({
  title,
  additionalToolbarContent,
  children,
  onOpeningStockSubmit, 
  onDeliverySubmit,
  onTransferSubmit, 
  onClosingStockSubmit,
  sites,
  onRefresh,
  onSiteChange,
  selectedSite,
  isLoading
}) => {
  const [popupVisibility, setPopupVisibility] = useState({
    openingStock: false,
    closingStock: false,
    delivery: false,
    transfer: false,
  });
  const [currentForm, setCurrentForm] = useState(null);
  const [formData, setFormData] = useState({
    openingStock: {},
    closingStock: {},
    delivery: {},
    transfer: {},
  });

  const stockManagementItems = [
    { key: 'openingStock', text: 'Opening Stock' , icon: 'fa-light fa-lock-open' , type: 'default' },
    { key: 'closingStock', text: 'Closing Stock' , icon: 'fa-light fa-lock' , type: 'success' },
    { key: 'delivery', text: 'Delivery' , icon: 'fa-light fa-truck-fast' , type: 'normal' },
    { key: 'transfer', text: 'Transfer' , icon: 'fa-light fa-exchange' , type: 'normal' },
  ];

  const handleStockManagementClick = (e) => {
    handlePopupVisibility(e.itemData.key, true);
  };

  const handlePopupVisibility = (popupName, isVisible) => {
    setPopupVisibility(prev => ({ ...prev, [popupName]: isVisible }));
    setCurrentForm(isVisible ? popupName : null);
  };


const validateOpeningClosingStock = (data) => {
  // Add closing stock specific validations
  if (!data.tankId || !data.amount || !data.date) {
    notify('Please fill in all required fields', 'error', 3000);
    return false;
}
if (data.date > new Date()) {
  notify('Date cannot be in the future', 'error', 3000);
  return false;
}
  return true;
};

const validateDelivery = (data) => {
  console.log("Validating delivery data:", data);

  if (!data.tankId || !data.manualDeliveryAmount || !data.date  || !data.product || !data.stockBeforeDelivery || !data.stockAfterDelivery) {
    notify('Please fill in all required fields', 'error', 3000);
    return false;
}

if(data.stockAfterDelivery < data.stockBeforeDelivery){
  notify('Stock after delivery cannot be less than stock before delivery', 'error', 3000);
  return false;
}



if (data.deliveryDate > new Date()) {
  notify('Delivery date cannot be in the future', 'error', 3000);
  return false;
}

  return true;
};

const validateTransfer = (data) => {
  if (!data.sourceTankId || !data.destinationTankId || !data.amount || !data.date) {
    notify('Please fill in all required fields', 'error', 3000);
    return false;
}

if (data.transferDate > new Date()) {
    notify('Transfer date cannot be in the future', 'error', 3000);
    return false;
}

if (data.sourceSiteId === data.destinationSiteId && data.sourceTankId === data.destinationTankId) {
    notify('Source and destination tanks cannot be the same', 'error', 3000);
    return false;
 }
 return true;
};



  const updateFormData = useCallback((formType, data) => {
    setFormData(prev => ({ ...prev, [formType]: data }));
  }, []);


  const handleSubmit = useCallback(async () => {
    if (!currentForm) return;
    const currentFormData = formData[currentForm];
    console.log('Current Form:', currentFormData);

    let isValid = false;

    switch (currentForm) {
      case 'openingStock':
        isValid = await validateOpeningClosingStock(currentFormData);
        break;
      case 'closingStock':
        isValid = await validateOpeningClosingStock(currentFormData);
        break;
      case 'delivery':
        isValid = await validateDelivery(currentFormData);
        break;
      case 'transfer':
        isValid = await validateTransfer(currentFormData);
        break;
      default:
        throw new Error('Invalid form type');
    }
    if (!isValid) return;

 let result;
    try {
      switch (currentForm) {
        case 'openingStock':
          result = await onOpeningStockSubmit(currentFormData);
          break;
        case 'closingStock':
          result = await onClosingStockSubmit(currentFormData);
          break;
        case 'delivery':
          result = await onDeliverySubmit(currentFormData);
          break;
        case 'transfer':
          result = await onTransferSubmit(currentFormData);
          break;
      }

      if (result.success) {
        handlePopupVisibility(currentForm, false);
        updateFormData(currentForm, {});
        notify('Form submitted successfully', 'success', 3000);
      } else {
        notify(result.message || `Failed to submit ${currentForm}`, 'error', 3000);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      notify('An error occurred while submitting the form', 'error', 3000);
    }

  }, [currentForm, formData, onOpeningStockSubmit, onClosingStockSubmit, onDeliverySubmit, onTransferSubmit, handlePopupVisibility, updateFormData]);

  const handleCancel = useCallback(() => {
    if (currentForm) {
      handlePopupVisibility(currentForm, false);
      updateFormData(currentForm, {});
    }
  }, [currentForm, handlePopupVisibility, updateFormData]);
  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
      notify('Refreshing data...', 'info', 2000);
    }
  }, [onRefresh]);

  const siteOptions = [{ id: 'all', name: 'All Sites' }, ...sites];

  const submitButtonOptions = useCallback(() => ({
    text: 'Submit',
    icon: 'save',
    type: 'success',
    stylingMode: 'contained',
    useSubmitBehavior: true,
    onClick: handleSubmit,
    disabled: isLoading,
  }), [handleSubmit, isLoading]);



  const renderPopups = () => {
    return Object.entries(POPUP_CONFIG).map(([key, { title, Form, width, maxWidth,height }]) => (
            <Popup
        key={key}
        visible={popupVisibility[key]}
        onHiding={() => handlePopupVisibility(key, false)}
        dragEnabled={false}
        showTitle={true}
        title={title}
        showCloseButton={true}
        width={width || '90%'}
        maxWidth={maxWidth || '800px'}
        height={height || '90%'}
        position={{ my: 'center', at: 'center', of: window }}
        
      >
         <Form 
          updateFormData={(data) => updateFormData(key, data)}
                    isLoading={isLoading}
        />
         <ToolbarItem
          widget="dxButton"
          toolbar="bottom"
          location="after"
          options={{
            text: 'Cancel',
            icon: 'close',
            type: 'normal',
            stylingMode: 'contained',
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
    ));
  };

  return (
    <div className='view-wrapper view-wrapper-dashboard' >
      <Toolbar className='theme-dependent' >
        <Item location='before'>
          <span className='toolbar-header' style={{paddingLeft:'10px'}}>{title}</span>
        </Item>
        <Item location='before' locateInMenu='auto'>
          <SelectBox
            dataSource={siteOptions}
            displayExpr="name"
            valueExpr="id"
            value={selectedSite || 'all'} // Set default to 'all' if selectedSite is empty
            stylingMode='underlined'
            searchEnabled={true}
            searchMode='contains'
            onValueChanged={onSiteChange}
            width={200}
            height='auto'
            placeholder="Select a site"
          />
        </Item>
        {additionalToolbarContent}
      
        <Item location='after'>
          <DropDownButton
            text="Manage Stocks"
            icon="add"
            type='success'
            items={stockManagementItems}
            onItemClick={handleStockManagementClick}
            displayExpr="text"
            keyExpr="key"
            stylingMode="contained"
          />
        </Item>
        
        <Item
          location='after'
          locateInMenu='auto'
          widget='dxButton'
          showText='inMenu'
        >
          <Button
            text='Refresh'
            icon='refresh'
            stylingMode='text'
            onClick={handleRefresh}
            disabled={isLoading}
                      />
        </Item>
       
      </Toolbar>
      {children}
      {renderPopups()}
    </div>
  );
};