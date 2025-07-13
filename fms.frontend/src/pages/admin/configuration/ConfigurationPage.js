import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { Popup } from 'devextreme-react/popup';
import { Form, Item } from 'devextreme-react/form';
import { Toast } from 'devextreme-react/toast';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import {
  fetchConfigurations,
  createConfiguration,
  updateConfiguration,
  deleteConfiguration,
  setSelectedConfiguration,
  clearConfigurationError
} from '../../../redux/actions/configurationActions';
import './ConfigurationPage.scss';

const ConfigurationPage = () => {
  const dispatch = useDispatch();
  const {
    configurations,
    selectedConfiguration,
    loading,
    creating,
    updating,
    deleting,
    error,
    createError,
    updateError,
    deleteError,
    successMessage
  } = useSelector(state => state.configuration);

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [toastConfig, setToastConfig] = useState({ visible: false, message: '', type: 'success' });

  // Load configurations on component mount
  useEffect(() => {
    dispatch(fetchConfigurations());
  }, [dispatch]);

  // Handle success/error messages
  useEffect(() => {
    if (successMessage) {
      setToastConfig({
        visible: true,
        message: successMessage,
        type: 'success'
      });
      dispatch(clearConfigurationError());
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    const errorMsg = error || createError || updateError || deleteError;
    if (errorMsg) {
      setToastConfig({
        visible: true,
        message: errorMsg,
        type: 'error'
      });
      dispatch(clearConfigurationError());
    }
  }, [error, createError, updateError, deleteError, dispatch]);

  const handleAddNew = () => {
    setFormData({
      siteId: null,
      updateTankVolumeFromBookKeeping: true,
      usePtsProbeReadings: false,
      volumeSourcePriority: 1,
      autoCreateLedgerEntries: true,
      checkForDuplicateManualEntries: true,
      duplicateVolumeTolerance: 0.01,
      autoReconcileTankVolumes: false,
      reconciliationFrequencyMinutes: 60,
      maxVolumeDiscrepancyThreshold: 10.0,
      discrepancyAction: 1,
      isActive: true
    });
    setIsEditMode(false);
    setIsFormVisible(true);
  };

  const handleEdit = (rowData) => {
    setFormData({ ...rowData });
    setIsEditMode(true);
    setIsFormVisible(true);
    dispatch(setSelectedConfiguration(rowData));
  };

  const handleDelete = async (rowData) => {
    if (window.confirm(`Are you sure you want to delete this configuration?`)) {
      try {
        await dispatch(deleteConfiguration(rowData.id));
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const handleSave = async () => {
    try {
      if (isEditMode) {
        await dispatch(updateConfiguration(formData.id, formData));
      } else {
        await dispatch(createConfiguration(formData));
      }
      setIsFormVisible(false);
      setFormData({});
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleCancel = () => {
    setIsFormVisible(false);
    setFormData({});
    dispatch(setSelectedConfiguration(null));
  };

  const columns = [
    {
      dataField: 'id',
      caption: 'ID',
      width: 70,
      allowEditing: false
    },
    {
      dataField: 'siteId',
      caption: 'Site ID',
      width: 100
    },
    {
      dataField: 'updateTankVolumeFromBookKeeping',
      caption: 'Update from BookKeeping',
      dataType: 'boolean',
      width: 180
    },
    {
      dataField: 'usePtsProbeReadings',
      caption: 'Use PTS Probe',
      dataType: 'boolean',
      width: 130
    },
    {
      dataField: 'autoCreateLedgerEntries',
      caption: 'Auto Create Ledger',
      dataType: 'boolean',
      width: 150
    },
    {
      dataField: 'autoReconcileTankVolumes',
      caption: 'Auto Reconcile',
      dataType: 'boolean',
      width: 130
    },
    {
      dataField: 'reconciliationFrequencyMinutes',
      caption: 'Frequency (min)',
      dataType: 'number',
      width: 120
    },
    {
      dataField: 'isActive',
      caption: 'Active',
      dataType: 'boolean',
      width: 80
    },
    {
      dataField: 'createdOn',
      caption: 'Created',
      dataType: 'datetime',
      width: 150,
      format: 'dd/MM/yyyy HH:mm'
    },
    {
      dataField: 'createdBy',
      caption: 'Created By',
      width: 120
    },
    {
      type: 'buttons',
      width: 150,
      buttons: [
        {
          name: 'edit',
          icon: 'fa-light fa-edit',
          onClick: (e) => handleEdit(e.row.data)
        },
        {
          name: 'delete',
          icon: 'fa-light fa-trash',
          onClick: (e) => handleDelete(e.row.data)
        }
      ]
    }
  ];

  const formItems = [
    {
      dataField: 'siteId',
      label: { text: 'Site ID' },
      editorType: 'dxNumberBox',
      editorOptions: {
        placeholder: 'Leave empty for global configuration'
      }
    },
    {
      dataField: 'updateTankVolumeFromBookKeeping',
      label: { text: 'Update Tank Volume from BookKeeping' },
      editorType: 'dxCheckBox'
    },
    {
      dataField: 'usePtsProbeReadings',
      label: { text: 'Use PTS Probe Readings' },
      editorType: 'dxCheckBox'
    },
    {
      dataField: 'volumeSourcePriority',
      label: { text: 'Volume Source Priority' },
      editorType: 'dxSelectBox',
      editorOptions: {
        items: [
          { value: 1, text: 'BookKeeping' },
          { value: 2, text: 'PTS Probe' },
          { value: 3, text: 'Manual' }
        ],
        displayExpr: 'text',
        valueExpr: 'value'
      }
    },
    {
      dataField: 'autoCreateLedgerEntries',
      label: { text: 'Auto Create Ledger Entries' },
      editorType: 'dxCheckBox'
    },
    {
      dataField: 'checkForDuplicateManualEntries',
      label: { text: 'Check for Duplicate Manual Entries' },
      editorType: 'dxCheckBox'
    },
    {
      dataField: 'duplicateVolumeTolerance',
      label: { text: 'Duplicate Volume Tolerance (%)' },
      editorType: 'dxNumberBox',
      editorOptions: {
        format: '#0.##%',
        step: 0.01,
        min: 0,
        max: 1
      }
    },
    {
      dataField: 'autoReconcileTankVolumes',
      label: { text: 'Auto Reconcile Tank Volumes' },
      editorType: 'dxCheckBox'
    },
    {
      dataField: 'reconciliationFrequencyMinutes',
      label: { text: 'Reconciliation Frequency (minutes)' },
      editorType: 'dxNumberBox',
      editorOptions: {
        min: 1,
        step: 5
      }
    },
    {
      dataField: 'maxVolumeDiscrepancyThreshold',
      label: { text: 'Max Volume Discrepancy Threshold (L)' },
      editorType: 'dxNumberBox',
      editorOptions: {
        format: '#0.## L',
        step: 1,
        min: 0
      }
    },
    {
      dataField: 'discrepancyAction',
      label: { text: 'Discrepancy Action' },
      editorType: 'dxSelectBox',
      editorOptions: {
        items: [
          { value: 1, text: 'Alert Only' },
          { value: 2, text: 'Auto Correct' },
          { value: 3, text: 'Block Transaction' }
        ],
        displayExpr: 'text',
        valueExpr: 'value'
      }
    },
    {
      dataField: 'isActive',
      label: { text: 'Active' },
      editorType: 'dxCheckBox'
    }
  ];

  return (
    <div className="configuration-page">
      <div className="tw-mb-4 tw-flex tw-justify-between tw-items-center">
        <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800">
          <i className="fa-light fa-cog tw-mr-2"></i>
          Automated Fueling Configurations
        </h2>
        <Button
          text="Add New Configuration"
          icon="fa-light fa-plus"
          type="default"
          onClick={handleAddNew}
          disabled={creating}
        />
      </div>

      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm">
        {loading ? (
          <div className="tw-flex tw-justify-center tw-items-center tw-h-64">
            <LoadIndicator visible={true} />
          </div>
        ) : (
          <DataGrid
            dataSource={configurations}
            keyExpr="id"
            showBorders={true}
            showRowLines={true}
            showColumnLines={true}
            rowAlternationEnabled={true}
            allowColumnReordering={true}
            allowColumnResizing={true}
            columnAutoWidth={true}
            hoverStateEnabled={true}
            columns={columns}
            paging={{
              enabled: true,
              pageSize: 20
            }}
            searchPanel={{
              visible: true,
              width: 240,
              placeholder: 'Search configurations...'
            }}
            headerFilter={{
              visible: true
            }}
            filterRow={{
              visible: true
            }}
            export={{
              enabled: true,
              fileName: 'configurations'
            }}
            className="configuration-grid"
          />
        )}
      </div>

      {/* Form Popup */}
      <Popup
        visible={isFormVisible}
        title={isEditMode ? 'Edit Configuration' : 'Add New Configuration'}
        width="600px"
        height="auto"
        showCloseButton={true}
        onHiding={handleCancel}
      >
        <div className="tw-p-4">
          <Form
            formData={formData}
            onFieldDataChanged={(e) => {
              setFormData({ ...formData, [e.dataField]: e.value });
            }}
            labelLocation="top"
          >
            {formItems.map((item, index) => (
              <Item key={index} {...item} />
            ))}
          </Form>

          <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6 tw-pt-4 tw-border-t">
            <Button
              text="Cancel"
              type="normal"
              onClick={handleCancel}
            />
            <Button
              text={isEditMode ? 'Update' : 'Create'}
              type="default"
              onClick={handleSave}
              disabled={creating || updating}
            />
          </div>
        </div>
      </Popup>

      {/* Toast for notifications */}
      <Toast
        visible={toastConfig.visible}
        message={toastConfig.message}
        type={toastConfig.type}
        onHiding={() => setToastConfig({ ...toastConfig, visible: false })}
        displayTime={4000}
      />
    </div>
  );
};

export default ConfigurationPage;
