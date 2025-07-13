import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Popup } from 'devextreme-react/popup';
import { Form } from 'devextreme-react/form';
import { SelectBox } from 'devextreme-react/select-box';
import { DateBox } from 'devextreme-react/date-box';
import { TextArea } from 'devextreme-react/text-area';
import Button from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';

// Redux actions
import { fetchSiteList } from '../../../redux/actions/siteActions';
import { assignVehicleToSite } from '../../../redux/actions/vehicleActions';

const SiteAssignmentForm = ({ visible, onHiding, vehicle }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    siteId: null,
    assignmentDate: new Date(),
    assignmentType: 'Permanent',
    reason: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Redux state
  const sites = useSelector((state) => state.site.sites || []);

  const assignmentTypes = [
    { value: 'Permanent', text: 'Permanent Assignment' },
    { value: 'Temporary', text: 'Temporary Assignment' },
    { value: 'Emergency', text: 'Emergency Assignment' },
    { value: 'Maintenance', text: 'Maintenance Assignment' }
  ];

  useEffect(() => {
    if (visible) {
      dispatch(fetchSiteList());
      // Reset form when popup opens
      setFormData({
        siteId: vehicle?.workingSiteId || null,
        assignmentDate: new Date(),
        assignmentType: 'Permanent',
        reason: '',
        notes: ''
      });
    }
  }, [visible, vehicle, dispatch]);

  const handleAssign = async () => {
    try {
      setIsLoading(true);

      if (!formData.siteId) {
        notify('Please select a site', 'warning', 3000);
        return;
      }

      const response = await dispatch(assignVehicleToSite({
        vehicleId: vehicle.vehicleId,
        siteId: formData.siteId,
        assignmentDate: formData.assignmentDate.toISOString(),
        assignmentType: formData.assignmentType,
        reason: formData.reason,
        notes: formData.notes
      }));

      if (response.success) {
        notify('Vehicle assigned to site successfully', 'success', 3000);
        onHiding(true); // Pass true to indicate successful assignment
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('Error assigning vehicle to site:', error);
      notify(error.message || 'Failed to assign vehicle to site', 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedSite = sites.find(site => site.id === formData.siteId);

  const formItems = [
    {
      itemType: 'group',
      caption: 'Assignment Details',
      items: [
        {
          dataField: 'siteId',
          label: { text: 'Target Site' },
          editorType: 'dxSelectBox',
          editorOptions: {
            dataSource: sites,
            valueExpr: 'id',
            displayExpr: 'name',
            placeholder: 'Select site to assign vehicle',
            searchEnabled: true,
            onValueChanged: (e) => setFormData({ ...formData, siteId: e.value })
          },
          validationRules: [{ type: 'required', message: 'Site selection is required' }]
        },
        {
          dataField: 'assignmentType',
          label: { text: 'Assignment Type' },
          editorType: 'dxSelectBox',
          editorOptions: {
            dataSource: assignmentTypes,
            valueExpr: 'value',
            displayExpr: 'text',
            onValueChanged: (e) => setFormData({ ...formData, assignmentType: e.value })
          }
        },
        {
          dataField: 'assignmentDate',
          label: { text: 'Assignment Date' },
          editorType: 'dxDateBox',
          editorOptions: {
            type: 'datetime',
            displayFormat: 'dd/MM/yyyy HH:mm',
            onValueChanged: (e) => setFormData({ ...formData, assignmentDate: e.value })
          },
          validationRules: [{ type: 'required', message: 'Assignment date is required' }]
        }
      ]
    },
    {
      itemType: 'group',
      caption: 'Additional Information',
      items: [
        {
          dataField: 'reason',
          label: { text: 'Reason for Assignment' },
          editorType: 'dxTextArea',
          editorOptions: {
            height: 80,
            placeholder: 'Enter reason for this assignment...',
            onValueChanged: (e) => setFormData({ ...formData, reason: e.value })
          }
        },
        {
          dataField: 'notes',
          label: { text: 'Additional Notes' },
          editorType: 'dxTextArea',
          editorOptions: {
            height: 80,
            placeholder: 'Any additional notes or instructions...',
            onValueChanged: (e) => setFormData({ ...formData, notes: e.value })
          }
        }
      ]
    }
  ];

  return (
    <Popup
      visible={visible}
      onHiding={() => onHiding(false)}
      dragEnabled={false}
      closeOnOutsideClick={true}
      showTitle={true}
      title="Assign Vehicle to Site"
      width={600}
      height={550}
    >
      <div className="tw-p-4">
        {/* Vehicle Information */}
        {vehicle && (
          <div className="tw-mb-6 tw-p-4 tw-bg-blue-50 tw-rounded-lg tw-border tw-border-blue-200">
            <h4 className="tw-text-md tw-font-semibold tw-text-blue-800 tw-mb-2">
              Vehicle Information
            </h4>
            <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-text-sm">
              <div>
                <span className="tw-text-gray-600">Hyoung No:</span>
                <span className="tw-ml-2 tw-font-medium">{vehicle.hyoungNo}</span>
              </div>
              <div>
                <span className="tw-text-gray-600">Number Plate:</span>
                <span className="tw-ml-2 tw-font-medium">{vehicle.numberPlate || 'N/A'}</span>
              </div>
              <div>
                <span className="tw-text-gray-600">Current Site:</span>
                <span className="tw-ml-2 tw-font-medium">
                  {sites.find(s => s.id === vehicle.workingSiteId)?.name || 'Unassigned'}
                </span>
              </div>
              <div>
                <span className="tw-text-gray-600">Vehicle Type:</span>
                <span className="tw-ml-2 tw-font-medium">{vehicle.vehicleTypeName || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Selected Site Information */}
        {selectedSite && (
          <div className="tw-mb-6 tw-p-4 tw-bg-green-50 tw-rounded-lg tw-border tw-border-green-200">
            <h4 className="tw-text-md tw-font-semibold tw-text-green-800 tw-mb-2">
              Target Site Information
            </h4>
            <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-text-sm">
              <div>
                <span className="tw-text-gray-600">Site Name:</span>
                <span className="tw-ml-2 tw-font-medium">{selectedSite.name}</span>
              </div>
              <div>
                <span className="tw-text-gray-600">Location:</span>
                <span className="tw-ml-2 tw-font-medium">{selectedSite.location || 'N/A'}</span>
              </div>
              <div>
                <span className="tw-text-gray-600">Site Type:</span>
                <span className="tw-ml-2 tw-font-medium">{selectedSite.siteType || 'N/A'}</span>
              </div>
              <div>
                <span className="tw-text-gray-600">Manager:</span>
                <span className="tw-ml-2 tw-font-medium">{selectedSite.managerName || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Assignment Form */}
        <Form
          formData={formData}
          items={formItems}
          colCount={1}
          showColonAfterLabel={true}
          labelLocation="top"
        />

        {/* Warning for same site assignment */}
        {formData.siteId === vehicle?.workingSiteId && (
          <div className="tw-mt-4 tw-p-3 tw-bg-yellow-50 tw-border tw-border-yellow-200 tw-rounded-lg">
            <div className="tw-flex tw-items-center tw-gap-2">
              <i className="fa-light fa-exclamation-triangle tw-text-yellow-600"></i>
              <span className="tw-text-sm tw-text-yellow-800">
                This vehicle is already assigned to the selected site
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="tw-flex tw-justify-end tw-gap-3 tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200">
          <Button
            text="Cancel"
            onClick={() => onHiding(false)}
            stylingMode="outlined"
            disabled={isLoading}
          />
          <Button
            text="Assign Vehicle"
            icon="fa-light fa-check"
            onClick={handleAssign}
            type="default"
            stylingMode="contained"
            disabled={isLoading || !formData.siteId}
          />
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="tw-absolute tw-inset-0 tw-flex tw-items-center tw-justify-center tw-bg-white tw-bg-opacity-75 tw-rounded-lg">
            <div className="tw-text-center">
              <i className="fa-light fa-spinner fa-spin tw-text-3xl tw-text-blue-600 tw-mb-2"></i>
              <p className="tw-text-gray-600">Assigning vehicle...</p>
            </div>
          </div>
        )}
      </div>
    </Popup>
  );
};

export default SiteAssignmentForm;
