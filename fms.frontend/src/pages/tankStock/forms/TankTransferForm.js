import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, SimpleItem, Label, RequiredRule, NumericRule } from 'devextreme-react/form';
import { Button } from 'devextreme-react';
import { fetchSitebyUserId } from '../../../redux/actions/siteActions';
import { fetchTanks } from '../../../redux/actions/tankActions';
import { createTankTransfer } from '../../../redux/actions/tankStockAction';
import { prepareTankTransferDTO } from '../../../utils/stockDataPreparation';
import LoadIndicator from 'devextreme-react/load-indicator';
import ScrollView from 'devextreme-react/scroll-view';
import notify from 'devextreme/ui/notify';
import './TankTransferForm.scss';

// Future records validation imports
import { useFutureRecordsValidation } from '../../../hooks/useFutureRecordsValidation';
import FutureRecordsWarning from '../../../components/tank-stock/FutureRecordsWarning';

const TankTransferForm = ({ updateFormData, isLoading, onSubmit, onCancel }) => {
    const dispatch = useDispatch();
    const tanksFromStore = useSelector((state) => state.tank.tanks);
    const sites = useSelector((state) => state.site.sites);

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

    const [filteredSourceTanks, setFilteredSourceTanks] = useState([]);
    const [filteredDestinationTanks, setFilteredDestinationTanks] = useState([]);
    const [loading] = useState(false);
    const [formData, setFormData] = useState({
        sourceSiteId: null,
        sourceTankId: null,
        destinationSiteId: null,
        destinationTankId: null,
        amount: null,
        date: new Date(),
        transferType: 'InterTank', // InterTank, InterSite
        reason: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [showInfoNotice, setShowInfoNotice] = useState(true);

    // Future records validation hook
    const {
        validationResult,
        error: validationError,
        showWarning,
        canSubmit,
        validateHistoricalEntry,
        confirmProceed,
        cancelProceed,
        resetValidation
    } = useFutureRecordsValidation();

    useEffect(() => {
        if (!sites || sites.length === 0) {
            dispatch(fetchSitebyUserId());
        }
        dispatch(fetchTanks());
    }, [dispatch, sites]);

    // Notify parent component of form data changes
    useEffect(() => {
        if (updateFormData) {
            updateFormData(formData);
        }
    }, [formData, updateFormData]);

    const handleSourceSiteChange = useCallback((e) => {
        const siteId = e.value;
        setFormData(prevData => ({
            ...prevData,
            sourceSiteId: siteId,
            sourceTankId: null
        }));

        const tanksForSite = tanksFromStore.filter(tank => tank.siteId === siteId);
        setFilteredSourceTanks(tanksForSite);
    }, [tanksFromStore]);

    const handleDestinationSiteChange = useCallback((e) => {
        const siteId = e.value;
        setFormData(prevData => ({
            ...prevData,
            destinationSiteId: siteId,
            destinationTankId: null
        }));

        const tanksForSite = tanksFromStore.filter(tank => tank.siteId === siteId);
        setFilteredDestinationTanks(tanksForSite);
    }, [tanksFromStore]);

    const handleSourceTankChange = useCallback((e) => {
        const tankId = e.value;
        setFormData(prevData => {
            const updatedData = {
                ...prevData,
                sourceTankId: tankId
            };

            // Trigger future records validation when source tank and date are available
            if (tankId && updatedData.date) {
                validateHistoricalEntry(tankId, updatedData.date, 'TransferOut');
            } else {
                resetValidation();
            }

            return updatedData;
        });
    }, [validateHistoricalEntry, resetValidation]);

    const handleDestinationTankChange = useCallback((e) => {
        const tankId = e.value;
        setFormData(prevData => ({
            ...prevData,
            destinationTankId: tankId
        }));
    }, []);

    const handleDateChange = useCallback((e) => {
        const newDate = e.value;
        setFormData(prevData => {
            const updatedData = {
                ...prevData,
                date: newDate
            };

            // Trigger future records validation when date and source tank are available
            if (newDate && updatedData.sourceTankId) {
                validateHistoricalEntry(updatedData.sourceTankId, newDate, 'TransferOut');
            }

            return updatedData;
        });
    }, [validateHistoricalEntry]);

    const handleAmountChange = useCallback((e) => {
        const amount = e.value;
        setFormData(prevData => ({
            ...prevData,
            amount: amount
        }));
    }, []);

    const handleTransferTypeChange = useCallback((e) => {
        const transferType = e.value;
        setFormData(prevData => {
            const updatedData = {
                ...prevData,
                transferType: transferType,
                destinationSiteId: transferType === 'InterTank' ? prevData.sourceSiteId : null,
                destinationTankId: null
            };

            // Update destination tanks based on transfer type
            if (transferType === 'InterTank' && prevData.sourceSiteId) {
                const tanksForSite = tanksFromStore.filter(tank =>
                    tank.siteId === prevData.sourceSiteId && tank.id !== prevData.sourceTankId
                );
                setFilteredDestinationTanks(tanksForSite);
            } else {
                setFilteredDestinationTanks([]);
            }

            return updatedData;
        });
    }, [tanksFromStore]);

    const handleReasonChange = useCallback((e) => {
        const reason = e.value;
        setFormData(prevData => ({
            ...prevData,
            reason: reason
        }));
    }, []);

    const transferTypeOptions = [
        { id: 'InterTank', name: 'Between Tanks (Same Site)' },
        { id: 'InterSite', name: 'Between Sites' }
    ];

    // Validation logic
    const validateForm = useCallback(() => {
        const errors = {};

        if (!formData.sourceSiteId) errors.sourceSiteId = 'Source site is required';
        if (!formData.sourceTankId) errors.sourceTankId = 'Source tank is required';
        if (!formData.destinationSiteId) errors.destinationSiteId = 'Destination site is required';
        if (!formData.destinationTankId) errors.destinationTankId = 'Destination tank is required';
        if (!formData.amount || formData.amount <= 0) errors.amount = 'Valid transfer amount is required';
        if (!formData.date) errors.date = 'Date is required';
        if (formData.sourceTankId === formData.destinationTankId) errors.destinationTankId = 'Destination tank must be different from source tank';

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    // Handle form submission
    const handleSubmit = useCallback(async () => {
        if (!validateForm()) {
            showNotification('Please fix validation errors before submitting', 'error', 3000);
            return;
        }

        // Check if submission is allowed based on future records validation
        if (!canSubmit) {
            showNotification('Unable to submit due to future records policy. Please check the warnings above.', 'error', 5000);
            return;
        }

        setIsSubmitting(true);
        try {
            const preparedData = prepareTankTransferDTO(formData);
            const response = await dispatch(createTankTransfer(preparedData));

            if (response.success) {
                showNotification(response.message || 'Tank transfer created successfully', 'success', 3000);
                // Reset validation on success
                resetValidation();
                // Close form on success
                if (onCancel) {
                    onCancel();
                }
                if (onSubmit) {
                    onSubmit(formData);
                }
            } else {
                showNotification(response.message || 'Failed to create tank transfer', 'error', 5000);
            }
        } catch (error) {
            console.error('Error creating tank transfer:', error);
            showNotification('An unexpected error occurred', 'error', 3000);
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, validateForm, dispatch, onSubmit, onCancel, canSubmit, resetValidation]);

    return (
        <div className="tank-transfer-form tw-h-full tw-flex tw-flex-col">
            <ScrollView className="tw-flex-1">
                <div className="tw-p-1">
                    {/* Header */}
                    <div className="tw-mb-6">
                        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-2">
                            <i className="fa-light fa-exchange tw-mr-2 tw-text-blue-600"></i>
                            Tank Transfer Entry
                        </h3>
                        <p className="tw-text-gray-600 tw-text-sm">
                            Transfer fuel between tanks within the same site or across different sites.
                        </p>
                    </div>

                    {loading && (
                        <div className="tw-flex tw-justify-center tw-py-8">
                            <LoadIndicator width={'48px'} height={'48px'} visible={true} />
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
                        <SimpleItem
                            dataField="date"
                            editorType="dxDateBox"
                            editorOptions={{
                                value: formData.date,
                                max: new Date(),
                                displayFormat: "yyyy-MM-dd HH:mm",
                                type: "datetime",
                                onValueChanged: handleDateChange,
                                width: "100%",
                                isValid: !validationErrors.date,
                                validationError: validationErrors.date ? { message: validationErrors.date } : null
                            }}
                        >
                            <Label text="Date & Time" />
                            <RequiredRule message="Date is required" />
                        </SimpleItem>

                        <SimpleItem
                            dataField="transferType"
                            editorType="dxSelectBox"
                            editorOptions={{
                                items: transferTypeOptions,
                                displayExpr: 'name',
                                valueExpr: 'id',
                                onValueChanged: handleTransferTypeChange,
                                value: formData.transferType,
                                placeholder: "Select transfer type",
                                width: "100%"
                            }}
                        >
                            <Label text="Transfer Type" />
                            <RequiredRule message="Transfer type is required" />
                        </SimpleItem>

                        <SimpleItem
                            dataField="sourceSiteId"
                            editorType="dxSelectBox"
                            editorOptions={{
                                items: sites || [],
                                displayExpr: 'name',
                                valueExpr: 'id',
                                onValueChanged: handleSourceSiteChange,
                                value: formData.sourceSiteId,
                                placeholder: "Select source site",
                                width: "100%",
                                isValid: !validationErrors.sourceSiteId,
                                validationError: validationErrors.sourceSiteId ? { message: validationErrors.sourceSiteId } : null
                            }}
                        >
                            <Label text="Source Site" />
                            <RequiredRule message="Source site is required" />
                        </SimpleItem>

                        <SimpleItem
                            dataField="sourceTankId"
                            editorType="dxSelectBox"
                            editorOptions={{
                                items: filteredSourceTanks,
                                displayExpr: 'name',
                                valueExpr: 'id',
                                onValueChanged: handleSourceTankChange,
                                value: formData.sourceTankId,
                                disabled: !formData.sourceSiteId,
                                placeholder: "Select source tank",
                                width: "100%",
                                isValid: !validationErrors.sourceTankId,
                                validationError: validationErrors.sourceTankId ? { message: validationErrors.sourceTankId } : null
                            }}
                        >
                            <Label text="Source Tank" />
                            <RequiredRule message="Source tank is required" />
                        </SimpleItem>

                        <SimpleItem
                            dataField="destinationSiteId"
                            editorType="dxSelectBox"
                            editorOptions={{
                                items: sites || [],
                                displayExpr: 'name',
                                valueExpr: 'id',
                                onValueChanged: handleDestinationSiteChange,
                                value: formData.destinationSiteId,
                                disabled: formData.transferType === 'InterTank',
                                placeholder: "Select destination site",
                                width: "100%",
                                isValid: !validationErrors.destinationSiteId,
                                validationError: validationErrors.destinationSiteId ? { message: validationErrors.destinationSiteId } : null
                            }}
                        >
                            <Label text="Destination Site" />
                            <RequiredRule message="Destination site is required" />
                        </SimpleItem>

                        <SimpleItem
                            dataField="destinationTankId"
                            editorType="dxSelectBox"
                            editorOptions={{
                                items: filteredDestinationTanks,
                                displayExpr: 'name',
                                valueExpr: 'id',
                                onValueChanged: handleDestinationTankChange,
                                value: formData.destinationTankId,
                                disabled: !formData.destinationSiteId,
                                placeholder: "Select destination tank",
                                width: "100%",
                                isValid: !validationErrors.destinationTankId,
                                validationError: validationErrors.destinationTankId ? { message: validationErrors.destinationTankId } : null
                            }}
                        >
                            <Label text="Destination Tank" />
                            <RequiredRule message="Destination tank is required" />
                        </SimpleItem>

                        <SimpleItem
                            dataField="amount"
                            editorType="dxNumberBox"
                            editorOptions={{
                                showSpinButtons: true,
                                value: formData.amount,
                                onValueChanged: handleAmountChange,
                                placeholder: "Enter transfer amount",
                                width: "100%",
                                format: "#,##0.00",
                                isValid: !validationErrors.amount,
                                validationError: validationErrors.amount ? { message: validationErrors.amount } : null
                            }}
                        >
                            <Label text="Transfer Amount (Liters)" />
                            <RequiredRule message="Amount is required" />
                            <NumericRule message="Must be a valid number" />
                        </SimpleItem>

                        <SimpleItem
                            dataField="reason"
                            editorType="dxTextArea"
                            editorOptions={{
                                value: formData.reason,
                                onValueChanged: handleReasonChange,
                                placeholder: "Enter reason for transfer (optional)",
                                width: "100%",
                                height: 80
                            }}
                        >
                            <Label text="Reason (Optional)" />
                        </SimpleItem>
                    </Form>

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

                    {/* Information Notice - Moved to bottom */}
                    {showInfoNotice && (
                        <div className="tw-mb-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3">
                            <div className="tw-flex tw-items-start">
                                <i className="fa-light fa-info-circle tw-text-blue-600 tw-mt-0.5 tw-mr-3"></i>
                                <div className="tw-flex-1">
                                    <h4 className="tw-font-medium tw-text-blue-800 tw-mb-1">Transfer Information</h4>
                                    <p className="tw-text-blue-700 tw-text-sm">
                                        Transfer fuel between tanks. Amount will be deducted from source tank and added to destination tank.
                                        Choose 'Between Tanks' for same site transfers or 'Between Sites' for cross-site transfers.
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
                            text="Save Transfer"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !canSubmit}
                            loading={isSubmitting}
                            className="tw-min-w-32"
                            type="default"
                        >
                            <i className="fa-light fa-save tw-mr-2"></i>
                            Save Transfer
                        </Button>
                    </div>
                </div>
            </ScrollView>
        </div>
    );
};

export default TankTransferForm;
