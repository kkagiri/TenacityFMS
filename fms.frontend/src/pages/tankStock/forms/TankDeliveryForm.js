import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, SimpleItem, Label, RequiredRule, NumericRule } from 'devextreme-react/form';
import { Button, Popup } from 'devextreme-react';

import { fetchSitebyUserId } from '../../../redux/actions/siteActions';
import { fetchTanks } from '../../../redux/actions/tankActions';
import { fetchSuppliers, createSupplier } from '../../../redux/actions/SupplierActions';
import { createDelivery } from '../../../redux/actions/DeliveryActions';
import { prepareDeliveryDTO } from '../../../utils/stockDataPreparation';
import LoadIndicator from 'devextreme-react/load-indicator';
import ScrollView from 'devextreme-react/scroll-view';
import notify from 'devextreme/ui/notify';

// Future records validation imports
import { useFutureRecordsValidation } from '../../../hooks/useFutureRecordsValidation';
import FutureRecordsWarning from '../../../components/tank-stock/FutureRecordsWarning';

import './TankDeliveryForm.scss';

const TankDeliveryForm = ({ updateFormData, isLoading, onSubmit, onCancel }) => {
  const dispatch = useDispatch();
  const tanksFromStore = useSelector((state) => state.tank.tanks);
  const sites = useSelector((state) => state.site.sites);
  const suppliers = useSelector((state) => state.supplier.suppliers);

  // Helper function for notifications with consistent positioning
  const showNotification = (message, type = 'info', duration = 3000) => {
    notify({
      message,
      type,
      displayTime: duration,
      position: {
        my: 'top center',
        at: 'top center',
        of: window,
        offset: '0 20'
      },
      animation: {
        show: {
          type: 'slide',
          duration: 300,
          from: { top: -100, opacity: 0 },
          to: { top: 0, opacity: 1 }
        },
        hide: {
          type: 'slide',
          duration: 300,
          from: { top: 0, opacity: 1 },
          to: { top: -100, opacity: 0 }
        }
      }
    });
  };

  const [filteredTanks, setFilteredTanks] = useState([]);
  const [loading] = useState(false);
  const [showAddSupplierPopup, setShowAddSupplierPopup] = useState(false);
  const [newSupplierData, setNewSupplierData] = useState({ name: '', contacts: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showInfoNotice, setShowInfoNotice] = useState(true);
  const [showTankInfo, setShowTankInfo] = useState(false);

  // Future records validation hook
  const {
    isValidating,
    validationResult,
    error: validationError,
    showWarning,
    canSubmit,
    validateHistoricalEntry,
    confirmProceed,
    cancelProceed,
    resetValidation
  } = useFutureRecordsValidation();

  const [formData, setFormData] = useState({
    siteId: null,
    tankId: null,
    deliveryAmount: null,
    stockBeforeDelivery: null,
    stockAfterDelivery: null,
    product: '',
    deliveryDate: new Date().toISOString(),
    invoiceNumber: '',
    supplierId: null
  });

  useEffect(() => {
    if (!sites || sites.length === 0) {
      dispatch(fetchSitebyUserId());
    }
    dispatch(fetchTanks());
    dispatch(fetchSuppliers());
  }, [dispatch, sites]);

  // Notify parent component of form data changes
  useEffect(() => {
    if (updateFormData) {
      updateFormData(formData);
    }
  }, [formData, updateFormData]);

  const handleSiteChange = useCallback((e) => {
    const siteId = e.value;
    const updatedData = {
      ...formData,
      siteId: siteId,
      tankId: null
    };
    setFormData(updatedData);

    const tanksForSite = tanksFromStore.filter(tank => tank.siteId === siteId);
    setFilteredTanks(tanksForSite);
  }, [tanksFromStore, formData]);

  const normalizeTank = (tank) => {
    if (!tank) return { currentStock: null, physicalStockValue: null };
    // Support both camelCase and PascalCase from API
    const currentStock = tank.currentStock ?? tank.CurrentStock ?? null;
    const physicalStockValue = tank.physicalStockValue ?? tank.PhysicalStockValue ?? null;
    return { currentStock, physicalStockValue };
  };

  const handleFieldChange = useCallback((field, value) => {
    const updatedData = {
      ...formData,
      [field]: value
    };

    // If tank is selected, get tank information for display
    if (field === 'tankId' && value) {
      const selectedTank = tanksFromStore.find(tank => tank.id === value);
      const norm = normalizeTank(selectedTank);
      if (selectedTank) {
        updatedData.currentBookBalance = norm.currentStock;
        updatedData.currentPhysicalStock = norm.physicalStockValue;
        updatedData.tankName = selectedTank.name ?? selectedTank.Name;
        setShowTankInfo(true);
      } else {
        updatedData.currentBookBalance = null;
        updatedData.currentPhysicalStock = null;
        setShowTankInfo(false);
      }
    }

    // Auto-calculate stock after delivery if both delivery amount and stock before are provided
    if (field === 'deliveryAmount' || field === 'stockBeforeDelivery') {
      const deliveryAmount = field === 'deliveryAmount' ? value : updatedData.deliveryAmount;
      const stockBefore = field === 'stockBeforeDelivery' ? value : updatedData.stockBeforeDelivery;

      if (deliveryAmount && stockBefore) {
        updatedData.stockAfterDelivery = parseFloat(stockBefore) + parseFloat(deliveryAmount);
      }
    }

    setFormData(updatedData);

    // Trigger validation for tank or date changes
    if (field === 'tankId' || field === 'deliveryDate') {
      const tankId = field === 'tankId' ? value : updatedData.tankId;
      const date = field === 'deliveryDate' ? value : updatedData.deliveryDate;

      if (tankId && date) {
        validateHistoricalEntry(tankId, date, 'Delivery');
      } else {
        resetValidation();
      }
    }

    // Clear validation errors for the changed field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [formData, validateHistoricalEntry, resetValidation, validationErrors, tanksFromStore]);

  // Validation logic
  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.siteId) errors.siteId = 'Site is required';
    if (!formData.tankId) errors.tankId = 'Tank is required';
    if (!formData.deliveryAmount || parseFloat(formData.deliveryAmount) <= 0) errors.deliveryAmount = 'Delivery amount must be above 0';
    if (formData.stockBeforeDelivery === null || formData.stockBeforeDelivery === undefined || parseFloat(formData.stockBeforeDelivery) < 0) errors.stockBeforeDelivery = 'Valid stock before delivery is required';
    if (!formData.product || formData.product.trim() === '') errors.product = 'Product type is required';
    if (!formData.supplierId) errors.supplierId = 'Supplier is required';
    if (!formData.deliveryDate) errors.deliveryDate = 'Delivery date is required';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      showNotification('Please fix validation errors before submitting', 'error', 3000);
      return;
    }

    // Check future records validation
    if (!canSubmit) {
      showNotification('Please confirm the future records warning before proceeding', 'warning', 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      const preparedData = prepareDeliveryDTO(formData);
      const response = await dispatch(createDelivery(preparedData));

      if (response.success) {
        showNotification(response.message || 'Delivery created successfully', 'success', 3000);
        resetValidation(); // Clear validation state
        // Close form on success
        if (onCancel) {
          onCancel();
        }
        if (onSubmit) {
          onSubmit(formData);
        }
      } else {
        showNotification(response.message || 'Failed to create delivery', 'error', 5000);
      }
    } catch (error) {
      console.error('Error creating delivery:', error);
      showNotification('An unexpected error occurred', 'error', 3000);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, dispatch, onSubmit, onCancel, canSubmit, resetValidation]);

  // Handle adding new supplier
  const handleAddSupplier = useCallback(async () => {
    if (!newSupplierData.name.trim()) {
      showNotification('Supplier name is required', 'error', 3000);
      return;
    }

    try {
      const response = await dispatch(createSupplier(newSupplierData));
      if (response.success) {
        showNotification('Supplier created successfully', 'success', 3000);
        setShowAddSupplierPopup(false);
        setNewSupplierData({ name: '', contacts: '' });
        // Refresh suppliers list
        dispatch(fetchSuppliers());
      } else {
        showNotification(response.message || 'Failed to create supplier', 'error', 3000);
      }
    } catch (error) {
      console.error('Error creating supplier:', error);
      showNotification('Failed to create supplier', 'error', 3000);
    }
  }, [newSupplierData, dispatch]);

  // Create supplier options with "Add Supplier" option
  const supplierOptions = useMemo(() => {
    const options = [...(suppliers || [])];
    options.push({ id: 'ADD_NEW', name: '+ Add Supplier' });
    return options;
  }, [suppliers]);

  // Handle supplier selection
  const handleSupplierChange = useCallback((e) => {
    if (e.value === 'ADD_NEW') {
      setShowAddSupplierPopup(true);
    } else {
      handleFieldChange('supplierId', e.value);
    }
  }, [handleFieldChange]);

  const productOptions = [
    { id: 'petrol', name: 'Petrol' },
    { id: 'diesel', name: 'Diesel' },
    { id: 'kerosene', name: 'Kerosene' }

  ];

  const formatLiters = (val, fallback = 'N/A') => {
    return val != null ? `${Number(val).toLocaleString()} L` : fallback;
  };

  return (
    <div className="tank-delivery-form tw-h-full tw-flex tw-flex-col">
      <ScrollView className="tw-flex-1">
        <div className="tw-p-1">
          <div className="tw-mb-6">

            <p className="tw-text-gray-600 tw-text-sm">
              Record fuel delivery details including amounts, driver information, and delivery documentation.
            </p>
          </div>

          {loading && (
            <div className="tw-flex tw-justify-center tw-py-8">
              <LoadIndicator width={'48px'} height={'48px'} visible={true} />
            </div>
          )}

          {/* Future Records Warning */}
          {(showWarning || validationError) && (
            <div className="tw-mb-4">
              <FutureRecordsWarning
                validationResult={validationResult}
                onConfirm={confirmProceed}
                onCancel={cancelProceed}
                isVisible={showWarning}
              />
              {validationError && (
                <div className="tw-mt-2 tw-p-3 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded tw-text-red-700">
                  <i className="fa-light fa-exclamation-triangle tw-mr-2"></i>
                  {validationError}
                </div>
              )}
            </div>
          )}

          {/* Tank Info Panel (Dismissible) */}
          {formData.tankId && showTankInfo && (
            <div className="tw-mb-4 tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-p-3">
              <div className="tw-flex tw-items-start">
                <i className="fa-light fa-gas-pump tw-text-blue-600 tw-mt-0.5 tw-mr-3"></i>
                <div className="tw-flex-1">
                  <h4 className="tw-font-medium tw-text-gray-800 tw-mb-1">Tank Stock Overview</h4>
                  <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-3 tw-text-sm">
                    <div>
                      <span className="tw-text-gray-600">Book Balance:</span>
                      <span className="tw-ml-2 tw-font-medium">{formatLiters(formData.currentBookBalance, 'N/A')}</span>
                    </div>
                    <div>
                      <span className="tw-text-gray-600">Physical Stock:</span>
                      <span className="tw-ml-2 tw-font-medium">{formatLiters(formData.currentPhysicalStock, 'Not measured')}</span>
                    </div>
                    {formData.currentBookBalance != null && formData.currentPhysicalStock != null && (
                      <div>
                        <span className="tw-text-gray-600">Difference:</span>
                        <span className="tw-ml-2 tw-font-medium">
                          {Number(formData.currentPhysicalStock - formData.currentBookBalance).toLocaleString()} L
                          {formData.currentBookBalance > 0 && (
                            <>
                              {' '}
                              ({(((formData.currentPhysicalStock - formData.currentBookBalance) / formData.currentBookBalance) * 100).toFixed(2)}%)
                            </>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowTankInfo(false)}
                  className="tw-ml-3 tw-text-gray-500 hover:tw-text-gray-700 tw-transition-colors"
                  title="Dismiss"
                >
                  <i className="fa-light fa-times"></i>
                </button>
              </div>
            </div>
          )}

          <Form
            readOnly={isLoading}
            formData={formData}
            showColonAfterLabel={true}
            labelLocation="top"
            colCount={2}
            className="tw-mb-6"
          >
            {/* Basic Information */}
            <SimpleItem
              dataField="deliveryDate"
              editorType="dxDateBox"
              cssClass="datebox-full-width"
              colSpan={2}
              editorOptions={{
                value: formData.deliveryDate,
                max: new Date(),
                displayFormat: "yyyy-MM-dd HH:mm",
                type: "datetime",
                onValueChanged: (e) => handleFieldChange('deliveryDate', e.value),
                width: "100%",
                dropDownOptions: {
                  width: 'auto',
                  minWidth: 380,
                  maxWidth: 520,
                  wrapperAttr: { class: 'datebox-wide' },
                },
                elementAttr: { class: 'datebox-full-width-popup' },
              }}
            >
              <Label text="Delivery Date & Time" />
              <RequiredRule message="Delivery date is required" />
            </SimpleItem>

            <SimpleItem
              dataField="siteId"
              editorType="dxSelectBox"
              editorOptions={{
                items: sites || [],
                displayExpr: 'name',
                valueExpr: 'id',
                onValueChanged: handleSiteChange,
                 searchEnabled: true,
                value: formData.siteId,
                placeholder: "Select a site",
                width: "100%",
                isValid: !validationErrors.siteId,
                validationError: validationErrors.siteId ? { message: validationErrors.siteId } : null
              }}
            >
              <Label text="Site" />
              <RequiredRule message="Site is required" />
            </SimpleItem>

            <SimpleItem
              dataField="tankId"
              editorType="dxSelectBox"
              editorOptions={{
                items: filteredTanks,
                displayExpr: 'name',
                valueExpr: 'id',
                onValueChanged: (e) => handleFieldChange('tankId', e.value),
                value: formData.tankId,
                disabled: !formData.siteId,
                placeholder: "Select a tank",
                width: "100%",
                isValid: !validationErrors.tankId,
                validationError: validationErrors.tankId ? { message: validationErrors.tankId } : null
              }}
            >
              <Label text="Tank" />
              <RequiredRule message="Tank is required"/>
            </SimpleItem>

            {/* Dismissible info now shown above; we remove duplicated read-only fields here */}

            <SimpleItem
              dataField="product"
              editorType="dxSelectBox"
              editorOptions={{
                items: productOptions,
                displayExpr: 'name',
                valueExpr: 'id',
                onValueChanged: (e) => handleFieldChange('product', e.value),
                value: formData.product,
                placeholder: "Select product type",
                width: "100%",
                isValid: !validationErrors.product,
                validationError: validationErrors.product ? { message: validationErrors.product } : null
              }}
            >
              <Label text="Product Type" />
              <RequiredRule message="Product type is required"/>
            </SimpleItem>

            <SimpleItem
              dataField="supplierId"
              editorType="dxSelectBox"
              editorOptions={{
                items: supplierOptions,
                displayExpr: 'name',
                valueExpr: 'id',
                onValueChanged: handleSupplierChange,
                value: formData.supplierId,
                placeholder: "Select supplier",
                width: "100%",
                isValid: !validationErrors.supplierId,
                validationError: validationErrors.supplierId ? { message: validationErrors.supplierId } : null
              }}
            >
              <Label text="Supplier" />
              <RequiredRule message="Supplier is required"/>
            </SimpleItem>

            {/* Stock Information */}
            <SimpleItem
              dataField="stockBeforeDelivery"
              editorType="dxNumberBox"
              editorOptions={{
                showSpinButtons: true,
                value: formData.stockBeforeDelivery,
                onValueChanged: (e) => handleFieldChange('stockBeforeDelivery', e.value),
                placeholder: "Enter stock before delivery",
                width: "100%",
                ...(formData.stockBeforeDelivery !== null && formData.stockBeforeDelivery !== undefined && { format: "#,##0.00" })
              }}
            >
              <Label text="Stock Before Delivery (Liters)" />
              <RequiredRule message="Stock before delivery is required" />
              <NumericRule message="Must be a valid number" />
            </SimpleItem>

            <SimpleItem
              dataField="deliveryAmount"
              editorType="dxNumberBox"
              editorOptions={{
                showSpinButtons: true,
                value: formData.deliveryAmount,
                onValueChanged: (e) => handleFieldChange('deliveryAmount', e.value),
                placeholder: "Enter delivery amount",
                width: "100%",
                ...(formData.deliveryAmount !== null && formData.deliveryAmount !== undefined && { format: "#,##0.00" }),
                isValid: !validationErrors.deliveryAmount,
                validationError: validationErrors.deliveryAmount ? { message: validationErrors.deliveryAmount } : null
              }}
            >
              <Label text="Delivery Amount (Liters)" />
              <RequiredRule message="Delivery amount is required" />
              <NumericRule message="Must be a valid number" />
            </SimpleItem>

            <SimpleItem
              dataField="stockAfterDelivery"
              editorType="dxNumberBox"
              editorOptions={{
                showSpinButtons: true,
                value: formData.stockAfterDelivery,
                onValueChanged: (e) => handleFieldChange('stockAfterDelivery', e.value),
                placeholder: "Calculated automatically",
                width: "100%",
                ...(formData.stockAfterDelivery !== null && formData.stockAfterDelivery !== undefined && { format: "#,##0.00" }),
                readOnly: true
              }}
            >
              <Label text="Stock After Delivery (Liters)" />
              <RequiredRule message="Stock after delivery is required" />
              <NumericRule message="Must be a valid number" />
            </SimpleItem>

            <SimpleItem
              dataField="invoiceNumber"
              editorType="dxTextBox"
              editorOptions={{
                value: formData.invoiceNumber,
                onValueChanged: (e) => handleFieldChange('invoiceNumber', e.value),
                placeholder: "Enter invoice number",
                width: "100%"
              }}
            >
              <Label text="Invoice Number" />
            </SimpleItem>
          </Form>

          {/* Information Notice - Moved to bottom */}
          {showInfoNotice && (
            <div className="tw-mb-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3">
              <div className="tw-flex tw-items-start">
                <i className="fa-light fa-info-circle tw-text-blue-600 tw-mt-0.5 tw-mr-3"></i>
                <div className="tw-flex-1">
                  <h4 className="tw-font-medium tw-text-blue-800 tw-mb-1">Delivery Information</h4>
                  <p className="tw-text-blue-700 tw-text-sm">
                    Record fuel delivery details to update tank inventory levels. The delivery amount will increase the tank's current volume.
                    Stock before delivery is automatically calculated based on current tank volume.
                  </p>
                </div>
                <button
                  onClick={() => setShowInfoNotice(false)}
                  className="tw-ml-3 tw-text-blue-600 hover:tw-text-blue-800 tw-transition-colors"
                  title="Close information"
                >
                  <i className="fa-light fa-times"></i>
                </button>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="tw-flex tw-justify-end tw-space-x-3 tw-mt-6 tw-pt-6 tw-border-t tw-border-gray-200">
            <Button
              text="Cancel"
              onClick={onCancel}
              disabled={isSubmitting}
              className="tw-min-w-24"
              stylingMode="outlined"
            >
              <i className="fa-light fa-times tw-mr-2"></i>
              Cancel
            </Button>
            <Button
              text="Save Delivery"
              onClick={handleSubmit}
              disabled={isSubmitting}
              loading={isSubmitting}
              className="tw-min-w-32"
              type="default"
            >
              <i className="fa-light fa-save tw-mr-2"></i>
              Save Delivery
            </Button>
          </div>

          {/* Add Supplier Popup */}
          <Popup
            visible={showAddSupplierPopup}
            onHiding={() => setShowAddSupplierPopup(false)}
            title="Add New Supplier"
            width={400}
            height={300}
            dragEnabled={true}
            resizeEnabled={true}
            className="tw-rounded-lg"
          >
            <div className="tw-p-4">
              <Form
                formData={newSupplierData}
                labelLocation="top"
                colCount={1}
                className="tw-mb-4"
              >
                <SimpleItem
                  dataField="name"
                  editorType="dxTextBox"
                  editorOptions={{
                    value: newSupplierData.name,
                    onValueChanged: (e) => setNewSupplierData({ ...newSupplierData, name: e.value }),
                    placeholder: "Enter supplier name",
                    width: "100%"
                  }}
                >
                  <Label text="Supplier Name" />
                  <RequiredRule message="Supplier name is required" />
                </SimpleItem>

                <SimpleItem
                  dataField="contacts"
                  editorType="dxTextBox"
                  editorOptions={{
                    value: newSupplierData.contacts,
                    onValueChanged: (e) => setNewSupplierData({ ...newSupplierData, contacts: e.value }),
                    placeholder: "Enter contact details",
                    width: "100%"
                  }}
                >
                  <Label text="Contacts" />
                </SimpleItem>
              </Form>

              <div className="tw-flex tw-justify-end">
                <Button
                  text="Cancel"
                  onClick={() => setShowAddSupplierPopup(false)}
                  className="tw-mr-2"
                  stylingMode="outlined"
                />
                <Button
                  text="Add Supplier"
                  onClick={handleAddSupplier}
                  disabled={isSubmitting}
                  loading={isSubmitting}
                />
              </div>
            </div>
          </Popup>
        </div>
      </ScrollView>
    </div>
  );
};

export default TankDeliveryForm;
