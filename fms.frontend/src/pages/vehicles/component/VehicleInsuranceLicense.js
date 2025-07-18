import React, { useState, useEffect, useCallback } from 'react';
import { DataGrid } from 'devextreme-react/data-grid';
import { Column, Editing, Button as GridButton, Toolbar, Item } from 'devextreme-react/data-grid';
import Button from 'devextreme-react/button';
import { Popup } from 'devextreme-react/popup';
import { Form, SimpleItem, GroupItem, RequiredRule } from 'devextreme-react/form';
import { DateBox } from 'devextreme-react/date-box';
import { TextBox } from 'devextreme-react/text-box';
import { FileUploader } from 'devextreme-react/file-uploader';
import notify from 'devextreme/ui/notify';

const VehicleInsuranceLicense = ({ vehicleId }) => {
  const [insuranceData, setInsuranceData] = useState([]);
  const [licenseData, setLicenseData] = useState([]);
  const [showInsuranceForm, setShowInsuranceForm] = useState(false);
  const [showLicenseForm, setShowLicenseForm] = useState(false);
  const [editingInsurance, setEditingInsurance] = useState(null);
  const [editingLicense, setEditingLicense] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false); // Add data loaded flag

  // Load all data when component mounts
  const loadAllData = useCallback(async (forceReload = false) => {
    if ((dataLoaded && !forceReload) || !vehicleId) return;

    setLoading(true);
    try {
      // Load both insurance and license data in parallel
      await Promise.all([
        loadInsuranceData(true),
        loadLicenseData(true)
      ]);
      setDataLoaded(true); // Mark as loaded
    } catch (error) {
      console.error('Error loading data:', error);
      notify('Failed to load vehicle data', 'error', 3000);
    } finally {
      setLoading(false);
    }
  }, [vehicleId, dataLoaded]);

  // Mock data for demonstration - replace with actual API calls
  useEffect(() => {
    if (vehicleId && !dataLoaded) { // Only load if not already loaded
      loadAllData();
    }
  }, [vehicleId, dataLoaded]); // Remove loadAllData dependency

  const loadInsuranceData = useCallback(async (forceReload = false) => {
    if (!vehicleId) return;

    try {
      // Replace with actual API call
      const mockInsurance = [
        {
          id: 1,
          policyNumber: 'INS-2024-001',
          provider: 'ABC Insurance Co.',
          policyType: 'Comprehensive',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31'),
          premiumAmount: 125000,
          status: 'Active',
          documents: ['policy.pdf', 'receipt.pdf']
        }
      ];
      setInsuranceData(mockInsurance);
    } catch (error) {
      notify('Failed to load insurance data', 'error', 3000);
    }
  }, [vehicleId]);

  const loadLicenseData = useCallback(async (forceReload = false) => {
    if (!vehicleId) return;

    try {
      // Replace with actual API call
      const mockLicense = [
        {
          id: 1,
          licenseType: 'Vehicle Registration',
          licenseNumber: 'REG-2024-VH001',
          issuingAuthority: 'Kenya Revenue Authority',
          issueDate: new Date('2024-01-15'),
          expiryDate: new Date('2025-01-15'),
          status: 'Valid',
          documents: ['registration.pdf']
        },
        {
          id: 2,
          licenseType: 'Road License',
          licenseNumber: 'RD-2024-001',
          issuingAuthority: 'Ministry of Transport',
          issueDate: new Date('2024-06-01'),
          expiryDate: new Date('2025-06-01'),
          status: 'Valid',
          documents: ['road_license.pdf']
        }
      ];
      setLicenseData(mockLicense);
    } catch (error) {
      notify('Failed to load license data', 'error', 3000);
    }
  }, [vehicleId]);

  const handleAddInsurance = () => {
    setEditingInsurance({
      policyNumber: '',
      provider: '',
      policyType: '',
      startDate: new Date(),
      endDate: new Date(),
      premiumAmount: 0,
      status: 'Active'
    });
    setShowInsuranceForm(true);
  };

  const handleEditInsurance = (data) => {
    setEditingInsurance(data);
    setShowInsuranceForm(true);
  };

  const handleAddLicense = () => {
    setEditingLicense({
      licenseType: '',
      licenseNumber: '',
      issuingAuthority: '',
      issueDate: new Date(),
      expiryDate: new Date(),
      status: 'Valid'
    });
    setShowLicenseForm(true);
  };

  const handleEditLicense = (data) => {
    setEditingLicense(data);
    setShowLicenseForm(true);
  };

  const saveInsurance = async (formData) => {
    try {
      // Replace with actual API call
      if (editingInsurance.id) {
        // Update existing
        const updatedData = insuranceData.map(item =>
          item.id === editingInsurance.id ? { ...formData, id: editingInsurance.id } : item
        );
        setInsuranceData(updatedData);
        notify('Insurance updated successfully', 'success', 3000);
      } else {
        // Add new
        const newInsurance = { ...formData, id: Date.now() };
        setInsuranceData([...insuranceData, newInsurance]);
        notify('Insurance added successfully', 'success', 3000);
      }
      setShowInsuranceForm(false);
      setEditingInsurance(null);
    } catch (error) {
      notify('Failed to save insurance', 'error', 3000);
    }
  };

  const saveLicense = async (formData) => {
    try {
      // Replace with actual API call
      if (editingLicense.id) {
        // Update existing
        const updatedData = licenseData.map(item =>
          item.id === editingLicense.id ? { ...formData, id: editingLicense.id } : item
        );
        setLicenseData(updatedData);
        notify('License updated successfully', 'success', 3000);
      } else {
        // Add new
        const newLicense = { ...formData, id: Date.now() };
        setLicenseData([...licenseData, newLicense]);
        notify('License added successfully', 'success', 3000);
      }
      setShowLicenseForm(false);
      setEditingLicense(null);
    } catch (error) {
      notify('Failed to save license', 'error', 3000);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
      case 'Valid':
        return 'tw-text-green-600 tw-bg-green-50';
      case 'Expired':
        return 'tw-text-red-600 tw-bg-red-50';
      case 'Expiring Soon':
        return 'tw-text-yellow-600 tw-bg-yellow-50';
      default:
        return 'tw-text-gray-600 tw-bg-gray-50';
    }
  };

  const StatusCell = ({ data }) => (
    <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${getStatusColor(data.status)}`}>
      {data.status}
    </span>
  );

  const ActionsCell = ({ data, type }) => (
    <div className="tw-flex tw-gap-2">
      <Button
        icon="fa-light fa-edit"
        hint="Edit"
        onClick={() => type === 'insurance' ? handleEditInsurance(data) : handleEditLicense(data)}
        stylingMode="text"
        type="default"
      />
      <Button
        icon="fa-light fa-download"
        hint="Download Documents"
        onClick={() => notify('Document download feature coming soon', 'info', 2000)}
        stylingMode="text"
        type="default"
      />
    </div>
  );

  return (
    <div className="tw-space-y-6">
      {/* Insurance Section */}
      <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-6">
        <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
            <i className="fa-light fa-shield-check tw-mr-2 tw-text-blue-500"></i>
            Insurance Policies
          </h3>
          <Button
            text="Add Insurance"
            icon="fa-light fa-plus"
            onClick={handleAddInsurance}
            type="default"
            stylingMode="contained"
          />
        </div>

        <DataGrid
          dataSource={insuranceData}
          keyExpr="id"
          showBorders={true}
          columnAutoWidth={true}
          noDataText="No insurance policies found"
        >
          <Column dataField="policyNumber" caption="Policy Number" />
          <Column dataField="provider" caption="Insurance Provider" />
          <Column dataField="policyType" caption="Policy Type" />
          <Column dataField="startDate" caption="Start Date" dataType="date" />
          <Column dataField="expiryDate" caption="Expiry Date" dataType="date" />
          <Column dataField="premiumAmount" caption="Premium" dataType="currency" />
          <Column
            dataField="status"
            caption="Status"
            cellRender={StatusCell}
          />
          <Column
            caption="Actions"
            width={100}
            cellRender={(cellData) => <ActionsCell data={cellData.data} type="insurance" />}
          />
        </DataGrid>
      </div>

      {/* License Section */}
      <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-6">
        <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
            <i className="fa-light fa-id-card tw-mr-2 tw-text-green-500"></i>
            Licenses & Registrations
          </h3>
          <Button
            text="Add License"
            icon="fa-light fa-plus"
            onClick={handleAddLicense}
            type="default"
            stylingMode="contained"
          />
        </div>

        <DataGrid
          dataSource={licenseData}
          keyExpr="id"
          showBorders={true}
          columnAutoWidth={true}
          noDataText="No licenses found"
        >
          <Column dataField="licenseType" caption="License Type" />
          <Column dataField="licenseNumber" caption="License Number" />
          <Column dataField="issuingAuthority" caption="Issuing Authority" />
          <Column dataField="issueDate" caption="Issue Date" dataType="date" />
          <Column dataField="expiryDate" caption="Expiry Date" dataType="date" />
          <Column
            dataField="status"
            caption="Status"
            cellRender={StatusCell}
          />
          <Column
            caption="Actions"
            width={100}
            cellRender={(cellData) => <ActionsCell data={cellData.data} type="license" />}
          />
        </DataGrid>
      </div>

      {/* Insurance Form Popup */}
      <Popup
        visible={showInsuranceForm}
        onHiding={() => setShowInsuranceForm(false)}
        dragEnabled={false}
        showTitle={true}
        title={editingInsurance?.id ? "Edit Insurance Policy" : "Add Insurance Policy"}
        width={'90%'}
        height={'auto'}
        showCloseButton={true}
      >
        <InsuranceForm
          data={editingInsurance}
          onSave={saveInsurance}
          onCancel={() => setShowInsuranceForm(false)}
        />
      </Popup>

      {/* License Form Popup */}
      <Popup
        visible={showLicenseForm}
        onHiding={() => setShowLicenseForm(false)}
        dragEnabled={false}
        showTitle={true}
        title={editingLicense?.id ? "Edit License" : "Add License"}
        width={'90%'}
        height={'auto'}
        showCloseButton={true}
      >
        <LicenseForm
          data={editingLicense}
          onSave={saveLicense}
          onCancel={() => setShowLicenseForm(false)}
        />
      </Popup>
    </div>
  );
};

// Insurance Form Component
const InsuranceForm = ({ data, onSave, onCancel }) => {
  const [formData, setFormData] = useState(data || {});

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="tw-p-4">
      <div className="tw-grid tw-grid-cols-1 tw-gap-4">
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            Policy Number *
          </label>
          <TextBox
            value={formData.policyNumber || ''}
            onValueChanged={(e) => setFormData({...formData, policyNumber: e.value})}
            placeholder="Enter policy number"
          />
        </div>

        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            Insurance Provider *
          </label>
          <TextBox
            value={formData.provider || ''}
            onValueChanged={(e) => setFormData({...formData, provider: e.value})}
            placeholder="Enter insurance provider"
          />
        </div>

        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            Policy Type
          </label>
          <TextBox
            value={formData.policyType || ''}
            onValueChanged={(e) => setFormData({...formData, policyType: e.value})}
            placeholder="e.g., Comprehensive, Third Party"
          />
        </div>

        <div className="tw-grid tw-grid-cols-2 tw-gap-4">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Start Date
            </label>
            <DateBox
              value={formData.startDate}
              onValueChanged={(e) => setFormData({...formData, startDate: e.value})}
            />
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              End Date
            </label>
            <DateBox
              value={formData.endDate}
              onValueChanged={(e) => setFormData({...formData, endDate: e.value})}
            />
          </div>
        </div>

        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            Premium Amount
          </label>
          <TextBox
            value={formData.premiumAmount || 0}
            onValueChanged={(e) => setFormData({...formData, premiumAmount: e.value})}
            placeholder="Enter premium amount"
          />
        </div>

        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            Upload Documents
          </label>
          <FileUploader
            multiple={true}
            accept=".pdf,.jpg,.png,.doc,.docx"
            uploadMode="useButtons"
            onValueChanged={(e) => setFormData({...formData, documents: e.value})}
          />
        </div>

        <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6">
          <Button
            text="Cancel"
            onClick={onCancel}
            stylingMode="outlined"
          />
          <Button
            text="Save"
            type="default"
            stylingMode="contained"
            useSubmitBehavior={true}
          />
        </div>
      </div>
    </form>
  );
};

// License Form Component
const LicenseForm = ({ data, onSave, onCancel }) => {
  const [formData, setFormData] = useState(data || {});

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const licenseTypes = [
    'Vehicle Registration',
    'Road License',
    'Commercial Vehicle License',
    'Import License',
    'Environmental Certificate'
  ];

  return (
    <form onSubmit={handleSubmit} className="tw-p-4">
      <div className="tw-grid tw-grid-cols-1 tw-gap-4">
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            License Type *
          </label>
          <TextBox
            value={formData.licenseType || ''}
            onValueChanged={(e) => setFormData({...formData, licenseType: e.value})}
            placeholder="Select or enter license type"
          />
        </div>

        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            License Number *
          </label>
          <TextBox
            value={formData.licenseNumber || ''}
            onValueChanged={(e) => setFormData({...formData, licenseNumber: e.value})}
            placeholder="Enter license number"
          />
        </div>

        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            Issuing Authority
          </label>
          <TextBox
            value={formData.issuingAuthority || ''}
            onValueChanged={(e) => setFormData({...formData, issuingAuthority: e.value})}
            placeholder="Enter issuing authority"
          />
        </div>

        <div className="tw-grid tw-grid-cols-2 tw-gap-4">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Issue Date
            </label>
            <DateBox
              value={formData.issueDate}
              onValueChanged={(e) => setFormData({...formData, issueDate: e.value})}
            />
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Expiry Date
            </label>
            <DateBox
              value={formData.expiryDate}
              onValueChanged={(e) => setFormData({...formData, expiryDate: e.value})}
            />
          </div>
        </div>

        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
            Upload Documents
          </label>
          <FileUploader
            multiple={true}
            accept=".pdf,.jpg,.png,.doc,.docx"
            uploadMode="useButtons"
            onValueChanged={(e) => setFormData({...formData, documents: e.value})}
          />
        </div>

        <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6">
          <Button
            text="Cancel"
            onClick={onCancel}
            stylingMode="outlined"
          />
          <Button
            text="Save"
            type="default"
            stylingMode="contained"
            useSubmitBehavior={true}
          />
        </div>
      </div>
    </form>
  );
};

export default VehicleInsuranceLicense;
