import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Tabs } from 'devextreme-react/tabs';
import { Button } from 'devextreme-react/button';
import { Popup } from 'devextreme-react/popup';
import { useStockManagement } from '../../../../hooks/useStockManagement';
import StockAdjustmentForm from '../../forms/StockAdjustmentForm';
import StockAdjustmentList from '../../components/StockAdjustmentList';
import notify from 'devextreme/ui/notify';

//Cursor - Full implementation of Adjustment Center with integrated forms and lists
const AdjustmentCenter = ({ adjustments, selectedSite, dateRange, onAdjustmentComplete }) => {
  const { createStockAdjustment, isLoading } = useStockManagement();

  // Local state management
  const [activeTab, setActiveTab] = useState(0);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [editingAdjustment, setEditingAdjustment] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Tab data similar to StockManagement pattern
  const tabData = [
    { text: "Stock Adjustments", icon: "fa-light fa-list", badge: adjustments?.length },
    { text: "Quick Actions", icon: "fa-light fa-bolt" },
    { text: "Reconciliation", icon: "fa-light fa-balance-scale" }
  ];

  // Custom tab item renderer similar to StockManagement
  const renderTabItem = (item) => {
    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        <i className={item.icon}></i>
        <span>{item.text}</span>
        {item.badge && (
          <span className="tw-bg-blue-100 tw-text-blue-800 tw-text-xs tw-font-medium tw-px-2 tw-py-1 tw-rounded-full">
            {item.badge}
          </span>
        )}
      </div>
    );
  };

  // Handle creating new stock adjustment
  const handleCreateAdjustment = useCallback(() => {
    setEditingAdjustment(null);
    setShowAdjustmentForm(true);
  }, []);

  // Handle editing existing adjustment
  const handleEditAdjustment = useCallback((adjustment) => {
    setEditingAdjustment(adjustment);
    setShowAdjustmentForm(true);
  }, []);

  // Handle deleting adjustment
  const handleDeleteAdjustment = useCallback((adjustment) => {
    // TODO: Implement delete functionality
    notify(`Delete functionality for adjustment ${adjustment.id} will be implemented`, 'info', 3000);
  }, []);

  // Handle form submission
  const handleFormSubmit = useCallback(async (formData) => {
    try {
      const result = await createStockAdjustment(formData);

      if (result.success) {
        setShowAdjustmentForm(false);
        setEditingAdjustment(null);
        setRefreshTrigger(prev => prev + 1);

        // Notify parent component if callback provided
        if (onAdjustmentComplete) {
          onAdjustmentComplete(result.data);
        }

        notify('Stock adjustment processed successfully', 'success', 3000);
      }
    } catch (error) {
      console.error('Error processing adjustment:', error);
      notify('Failed to process stock adjustment', 'error', 5000);
    }
  }, [createStockAdjustment, onAdjustmentComplete]);

  // Handle form cancellation
  const handleFormCancel = useCallback(() => {
    setShowAdjustmentForm(false);
    setEditingAdjustment(null);
  }, []);

  // Render content based on active tab (similar to StockManagement pattern)
  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <div className="tw-p-4 tw-h-full">
            <StockAdjustmentList
              selectedSite={selectedSite}
              onEdit={handleEditAdjustment}
              onDelete={handleDeleteAdjustment}
              refreshTrigger={refreshTrigger}
            />
          </div>
        );
      case 1:
        return (
          <div className="tw-p-6">
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-6">
              {/* Physical Count Card */}
              <div className="tw-bg-gradient-to-br tw-from-green-50 tw-to-emerald-50 tw-border tw-border-green-200 tw-rounded-lg tw-p-6 tw-hover:shadow-md tw-transition-all tw-cursor-pointer"
                   onClick={() => {
                     setEditingAdjustment({ reasonCode: 1, adjustmentType: 2 });
                     setShowAdjustmentForm(true);
                   }}>
                <div className="tw-flex tw-items-center tw-mb-4">
                  <i className="fa-light fa-clipboard-check tw-text-2xl tw-text-green-600 tw-mr-3"></i>
                  <h3 className="tw-text-lg tw-font-semibold tw-text-green-800">Physical Count</h3>
                </div>
                <p className="tw-text-sm tw-text-green-700 tw-mb-4">
                  Record physical inventory count and adjust stock levels accordingly
                </p>
                <div className="tw-flex tw-items-center tw-text-sm tw-text-green-600">
                  <span>Quick adjustment</span>
                  <i className="fa-light fa-arrow-right tw-ml-2"></i>
                </div>
              </div>

              {/* System Correction Card */}
              <div className="tw-bg-gradient-to-br tw-from-yellow-50 tw-to-amber-50 tw-border tw-border-yellow-200 tw-rounded-lg tw-p-6 tw-hover:shadow-md tw-transition-all tw-cursor-pointer"
                   onClick={() => {
                     setEditingAdjustment({ reasonCode: 2, adjustmentType: 2 });
                     setShowAdjustmentForm(true);
                   }}>
                <div className="tw-flex tw-items-center tw-mb-4">
                  <i className="fa-light fa-wrench tw-text-2xl tw-text-yellow-600 tw-mr-3"></i>
                  <h3 className="tw-text-lg tw-font-semibold tw-text-yellow-800">System Correction</h3>
                </div>
                <p className="tw-text-sm tw-text-yellow-700 tw-mb-4">
                  Correct system errors or data discrepancies in stock records
                </p>
                <div className="tw-flex tw-items-center tw-text-sm tw-text-yellow-600">
                  <span>Fix discrepancy</span>
                  <i className="fa-light fa-arrow-right tw-ml-2"></i>
                </div>
              </div>

              {/* Emergency Adjustment Card */}
              <div className="tw-bg-gradient-to-br tw-from-red-50 tw-to-rose-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-6 tw-hover:shadow-md tw-transition-all tw-cursor-pointer"
                   onClick={() => {
                     setEditingAdjustment({ reasonCode: 5, adjustmentType: 1 });
                     setShowAdjustmentForm(true);
                   }}>
                <div className="tw-flex tw-items-center tw-mb-4">
                  <i className="fa-light fa-triangle-exclamation tw-text-2xl tw-text-red-600 tw-mr-3"></i>
                  <h3 className="tw-text-lg tw-font-semibold tw-text-red-800">Spillage/Loss</h3>
                </div>
                <p className="tw-text-sm tw-text-red-700 tw-mb-4">
                  Record fuel spillage, evaporation, or unexpected losses
                </p>
                <div className="tw-flex tw-items-center tw-text-sm tw-text-red-600">
                  <span>Record loss</span>
                  <i className="fa-light fa-arrow-right tw-ml-2"></i>
                </div>
              </div>

              {/* Calibration Adjustment Card */}
              <div className="tw-bg-gradient-to-br tw-from-blue-50 tw-to-cyan-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-6 tw-hover:shadow-md tw-transition-all tw-cursor-pointer"
                   onClick={() => {
                     setEditingAdjustment({ reasonCode: 3, adjustmentType: 2 });
                     setShowAdjustmentForm(true);
                   }}>
                <div className="tw-flex tw-items-center tw-mb-4">
                  <i className="fa-light fa-gauge tw-text-2xl tw-text-blue-600 tw-mr-3"></i>
                  <h3 className="tw-text-lg tw-font-semibold tw-text-blue-800">Calibration</h3>
                </div>
                <p className="tw-text-sm tw-text-blue-700 tw-mb-4">
                  Adjust stock after tank or meter calibration
                </p>
                <div className="tw-flex tw-items-center tw-text-sm tw-text-blue-600">
                  <span>Post-calibration</span>
                  <i className="fa-light fa-arrow-right tw-ml-2"></i>
                </div>
              </div>

              {/* Temperature Compensation Card */}
              <div className="tw-bg-gradient-to-br tw-from-purple-50 tw-to-violet-50 tw-border tw-border-purple-200 tw-rounded-lg tw-p-6 tw-hover:shadow-md tw-transition-all tw-cursor-pointer"
                   onClick={() => {
                     setEditingAdjustment({ reasonCode: 4, adjustmentType: 2 });
                     setShowAdjustmentForm(true);
                   }}>
                <div className="tw-flex tw-items-center tw-mb-4">
                  <i className="fa-light fa-thermometer-half tw-text-2xl tw-text-purple-600 tw-mr-3"></i>
                  <h3 className="tw-text-lg tw-font-semibold tw-text-purple-800">Temperature Compensation</h3>
                </div>
                <p className="tw-text-sm tw-text-purple-700 tw-mb-4">
                  Adjust for temperature-related volume changes
                </p>
                <div className="tw-flex tw-items-center tw-text-sm tw-text-purple-600">
                  <span>Temperature adj.</span>
                  <i className="fa-light fa-arrow-right tw-ml-2"></i>
                </div>
              </div>

              {/* Custom Adjustment Card */}
              <div className="tw-bg-gradient-to-br tw-from-gray-50 tw-to-slate-50 tw-border tw-border-gray-200 tw-rounded-lg tw-p-6 tw-hover:shadow-md tw-transition-all tw-cursor-pointer"
                   onClick={() => {
                     setEditingAdjustment({ reasonCode: 99 });
                     setShowAdjustmentForm(true);
                   }}>
                <div className="tw-flex tw-items-center tw-mb-4">
                  <i className="fa-light fa-gear tw-text-2xl tw-text-gray-600 tw-mr-3"></i>
                  <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">Custom Adjustment</h3>
                </div>
                <p className="tw-text-sm tw-text-gray-700 tw-mb-4">
                  Create a custom stock adjustment with specific details
                </p>
                <div className="tw-flex tw-items-center tw-text-sm tw-text-gray-600">
                  <span>Other reasons</span>
                  <i className="fa-light fa-arrow-right tw-ml-2"></i>
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="tw-p-6">
            <div className="tw-bg-orange-50 tw-border tw-border-orange-200 tw-rounded-lg tw-p-8 tw-text-center">
              <i className="fa-light fa-balance-scale tw-text-4xl tw-text-orange-600 tw-mb-4"></i>
              <h3 className="tw-text-xl tw-font-semibold tw-text-orange-800 tw-mb-2">
                Stock Reconciliation
              </h3>
              <p className="tw-text-orange-600 tw-mb-4">
                Reconciliation workflows will be implemented next.
              </p>
              <Button
                text="Coming Soon"
                stylingMode="outlined"
                disabled={true}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="tw-h-full tw-flex tw-flex-col">
      {/* Header */}
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-6 tw-p-4 tw-bg-gradient-to-r tw-from-blue-50 tw-to-indigo-50 tw-rounded-lg tw-border">
        <div className="tw-flex tw-items-center">
          <i className="fa-light fa-sliders tw-text-2xl tw-text-blue-600 tw-mr-3"></i>
          <div>
            <h2 className="tw-text-xl tw-font-bold tw-text-gray-800 tw-mb-1">
              Stock Adjustment Center
            </h2>
            <p className="tw-text-sm tw-text-gray-600">
              Manage stock adjustments, corrections, and reconciliation
            </p>
          </div>
        </div>

        <div className="tw-flex tw-space-x-3">
          <Button
            icon="fa-light fa-plus"
            text="New Adjustment"
            type="default"
            stylingMode="contained"
            onClick={handleCreateAdjustment}
            disabled={isLoading}
          />
          <Button
            icon="fa-light fa-chart-line"
            text="Analytics"
            stylingMode="outlined"
            onClick={() => notify('Analytics view will be implemented', 'info', 2000)}
          />
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="tw-flex-1 tw-bg-white tw-rounded-lg tw-shadow-sm tw-border">
        {/* Tab Headers */}
        <Tabs
          dataSource={tabData}
          selectedIndex={activeTab}
          onItemClick={(e) => setActiveTab(e.itemIndex)}
          width="100%"
          className="tw-mb-4"
          itemRender={renderTabItem}
        />

        {/* Tab Content */}
        <div className="tw-flex-1">
          {renderContent()}
        </div>
      </div>

      {/* Stock Adjustment Form Popup */}
      <Popup
        visible={showAdjustmentForm}
        onHiding={handleFormCancel}
        dragEnabled={false}
        closeOnOutsideClick={false}
        showCloseButton={true}
        title={editingAdjustment?.id ? "Edit Stock Adjustment" : "Create Stock Adjustment"}
        width="auto"
        height="auto"
        maxWidth="800px"
        maxHeight="90vh"
        position={{ my: "center", at: "center", of: window }}
      >
        <StockAdjustmentForm
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          isVisible={showAdjustmentForm}
          initialData={editingAdjustment}
        />
      </Popup>
    </div>
  );
};

AdjustmentCenter.propTypes = {
  adjustments: PropTypes.array,
  selectedSite: PropTypes.string,
  dateRange: PropTypes.array,
  onAdjustmentComplete: PropTypes.func
};

export default AdjustmentCenter;