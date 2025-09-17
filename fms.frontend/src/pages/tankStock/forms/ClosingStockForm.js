import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Form, SimpleItem, Label } from 'devextreme-react/form';
import { Button } from 'devextreme-react';
import { LoadPanel } from 'devextreme-react/load-panel';
import DataGrid, {
    Column,
    GroupPanel,
    Grouping,
    Summary,
    TotalItem,
    Lookup,
    SearchPanel,
    ColumnChooser,
    HeaderFilter,
    FilterRow
} from 'devextreme-react/data-grid';
import { fetchSitebyUserId } from '../../../redux/actions/siteActions';
import { fetchTanks } from '../../../redux/actions/tankActions';
import { fetchTankVolumeHistoryByTankId } from '../../../redux/actions/tankVolumeHistoryActions';
import { createClosingStock } from '../../../redux/actions/ClosingStockActions';
import { prepareOpeningClosingStockParams } from '../../../utils/stockDataPreparation';
import { VolumeChangeReasonEnum } from '../../../utils/enums';
import LoadIndicator from 'devextreme-react/load-indicator';
import ScrollView from 'devextreme-react/scroll-view';
import notify from 'devextreme/ui/notify';
import './ClosingStockForm.scss';

// Future records validation imports
import { useFutureRecordsValidation } from '../../../hooks/useFutureRecordsValidation';
import FutureRecordsConfirmationPopup from '../../../components/tank-stock/FutureRecordsConfirmationPopup';

