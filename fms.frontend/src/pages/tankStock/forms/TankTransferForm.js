import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, SimpleItem, Label, RequiredRule, NumericRule } from 'devextreme-react/form';
import { Button } from 'devextreme-react';
import { LoadPanel } from 'devextreme-react/load-panel';
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
import FutureRecordsConfirmationPopup from '../../../components/tank-stock/FutureRecordsConfirmationPopup';

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

    // State declarations - moved before useEffect hooks
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
        transferType: 'InterTank' // InterTank, InterSite
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [showInfoNotice, setShowInfoNotice] = useState(false); // Changed to false by default
    const [autoHideTimeout, setAutoHideTimeout] = useState(null);
    const [showSourceTankInfo, setShowSourceTankInfo] = useState(false);

    // Handle info panel display with auto-hide
    const handleInfoToggle = () => {
        if (showInfoNotice) {
            // If already showing, hide it
            setShowInfoNotice(false);
            if (autoHideTimeout) {
                clearTimeout(autoHideTimeout);
                setAutoHideTimeout(null);
            }
        } else {
            // Show the panel
            setShowInfoNotice(true);

            // Clear any existing timeout
            if (autoHideTimeout) {
                clearTimeout(autoHideTimeout);
            }

            // Set up auto-hide after 3 seconds
            const timeout = setTimeout(() => {
                setShowInfoNotice(false);
                setAutoHideTimeout(null);
            }, 3000);

            setAutoHideTimeout(timeout);
        }
    };

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (autoHideTimeout) {
                clearTimeout(autoHideTimeout);
            }
        };
    }, [autoHideTimeout]);    // Future records validation hook
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

        // Filter tanks for destination site, excluding source tank if same site
        const tanksForSite = tanksFromStore.filter(tank => {
            if (tank.siteId !== siteId) return false;
            // If same site transfer, exclude the source tank
            if (formData.transferType === 'InterTank' && tank.id === formData.sourceTankId) {
                return false;
            }
            return true;
        });
        setFilteredDestinationTanks(tanksForSite);
    }, [tanksFromStore, formData.transferType, formData.sourceTankId]);

    const normalizeTank = (tank) => {
        if (!tank) return { currentStock: null };
        return { currentStock: tank.currentStock ?? tank.CurrentStock ?? null };
    };

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

            // Load source tank info for panel
            const selectedTank = tanksFromStore.find(t => t.id === tankId);
            const norm = normalizeTank(selectedTank);
            updatedData.sourceTankCurrentStock = norm.currentStock;
            setShowSourceTankInfo(!!selectedTank);

            // Update destination tanks if InterTank transfer
            if (updatedData.transferType === 'InterTank' && updatedData.sourceSiteId) {
                const tanksForSite = tanksFromStore.filter(tank =>
                    tank.siteId === updatedData.sourceSiteId && tank.id !== tankId
                );
                setFilteredDestinationTanks(tanksForSite);
                // Reset destination tank selection
                updatedData.destinationTankId = null;
            }

            return updatedData;
        });
    }, [validateHistoricalEntry, resetValidation, tanksFromStore]);

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
                // For InterTank, filter tanks from same site excluding source tank
                const tanksForSite = tanksFromStore.filter(tank =>
                    tank.siteId === prevData.sourceSiteId && tank.id !== prevData.sourceTankId
                );
                setFilteredDestinationTanks(tanksForSite);
            } else if (transferType === 'InterSite') {
                // For InterSite, clear destination tanks until site is selected
                setFilteredDestinationTanks([]);
            }

            return updatedData;
        });
    }, [tanksFromStore]);

    // reason removed

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
                    {/* Header with Info Toggle */}
                    <div className="tw-mb-6">
                        <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
                            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-m-0">
                                <i className="fa-light fa-exchange tw-mr-2 tw-text-blue-600"></i>
                                Tank Transfer Entry
                            </h3>
                            <button
                                onClick={handleInfoToggle}
                                className="tw-text-blue-500 hover:tw-text-blue-700 tw-transition-colors tw-p-1 hover:tw-bg-blue-50 tw-rounded-full tw-border-0 tw-bg-transparent"
                                title="Show information"
                                type="button"
                            >
                                <i className="fa-light fa-question tw-text-sm"></i>
                            </button>
                        </div>
                        <p className="tw-text-gray-600 tw-text-sm">
                            Transfer fuel between tanks within the same site or across different sites.
                        </p>

                        {/* Information Panel */}
                        {showInfoNotice && (
                            <div className="tw-mb-3 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-md tw-p-2 tw-transition-all tw-duration-300 tw-ease-in-out tw-mt-3">
                                <div className="tw-flex tw-items-center">
                                    <i className="fa-light fa-info-circle tw-text-blue-500 tw-mr-2 tw-text-sm"></i>
                                    <div className="tw-text-blue-700 tw-text-xs">
                                        <span className="tw-font-medium">Transfer Information:</span> Move fuel between tanks.
                                        <span className="tw-text-blue-600"> • Choose 'Between Tanks' (same site) or 'Between Sites' (cross-site)</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {loading && (
                        <div className="tw-flex tw-justify-center tw-py-8">
                            <LoadIndicator width={'48px'} height={'48px'} visible={true} />
                        </div>
                    )}

                    {/* Source Tank Info Panel */}
                    {formData.sourceTankId && showSourceTankInfo && (
                        <div className="tw-mb-4 tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-p-3">
                            <div className="tw-flex tw-items-start">
                                <i className="fa-light fa-gas-pump tw-text-blue-600 tw-mt-0.5 tw-mr-3"></i>
                                <div className="tw-flex-1">
                                    <h4 className="tw-font-medium tw-text-gray-800 tw-mb-1">Source Tank Overview</h4>
                                    <div className="tw-text-sm">
                                        <span className="tw-text-gray-600">Book Balance: </span>
                                        <span className="tw-ml-1 tw-font-medium">{formData.sourceTankCurrentStock != null ? `${Number(formData.sourceTankCurrentStock).toLocaleString()} L` : 'N/A'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowSourceTankInfo(false)}
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
                        <SimpleItem
                            dataField="date"
                            editorType="dxDateBox"
                            cssClass="datebox-full-width"
                            colSpan={2}
                            editorOptions={{
                                value: formData.date,
                                max: new Date(),
                                displayFormat: "yyyy-MM-dd HH:mm",
                                type: "datetime",
                                onValueChanged: handleDateChange,
                                width: "100%",
                                dropDownOptions: {
                                    width: 'auto',
                                    minWidth: 380,
                                    maxWidth: 520,
                                    wrapperAttr: { class: 'datebox-wide' },
                                },
                                elementAttr: { class: 'datebox-full-width-popup' },
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
                                 searchEnabled: true,
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
                                 searchEnabled: true,
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
                                disabled: !formData.destinationSiteId || filteredDestinationTanks.length === 0,
                                placeholder: filteredDestinationTanks.length === 0 ? "No tanks available" : "Select destination tank",
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
                                ...(formData.amount !== null && formData.amount !== undefined && { format: "#,##0.00" }),
                                isValid: !validationErrors.amount,
                                validationError: validationErrors.amount ? { message: validationErrors.amount } : null
                            }}
                        >
                            <Label text="Transfer Amount (Liters)" />
                            <RequiredRule message="Amount is required" />
                            <NumericRule message="Must be a valid number" />
                        </SimpleItem>

                        {/* Reason removed as not required */}
                    </Form>

                    {/* Future Records Validation Loading Panel */}
                    <LoadPanel
                        visible={isValidating}
                        message="Validating historical entry..."
                        showIndicator={true}
                        showPane={true}
                        shading={true}
                        position={{ my: 'center', at: 'center', of: window }}
                        shadingColor="rgba(0, 0, 0, 0.4)"
                        width={300}
                        height={120}
                    />

                    {/* Future Records Confirmation Popup */}
                    <FutureRecordsConfirmationPopup
                        validationResult={validationResult}
                        onConfirm={confirmProceed}
                        onCancel={cancelProceed}
                        isVisible={showWarning || !!validationError}
                        isLoading={false}
                    />

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
