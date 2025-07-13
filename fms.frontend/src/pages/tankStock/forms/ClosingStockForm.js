import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, SimpleItem, Label } from 'devextreme-react/form';
import { Button } from 'devextreme-react';
import DataGrid, {
    Column,
    GroupPanel,
    Grouping,
    Summary,
    GroupItem,
    TotalItem,
    Lookup
} from 'devextreme-react/data-grid';
import { fetchSitebyUserId } from '../../../redux/actions/siteActions';
import { fetchTanks } from '../../../redux/actions/tankActions';
import { fetchTankVolumeHistoryByTankId } from '../../../redux/actions/tankVolumeHistoryActions';
import { createClosingStock } from '../../../redux/actions/ClosingStockActions';
import { prepareOpeningClosingStockParams } from '../../../utils/stockDataPreparation';
import { VolumeChangeReasonEnum } from '../../../utils/enums';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import './ClosingStockForm.scss';

// Future records validation imports
import { useFutureRecordsValidation } from '../../../hooks/useFutureRecordsValidation';
import FutureRecordsWarning from '../../../components/tank-stock/FutureRecordsWarning';

const ClosingStockForm = ({ updateFormData, isLoading, onSubmit, onCancel }) => {
    const dispatch = useDispatch();
    const tanksFromStore = useSelector((state) => state.tank.tanks);
    const sites = useSelector((state) => state.site.sites);
    const tankVolumeHistory = useSelector((state) => {
        return state.tankVolumeHistory.tankVolumeHistory || [];
    });

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
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        siteId: null,
        tankId: null,
        amount: null,
        date: new Date()
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [showInfoNotice, setShowInfoNotice] = useState(true);

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

        // Clear validation errors for this field
        setValidationErrors(prev => ({ ...prev, siteId: null, tankId: null }));
    }, [tanksFromStore, formData]);

    const handleTankChange = useCallback((e) => {
        const tankId = e.value;
        const updatedData = {
            ...formData,
            tankId: tankId
        };
        setFormData(updatedData);

        if (tankId) {
            setLoading(true);
            dispatch(fetchTankVolumeHistoryByTankId(tankId))
                .then(() => {
                    console.log('Tank volume history loaded successfully');
                })
                .catch((error) => {
                    console.error('Error loading tank volume history:', error);
                    showNotification('Failed to load tank volume history', 'error');
                })
                .finally(() => {
                    setLoading(false);
                });

            // Trigger future records validation when tank and date are available
            if (formData.date) {
                validateHistoricalEntry(tankId, formData.date, 'ClosingStock');
            }
        } else {
            // Reset validation when tank is cleared
            resetValidation();
        }

        // Clear validation errors for this field
        setValidationErrors(prev => ({ ...prev, tankId: null }));
    }, [formData, dispatch, validateHistoricalEntry, resetValidation]);

    const handleDateChange = useCallback((e) => {
        const newDate = e.value;
        const updatedData = {
            ...formData,
            date: newDate
        };
        setFormData(updatedData);

        // Clear validation errors for this field
        setValidationErrors(prev => ({ ...prev, date: null }));

        // Trigger future records validation when date and tank are available
        if (newDate && formData.tankId) {
            validateHistoricalEntry(formData.tankId, newDate, 'ClosingStock');
        }
    }, [formData, validateHistoricalEntry]);

    const handleAmountChange = useCallback((e) => {
        const amount = e.value;
        const updatedData = {
            ...formData,
            amount: amount
        };
        setFormData(updatedData);

        // Clear validation errors for this field
        setValidationErrors(prev => ({ ...prev, amount: null }));
    }, [formData]);

    // Validation logic
    const validateForm = useCallback(() => {
        const errors = {};

        if (!formData.siteId) errors.siteId = 'Site is required';
        if (!formData.tankId) errors.tankId = 'Tank is required';
        if (!formData.amount || formData.amount <= 0) errors.amount = 'Valid closing stock amount is required';
        if (!formData.date) errors.date = 'Date is required';

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    // Handle form submission
    const handleSubmit = useCallback(async () => {
        if (!validateForm()) {
            showNotification('Please correct the errors in the form', 'error', 3000);
            return;
        }

        // Check if submission is allowed based on future records validation
        if (!canSubmit) {
            showNotification('Unable to submit due to future records policy. Please check the warnings above.', 'error', 5000);
            return;
        }

        setIsSubmitting(true);
        try {
            const params = prepareOpeningClosingStockParams(formData);
            const response = await dispatch(createClosingStock(params));

            if (response.success) {
                showNotification(response.message || 'Closing stock created successfully', 'success', 3000);
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
                showNotification(response.message || 'Failed to create closing stock', 'error', 5000);
            }
        } catch (error) {
            console.error('Error creating closing stock:', error);
            showNotification('An unexpected error occurred', 'error', 3000);
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, validateForm, dispatch, onSubmit, onCancel, canSubmit, resetValidation]);

    return (
        <div className="closing-stock-form tw-h-full tw-max-h-screen tw-flex tw-flex-col">
            {/* Main Form Area */}
            <div className="tw-flex-1 tw-p-4 tw-overflow-auto tw-max-h-[calc(100vh-2rem)]">
                <div className="tw-mb-6">
                    <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-2">
                        <i className="fa-light fa-lock tw-mr-2 tw-text-blue-600"></i>
                        Closing Stock Entry
                    </h3>
                    <p className="tw-text-gray-600 tw-text-sm">
                        Record the closing stock amount for the selected tank and date.
                    </p>
                </div>

                {/* Dismissible Information Notice */}
                {showInfoNotice && (
                    <div className="tw-mb-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3">
                        <div className="tw-flex tw-items-start">
                            <i className="fa-light fa-info-circle tw-text-blue-600 tw-mt-0.5 tw-mr-3"></i>
                            <div className="tw-flex-1">
                                <h4 className="tw-font-medium tw-text-blue-800 tw-mb-1">Closing Stock Information</h4>
                                <p className="tw-text-blue-700 tw-text-sm">
                                    Closing stock represents the fuel quantity available in the tank at the end of the specified date and time.
                                    This value will be used for reconciliation and stock calculations.
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
                    </SimpleItem>

                    <SimpleItem
                        dataField="siteId"
                        editorType="dxSelectBox"
                        editorOptions={{
                            items: sites || [],
                            displayExpr: 'name',
                            valueExpr: 'id',
                            onValueChanged: handleSiteChange,
                            value: formData.siteId,
                            placeholder: "Select a site",
                            width: "100%",
                            isValid: !validationErrors.siteId,
                            validationError: validationErrors.siteId ? { message: validationErrors.siteId } : null
                        }}
                    >
                        <Label text="Site" />
                    </SimpleItem>

                    <SimpleItem
                        dataField="tankId"
                        editorType="dxSelectBox"
                        editorOptions={{
                            items: filteredTanks,
                            displayExpr: 'name',
                            valueExpr: 'id',
                            onValueChanged: handleTankChange,
                            value: formData.tankId,
                            disabled: !formData.siteId,
                            placeholder: "Select a tank",
                            width: "100%",
                            isValid: !validationErrors.tankId,
                            validationError: validationErrors.tankId ? { message: validationErrors.tankId } : null
                        }}
                    >
                        <Label text="Tank" />
                    </SimpleItem>

                    <SimpleItem
                        dataField="amount"
                        editorType="dxNumberBox"
                        editorOptions={{
                            showSpinButtons: true,
                            value: formData.amount,
                            onValueChanged: handleAmountChange,
                            placeholder: "Enter amount",
                            width: "100%",
                            format: "#,##0",
                            isValid: !validationErrors.amount,
                            validationError: validationErrors.amount ? { message: validationErrors.amount } : null
                        }}
                    >
                        <Label text="Amount (Liters)" />
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

                {/* Tank Volume History Section - Only show if tank is selected */}
                {formData.siteId && formData.tankId && (
                    <div className="tw-mt-6 tw-mb-6">
                        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-shadow-sm">
                            <div className="tw-p-4 tw-border-b tw-border-gray-200">
                                <h4 className="tw-font-semibold tw-text-gray-800">
                                    <i className="fa-light fa-history tw-mr-2 tw-text-blue-600"></i>
                                    Tank Volume History
                                </h4>
                                <p className="tw-text-sm tw-text-gray-600">
                                    Recent volume changes for selected tank
                                </p>
                            </div>

                            <div className="tw-p-4">
                                {/* Debug information */}
                                {process.env.NODE_ENV === 'development' && (
                                    <div className="tw-mb-4 tw-p-2 tw-bg-gray-100 tw-text-xs">
                                        <strong>Debug:</strong> Tank Volume History Count: {tankVolumeHistory?.length || 0}
                                        {tankVolumeHistory?.length > 0 && (
                                            <pre className="tw-mt-1 tw-text-xs">
                                                {JSON.stringify(tankVolumeHistory[0], null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                )}

                                {Array.isArray(tankVolumeHistory) && tankVolumeHistory.length > 0 ? (
                                    <DataGrid
                                        dataSource={tankVolumeHistory}
                                        showBorders={true}
                                        columnAutoWidth={true}
                                        height="300px"
                                        width="100%"
                                        columnResizingMode="widget"
                                        allowColumnResizing={true}
                                        className="tw-text-sm"
                                    >
                                        <GroupPanel visible={false} />
                                        <Grouping autoExpandAll={false} />

                                        <Column
                                            dataField="Timestamp"
                                            caption="Date/Time"
                                            dataType="datetime"
                                            format="dd/MM/yyyy HH:mm"
                                            width="150"
                                        />
                                        <Column
                                            dataField="NewVolume"
                                            caption="Volume"
                                            dataType="number"
                                            format="#,##0.00"
                                            width="100"
                                        />
                                        <Column
                                            dataField="VolumeChange"
                                            caption="Change"
                                            dataType="number"
                                            format="#,##0.00"
                                            width="100"
                                            cellRender={(cellData) => (
                                                <span className={cellData.value >= 0 ? 'tw-text-green-600' : 'tw-text-red-600'}>
                                                    {cellData.value >= 0 ? '+' : ''}{cellData.value?.toFixed(2)}
                                                </span>
                                            )}
                                        />
                                        <Column
                                            dataField="ChangeReason"
                                            caption="Reason"
                                            width="120"
                                        >
                                            <Lookup
                                                dataSource={Object.entries(VolumeChangeReasonEnum).map(([key, value]) => ({
                                                    id: value,
                                                    name: key
                                                }))}
                                                valueExpr="id"
                                                displayExpr="name"
                                            />
                                        </Column>
                                        <Column
                                            dataField="RecordedBy"
                                            caption="Recorded By"
                                            width="120"
                                        />
                                        <Column
                                            dataField="VehicleName"
                                            caption="Vehicle"
                                            width="120"
                                        />

                                        <Summary>
                                            <GroupItem
                                                column="VolumeChange"
                                                summaryType="sum"
                                                displayFormat="Total: {0}"
                                                valueFormat="#,##0.00"
                                            />
                                            <TotalItem
                                                column="VolumeChange"
                                                summaryType="sum"
                                                displayFormat="Grand Total: {0}"
                                                valueFormat="#,##0.00"
                                            />
                                        </Summary>
                                    </DataGrid>
                                ) : (
                                    <div className="tw-text-center tw-py-8">
                                        <i className="fa-light fa-inbox tw-text-gray-400 tw-text-3xl tw-mb-3"></i>
                                        <p className="tw-text-gray-500">No volume history available for this tank</p>
                                    </div>
                                )}
                            </div>
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
                        text="Save"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !canSubmit}
                        loading={isSubmitting}
                        className="tw-min-w-32"
                        type="default"
                    >
                        <i className="fa-light fa-save tw-mr-2"></i>
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ClosingStockForm;