const ClosingStockForm = ({ updateFormData, isLoading, onSubmit, onCancel, prefilledData }) => {
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

    // State declarations - moved before useEffect hooks
    const [filteredTanks, setFilteredTanks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        siteId: prefilledData?.siteId || null,
        tankId: prefilledData?.tankId || null,
        amount: null,           // Physical stock measurement
        bookBalance: null,      // Current book balance (read-only)
        physicalStockValue: null, // Current physical stock value (read-only)
        date: prefilledData?.suggestedDate || new Date()
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [showInfoNotice, setShowInfoNotice] = useState(false); // Changed to false by default
    const [autoHideTimeout, setAutoHideTimeout] = useState(null);

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

    // Handle prefilled data
    useEffect(() => {
        if (prefilledData?.siteId && tanksFromStore.length > 0) {
            const tanksForSite = tanksFromStore.filter(tank => tank.siteId === prefilledData.siteId);
            setFilteredTanks(tanksForSite);

            // If we have a specific tank, get its data
            if (prefilledData.tankId) {
                const selectedTank = tanksFromStore.find(tank => tank.id === prefilledData.tankId);
                if (selectedTank) {
                    const bookBalance = selectedTank.currentStock;
                    const physicalStockValue = selectedTank.physicalStockValue;

                    setFormData(prev => ({
                        ...prev,
                        bookBalance: bookBalance,
                        physicalStockValue: physicalStockValue
                    }));

                    // Load tank volume history for the prefilled tank
                    setLoading(true);
                    dispatch(fetchTankVolumeHistoryByTankId(prefilledData.tankId))
                        .catch((error) => {
                            console.error('Error loading tank volume history:', error);
                            showNotification('Failed to load tank volume history', 'error');
                        })
                        .finally(() => {
                            setLoading(false);
                        });
                }
            }
        }
    }, [prefilledData, tanksFromStore, dispatch]);

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

        // Get selected tank to retrieve book balance and physical stock value
        const selectedTank = tanksFromStore.find(tank => tank.id === tankId);
        const bookBalance = selectedTank ? selectedTank.currentStock : null;
        const physicalStockValue = selectedTank ? selectedTank.physicalStockValue : null;

        const updatedData = {
            ...formData,
            tankId: tankId,
            bookBalance: bookBalance,  // Set current book balance for comparison
            physicalStockValue: physicalStockValue  // Set current physical stock value for comparison
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
    }, [formData, dispatch, validateHistoricalEntry, resetValidation, tanksFromStore]);

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
        <div className="closing-stock-form tw-h-full tw-flex tw-flex-col">
            <ScrollView className="tw-flex-1">
                                <div className="tw-p-4">
                {/* Header with Info Toggle */}
                <div className="tw-mb-6">
                    <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
                        <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-m-0">Closing Stock Entry</h2>
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
                        Record the closing stock for fuel tanks at the end of each business day.
                    </p>

                    {/* Information Panel */}
                    {showInfoNotice && (
                        <div className="tw-mb-3 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-md tw-p-2 tw-transition-all tw-duration-300 tw-ease-in-out tw-mt-3">
                            <div className="tw-flex tw-items-center">
                                <i className="fa-light fa-info-circle tw-text-blue-500 tw-mr-2 tw-text-sm"></i>
                                <div className="tw-text-blue-700 tw-text-xs">
                                    <span className="tw-font-medium">Closing Stock:</span> Record tank fuel quantity at end of specified date.
                                    <span className="tw-text-blue-600"> • Used for reconciliation and stock calculations</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Special notice for prefilled closing stock */}
                {prefilledData?.reason && (
                    <div className="tw-mb-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3">
                        <div className="tw-flex tw-items-start">
                            <i className="fa-light fa-info-circle tw-text-blue-600 tw-mt-0.5 tw-mr-3"></i>
                            <div className="tw-flex-1">
                                <h4 className="tw-font-medium tw-text-blue-800 tw-mb-1">Required Closing Stock</h4>
                                <p className="tw-text-blue-700 tw-text-sm">
                                    {prefilledData.reason}
                                </p>
                                <p className="tw-text-blue-600 tw-text-xs tw-mt-2">
                                    The tank and date have been pre-selected to match the existing opening stock. Please enter the appropriate closing stock amount for this date.
                                </p>
                            </div>
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
                            searchEnabled: true,
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

                    {/* Book Balance Display (Read-only) */}
                    {formData.bookBalance !== null && formData.bookBalance !== undefined && (
                        <SimpleItem
                            dataField="bookBalance"
                            editorType="dxTextBox"
                            editorOptions={{
                                value: formData.bookBalance != null ? Number(formData.bookBalance).toLocaleString() + ' L' : '0 L',
                                readOnly: true,
                                width: "100%",
                                stylingMode: "filled"
                            }}
                        >
                            <Label text="Current Book Balance (Calculated)" />
                        </SimpleItem>
                    )}

                    {/* Physical Stock Value Display (Read-only) */}
                    {formData.tankId && (
                        <SimpleItem
                            dataField="physicalStockValue"
                            editorType="dxTextBox"
                            editorOptions={{
                                value: formData.physicalStockValue != null ? Number(formData.physicalStockValue).toLocaleString() + ' L' : 'No physical reading available',
                                readOnly: true,
                                width: "100%",
                                stylingMode: "filled"
                            }}
                        >
                            <Label text="Current Physical Stock Value (Last Recorded)" />
                        </SimpleItem>
                    )}

                    <SimpleItem
                        dataField="amount"
                        editorType="dxNumberBox"
                        editorOptions={{
                            showSpinButtons: true,
                            value: formData.amount,
                            onValueChanged: handleAmountChange,
                            placeholder: "Enter physical stock measurement",
                            width: "100%",
                            ...(formData.amount !== null && formData.amount !== undefined && { format: "#,##0" }),
                            isValid: !validationErrors.amount,
                            validationError: validationErrors.amount ? { message: validationErrors.amount } : null
                        }}
                    >
                        <Label text="Physical Stock Amount (Liters)" />
                    </SimpleItem>

                    {/* Discrepancy Indicator */}
                    {formData.amount != null && (formData.bookBalance != null || formData.physicalStockValue != null) && (
                        <div className="discrepancy-indicator" style={{
                            padding: '10px',
                            marginTop: '10px',
                            borderRadius: '4px',
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #dee2e6'
                        }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                                Stock Comparison:
                            </div>
                            <div>New Physical Stock: {Number(formData.amount).toLocaleString()} L</div>

                            {formData.bookBalance != null && (
                                <>
                                    <div>Current Book Balance: {Number(formData.bookBalance).toLocaleString()} L</div>
                                    <div style={{
                                        fontWeight: 'bold',
                                        color: Math.abs(formData.amount - formData.bookBalance) > (formData.bookBalance * 0.05) ? '#f44336' : '#4caf50'
                                    }}>
                                        Book Balance Discrepancy: {Number(formData.amount - formData.bookBalance).toLocaleString()} L
                                        ({formData.bookBalance > 0 ? (((formData.amount - formData.bookBalance) / formData.bookBalance) * 100).toFixed(2) : '100'}%)
                                    </div>
                                </>
                            )}

                            {formData.physicalStockValue != null && (
                                <>
                                    <div>Current Physical Stock: {Number(formData.physicalStockValue).toLocaleString()} L</div>
                                    <div style={{
                                        fontWeight: 'bold',
                                        color: Math.abs(formData.amount - formData.physicalStockValue) > (formData.physicalStockValue * 0.05) ? '#ff9800' : '#4caf50'
                                    }}>
                                        Physical Stock Change: {Number(formData.amount - formData.physicalStockValue).toLocaleString()} L
                                        ({formData.physicalStockValue > 0 ? (((formData.amount - formData.physicalStockValue) / formData.physicalStockValue) * 100).toFixed(2) : '100'}%)
                                    </div>
                                </>
                            )}
                        </div>
                    )}
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
                                    Recent volume changes for selected tank. Use search and filters to analyze transaction data. Negative values indicate fuel dispensed or transferred out.
                                </p>
                            </div>

                            <div className="tw-p-4">
                                {Array.isArray(tankVolumeHistory) && tankVolumeHistory.length > 0 ? (
                                    <DataGrid
                                        dataSource={tankVolumeHistory}
                                        showBorders={true}
                                        columnAutoWidth={true}
                                        height="400px"
                                        width="100%"
                                        columnResizingMode="widget"
                                        allowColumnResizing={true}
                                        className="tw-text-sm"
                                    >
                                        <GroupPanel visible={false} />
                                        <Grouping autoExpandAll={false} />

                                        {/* Search functionality */}
                                        <SearchPanel visible={true} highlightCaseSensitive={true} />

                                        {/* Column chooser */}
                                        <ColumnChooser enabled={true} />

                                        {/* Header filter */}
                                        <HeaderFilter visible={true} />

                                        {/* Filter row */}
                                        <FilterRow visible={true} />                                        {/* Transaction Type Column */}


                                        <Column
                                            dataField="timestamp"
                                            caption="Date/Time"
                                            dataType="datetime"
                                            format="dd/MM/yyyy HH:mm"
                                            width="140"
                                            sortOrder="desc"
                                        />

                                        <Column
                                            dataField="volumeChange"
                                            caption="Volume Change (L)"
                                            dataType="number"
                                            format="#,##0.00"
                                            width="120"
                                            cellRender={(cellData) => (
                                                <span className={cellData.value >= 0 ? 'tw-text-green-600 tw-font-medium' : 'tw-text-red-600 tw-font-medium'}>
                                                    {cellData.value >= 0 ? '+' : ''}{cellData.value?.toFixed(2)}
                                                </span>
                                            )}
                                        />

                                        <Column
                                            dataField="newVolume"
                                            caption="Resulting Volume (L)"
                                            dataType="number"
                                            format="#,##0.00"
                                            width="130"
                                        />

                                        <Column
                                            dataField="recordedByUserName"
                                            caption="Recorded By"
                                            width="110"
                                        />

                                        <Column
                                            dataField="vehicleName"
                                            caption="Vehicle"
                                            width="100"
                                        />

                                        <Column
                                            dataField="referenceType"
                                            caption="Reference"
                                            width="100"
                                        />

                                        <Summary>
                                            {/* Overall totals */}
                                            <TotalItem
                                                column="volumeChange"
                                                summaryType="sum"
                                                displayFormat="Net Volume Change: {0} L"
                                                valueFormat="#,##0.00"
                                                cssClass="tw-font-bold tw-text-blue-600"
                                            />
                                            <TotalItem
                                                column="volumeChange"
                                                summaryType="count"
                                                displayFormat="Total Transactions: {0}"
                                                cssClass="tw-font-bold tw-text-gray-600"
                                            />
                                            {/* Custom summary for positive and negative changes */}
                                            <TotalItem
                                                column="volumeChange"
                                                summaryType="custom"
                                                displayFormat="Volume In: {0} L"
                                                valueFormat="#,##0.00"
                                                cssClass="tw-font-medium tw-text-green-600"
                                                calculateCustomSummary={(options) => {
                                                    if (options.summaryProcess === 'start') {
                                                        options.totalValue = 0;
                                                    } else if (options.summaryProcess === 'calculate') {
                                                        if (options.value > 0) {
                                                            options.totalValue += options.value;
                                                        }
                                                    }
                                                }}
                                            />
                                            <TotalItem
                                                column="volumeChange"
                                                summaryType="custom"
                                                displayFormat="Volume Out: {0} L"
                                                valueFormat="#,##0.00"
                                                cssClass="tw-font-medium tw-text-red-600"
                                                calculateCustomSummary={(options) => {
                                                    if (options.summaryProcess === 'start') {
                                                        options.totalValue = 0;
                                                    } else if (options.summaryProcess === 'calculate') {
                                                        if (options.value < 0) {
                                                            options.totalValue += Math.abs(options.value);
                                                        }
                                                    }
                                                }}
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
            </ScrollView>
        </div>
    );
};

export default ClosingStockForm;
