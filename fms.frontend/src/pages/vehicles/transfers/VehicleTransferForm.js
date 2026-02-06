/**
 * VehicleTransferForm.js
 * Form for creating vehicle transfer with checkup report
 * Based on H. Young & Co. Plant Equipment Transfer Checkup Report
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Form,
  SimpleItem,
  GroupItem,
  Label,
  RequiredRule,
} from "devextreme-react/form";
import { SelectBox } from "devextreme-react/select-box";
import { TextBox } from "devextreme-react/text-box";
import { TextArea } from "devextreme-react/text-area";
import { NumberBox } from "devextreme-react/number-box";
import { DateBox } from "devextreme-react/date-box";
import { FileUploader } from "devextreme-react/file-uploader";
import { Switch } from "devextreme-react/switch";
import Button from "devextreme-react/button";
import { DataGrid } from "devextreme-react/data-grid";
import { Column, Editing, Lookup } from "devextreme-react/data-grid";
import notify from "devextreme/ui/notify";
import { useSelector, useDispatch } from "react-redux";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import axiosInstance from "../../../api/axiosInstance";
import EmployeeSearchableSelector from "../../../components/selectors/EmployeeSearchableSelector";

import "./VehicleTransferForm.scss";

const VehicleTransferForm = ({ vehicleId, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const formRef = useRef(null);
  const sites = useSelector((state) => state.site.sites);
  const vehicles = useSelector((state) => state.vehicle.vehicles);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [vehicle, setVehicle] = useState(null);
  const [checkupItems, setCheckupItems] = useState([]);
  const [tyreDetails, setTyreDetails] = useState([]);
  const [batteryDetails, setBatteryDetails] = useState([]);
  const [serviceFilterParts, setServiceFilterParts] = useState([]);
  const [documentFile, setDocumentFile] = useState(null);

  const [formData, setFormData] = useState({
    vehicleId: vehicleId,
    deliveryNoteNumber: "",
    fromSiteId: null,
    toSiteId: null,
    transferDate: new Date(),
    driverId: null,
    driverName: "",
    driverPhone: "",
    jobNumber: "",
    currentReading: null,
    readingUnit: "hrs",
    nextServiceReading: null,
    batteryNumber: "",
    makeModel: "",
    fuelInTank: null,
    sealNumber: "",
    departureTime: null,
    arrivalTime: null,
    antiTheftCheckedDeparture: false,
    antiTheftCheckedArrival: false,
    keysInEnvelopeChecked: false,
    remarks: "",
    senderName: "",
    senderFunction: "",
    receiverName: "",
    receiverFunction: "",
    approvedBy: "",
    workshopManagerSign: "",
    sendEmail: true,
    emailRecipients: "",
    updateOdometer: true,
    createMaintenanceEntry: true,
    // GPS Equipment Checkup
    gpsDeviceId: "",
    gpsDeviceCondition: "Good",
    gpsDeviceWorking: true,
    gpsDeviceRemarks: "",
    fuelSensorId: "",
    fuelSensorCondition: "Good",
    fuelSensorWorking: true,
    fuelSensorRemarks: "",
    vehicleManufacturer: "",
    vehicleModelName: "",
  });

  // Load sites and checkup template
  useEffect(() => {
    dispatch(fetchSiteList());
    loadCheckupTemplate();
  }, [dispatch]);

  // Get vehicle info
  useEffect(() => {
    if (vehicleId && vehicles.length > 0) {
      const v = vehicles.find((v) => v.vehicleId === parseInt(vehicleId));
      if (v) {
        setVehicle(v);
        // Determine reading unit based on vehicle type (heavy equipment uses hrs, vehicles use km)
        const vehicleReadingUnit = v.vehicleType?.name?.toLowerCase()?.includes('generator') ||
          v.vehicleType?.name?.toLowerCase()?.includes('excavator') ||
          v.vehicleType?.name?.toLowerCase()?.includes('loader') ||
          v.vehicleType?.name?.toLowerCase()?.includes('dozer') ||
          v.vehicleType?.name?.toLowerCase()?.includes('crane') ||
          v.vehicleType?.name?.toLowerCase()?.includes('forklift')
          ? 'hrs' : 'km';

        setFormData((prev) => ({
          ...prev,
          fromSiteId: v.workingSiteId,
          makeModel: `${v.vehicleManufacturer?.name || ""} ${v.vehicleModel?.name || ""}`.trim(),
          vehicleManufacturer: v.vehicleManufacturer?.name || "",
          vehicleModelName: v.vehicleModel?.name || "",
          currentReading: v.currentPhysicalReading
            ? parseFloat(v.currentPhysicalReading)
            : null,
          readingUnit: vehicleReadingUnit,
        }));
      }
    }
  }, [vehicleId, vehicles]);

  const loadCheckupTemplate = async () => {
    try {
      const response = await axiosInstance.get(
        "/vehicletransfers/checkup-template"
      );
      if (response.data) {
        setCheckupItems(
          response.data.map((item) => ({
            ...item,
            isGood: true,
            isFair: false,
            isDamaged: false,
            isWorn: false,
            wornPercentage: null,
            remarks: "",
          }))
        );
      }
    } catch (error) {
      console.error("Error loading checkup template:", error);
      // Set default items if API fails
      setDefaultCheckupItems();
    }
  };

  const setDefaultCheckupItems = () => {
    const defaultItems = [
      { serialNo: 1, description: "SUSPENSION", checkType: "CHECK" },
      {
        serialNo: 2,
        description: "BRAKES, INDICATORS, GAUGES & FAN BELT",
        checkType: "CHECK & TEST",
      },
      {
        serialNo: 3,
        description: "COOLING SYSTEM, COOLANT LEVEL & LEAKS",
        checkType: "CHECK",
      },
      {
        serialNo: 4,
        description: "ENGINE OIL LEVEL & LEAKS",
        checkType: "CHECK",
      },
      // Add more default items as needed
    ].map((item) => ({
      ...item,
      isGood: true,
      isFair: false,
      isDamaged: false,
      isWorn: false,
      wornPercentage: null,
      remarks: "",
    }));
    setCheckupItems(defaultItems);
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.fromSiteId) {
      notify("Please select the 'From Site'", "warning", 3000);
      return;
    }
    if (!formData.toSiteId) {
      notify("Please select the 'To Site'", "warning", 3000);
      return;
    }
    if (formData.fromSiteId === formData.toSiteId) {
      notify("Cannot transfer to the same site", "warning", 3000);
      return;
    }
    if (!formData.transferDate) {
      notify("Please select the transfer date", "warning", 3000);
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare form data for multipart upload
      const submitData = new FormData();

      // Add basic fields
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          if (formData[key] instanceof Date) {
            submitData.append(key, formData[key].toISOString());
          } else {
            submitData.append(key, formData[key]);
          }
        }
      });

      // Add checkup items as JSON
      submitData.append("checkupItems", JSON.stringify(checkupItems));

      // Add tyre details
      if (tyreDetails.length > 0) {
        submitData.append("tyreDetails", JSON.stringify(tyreDetails));
      }

      // Add battery details
      if (batteryDetails.length > 0) {
        submitData.append("batteryDetails", JSON.stringify(batteryDetails));
      }

      // Add service filter parts
      if (serviceFilterParts.length > 0) {
        submitData.append(
          "serviceFilterParts",
          JSON.stringify(serviceFilterParts)
        );
      }

      // Add document file
      if (documentFile) {
        submitData.append("documentFile", documentFile);
      }

      const response = await axiosInstance.post(
        "/vehicletransfers",
        submitData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data?.isSuccess) {
        onSuccess && onSuccess(response.data.data);
      } else {
        throw new Error(response.data?.message || "Failed to create transfer");
      }
    } catch (error) {
      console.error("Error creating transfer:", error);
      notify(
        error.response?.data?.message ||
        error.message ||
        "Failed to create transfer",
        "error",
        3000
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const readingUnitOptions = [
    { value: "hrs", text: "Hours" },
    { value: "km", text: "Kilometers" },
    { value: "miles", text: "Miles" },
  ];

  const conditionOptions = [
    { value: "good", text: "Good" },
    { value: "fair", text: "Fair" },
    { value: "worn", text: "Worn" },
    { value: "damaged", text: "Damaged" },
  ];

  return (
    <div className="vehicle-transfer-form tw-p-4">
      {/* Header with Vehicle Info */}
      <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4 tw-mb-6">
        <h2 className="tw-text-xl tw-font-bold tw-text-blue-800 tw-mb-2">
          <i className="fa-light fa-file-lines tw-mr-2"></i>
          Plant Equipment Transfer Checkup Report
        </h2>
        {vehicle && (
          <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4 tw-mt-4">
            <div>
              <span className="tw-text-sm tw-text-gray-500">Vehicle No</span>
              <p className="tw-font-semibold">{vehicle.hyoungNo}</p>
            </div>
            <div>
              <span className="tw-text-sm tw-text-gray-500">Reg. No</span>
              <p className="tw-font-semibold">{vehicle.numberPlate}</p>
            </div>
            <div>
              <span className="tw-text-sm tw-text-gray-500">Make</span>
              <p className="tw-font-semibold">{formData.makeModel}</p>
            </div>
            <div>
              <span className="tw-text-sm tw-text-gray-500">Current Site</span>
              <p className="tw-font-semibold">
                {sites.find((s) => s.id === vehicle.workingSiteId)?.name ||
                  "N/A"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Form */}
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
        {/* Left Column - Transfer Details */}
        <div className="tw-space-y-6">
          {/* Transfer Info */}
          <div className="tw-bg-white tw-border tw-rounded-lg tw-p-4">
            <h3 className="tw-font-semibold tw-text-gray-800 tw-mb-4">
              <i className="fa-light fa-exchange-alt tw-mr-2"></i>
              Transfer Information
            </h3>

            <div className="tw-grid tw-grid-cols-2 tw-gap-4">
              <div>
                <label className="tw-text-sm tw-text-gray-600">
                  Delivery Note No. <span className="tw-text-red-500">*</span>
                </label>
                <TextBox
                  value={formData.deliveryNoteNumber}
                  onValueChanged={(e) =>
                    handleFieldChange("deliveryNoteNumber", e.value)
                  }
                  placeholder="e.g., 757431"
                  className="tw-mt-1"
                />
              </div>
              <div>
                <label className="tw-text-sm tw-text-gray-600">
                  Transfer Date <span className="tw-text-red-500">*</span>
                </label>
                <DateBox
                  value={formData.transferDate}
                  onValueChanged={(e) =>
                    handleFieldChange("transferDate", e.value)
                  }
                  type="date"
                  displayFormat="dd/MM/yyyy"
                  className="tw-mt-1"
                />
              </div>
              <div>
                <label className="tw-text-sm tw-text-gray-600">
                  From Site <span className="tw-text-red-500">*</span>
                </label>
                <SelectBox
                  dataSource={sites}
                  displayExpr="name"
                  valueExpr="id"
                  value={formData.fromSiteId}
                  onValueChanged={(e) =>
                    handleFieldChange("fromSiteId", e.value)
                  }
                  searchEnabled={true}
                  placeholder="Select source site"
                  className="tw-mt-1"
                />
              </div>
              <div>
                <label className="tw-text-sm tw-text-gray-600">
                  To Site <span className="tw-text-red-500">*</span>
                </label>
                <SelectBox
                  dataSource={sites.filter((s) => s.id !== formData.fromSiteId)}
                  displayExpr="name"
                  valueExpr="id"
                  value={formData.toSiteId}
                  onValueChanged={(e) => handleFieldChange("toSiteId", e.value)}
                  searchEnabled={true}
                  placeholder="Select destination site"
                  className="tw-mt-1"
                />
              </div>
              <div>
                <label className="tw-text-sm tw-text-gray-600">Job Number</label>
                <TextBox
                  value={formData.jobNumber}
                  onValueChanged={(e) => handleFieldChange("jobNumber", e.value)}
                  placeholder="e.g., 7818"
                  className="tw-mt-1"
                />
              </div>
            </div>
          </div>

          {/* Driver Info */}
          <div className="tw-bg-white tw-border tw-rounded-lg tw-p-4">
            <h3 className="tw-font-semibold tw-text-gray-800 tw-mb-4">
              <i className="fa-light fa-user tw-mr-2"></i>
              Driver Information
            </h3>

            <div className="tw-grid tw-grid-cols-2 tw-gap-4">
              <div className="tw-col-span-2">
                <label className="tw-text-sm tw-text-gray-600">
                  Select Driver (Employee)
                </label>
                <EmployeeSearchableSelector
                  value={formData.driverId}
                  onValueChanged={(employeeId, employee) => {
                    setFormData((prev) => ({
                      ...prev,
                      driverId: employeeId,
                      driverName: employee?.fullName || employee?.name || "",
                      driverPhone: employee?.phoneNumber || "",
                    }));
                  }}
                  placeholder="Search for driver by name..."
                  siteId={formData.fromSiteId}
                />
              </div>
              <div>
                <label className="tw-text-sm tw-text-gray-600">
                  Driver Name (Manual Entry)
                </label>
                <TextBox
                  value={formData.driverName}
                  onValueChanged={(e) =>
                    handleFieldChange("driverName", e.value)
                  }
                  placeholder="e.g., VINCENT"
                  className="tw-mt-1"
                />
              </div>
              <div>
                <label className="tw-text-sm tw-text-gray-600">Phone</label>
                <TextBox
                  value={formData.driverPhone}
                  onValueChanged={(e) =>
                    handleFieldChange("driverPhone", e.value)
                  }
                  placeholder="e.g., 0714079900"
                  className="tw-mt-1"
                />
              </div>
            </div>
          </div>

          {/* Equipment Reading */}
          <div className="tw-bg-white tw-border tw-rounded-lg tw-p-4">
            <h3 className="tw-font-semibold tw-text-gray-800 tw-mb-4">
              <i className="fa-light fa-gauge tw-mr-2"></i>
              Equipment Reading
            </h3>

            <div className="tw-grid tw-grid-cols-3 tw-gap-4">
              <div>
                <label className="tw-text-sm tw-text-gray-600">
                  Current Reading
                </label>
                <NumberBox
                  value={formData.currentReading}
                  onValueChanged={(e) =>
                    handleFieldChange("currentReading", e.value)
                  }
                  format="#,##0.##"
                  className="tw-mt-1"
                />
              </div>
              <div>
                <label className="tw-text-sm tw-text-gray-600">Unit</label>
                <SelectBox
                  dataSource={readingUnitOptions}
                  displayExpr="text"
                  valueExpr="value"
                  value={formData.readingUnit}
                  onValueChanged={(e) =>
                    handleFieldChange("readingUnit", e.value)
                  }
                  className="tw-mt-1"
                />
              </div>
              <div>
                <label className="tw-text-sm tw-text-gray-600">
                  Next Service At
                </label>
                <NumberBox
                  value={formData.nextServiceReading}
                  onValueChanged={(e) =>
                    handleFieldChange("nextServiceReading", e.value)
                  }
                  format="#,##0.##"
                  className="tw-mt-1"
                />
              </div>
            </div>
          </div>

          {/* GPS Equipment Checkup */}
          <div className="tw-bg-white tw-border tw-rounded-lg tw-p-4">
            <h3 className="tw-font-semibold tw-text-gray-800 tw-mb-4">
              <i className="fa-light fa-satellite-dish tw-mr-2"></i>
              GPS Equipment Checkup
            </h3>

            {/* GPS Device */}
            <div className="tw-mb-4">
              <h4 className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                <i className="fa-light fa-location-dot tw-mr-1"></i>
                GPS Device
              </h4>
              <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                <div>
                  <label className="tw-text-sm tw-text-gray-600">
                    Device ID / Serial
                  </label>
                  <TextBox
                    value={formData.gpsDeviceId}
                    onValueChanged={(e) =>
                      handleFieldChange("gpsDeviceId", e.value)
                    }
                    placeholder="GPS device ID"
                    className="tw-mt-1"
                  />
                </div>
                <div>
                  <label className="tw-text-sm tw-text-gray-600">Condition</label>
                  <SelectBox
                    dataSource={conditionOptions}
                    displayExpr="text"
                    valueExpr="value"
                    value={formData.gpsDeviceCondition}
                    onValueChanged={(e) =>
                      handleFieldChange("gpsDeviceCondition", e.value)
                    }
                    className="tw-mt-1"
                  />
                </div>
                <div className="tw-flex tw-items-center tw-gap-3">
                  <label className="tw-text-sm tw-text-gray-600">Working:</label>
                  <Switch
                    value={formData.gpsDeviceWorking}
                    onValueChanged={(e) =>
                      handleFieldChange("gpsDeviceWorking", e.value)
                    }
                  />
                  <span className="tw-text-sm">
                    {formData.gpsDeviceWorking ? "Yes" : "No"}
                  </span>
                </div>
                <div>
                  <label className="tw-text-sm tw-text-gray-600">Remarks</label>
                  <TextBox
                    value={formData.gpsDeviceRemarks}
                    onValueChanged={(e) =>
                      handleFieldChange("gpsDeviceRemarks", e.value)
                    }
                    placeholder="GPS device remarks"
                    className="tw-mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Fuel Sensor */}
            <div>
              <h4 className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                <i className="fa-light fa-gas-pump tw-mr-1"></i>
                Fuel Sensor
              </h4>
              <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                <div>
                  <label className="tw-text-sm tw-text-gray-600">
                    Sensor ID / Serial
                  </label>
                  <TextBox
                    value={formData.fuelSensorId}
                    onValueChanged={(e) =>
                      handleFieldChange("fuelSensorId", e.value)
                    }
                    placeholder="Fuel sensor ID"
                    className="tw-mt-1"
                  />
                </div>
                <div>
                  <label className="tw-text-sm tw-text-gray-600">Condition</label>
                  <SelectBox
                    dataSource={conditionOptions}
                    displayExpr="text"
                    valueExpr="value"
                    value={formData.fuelSensorCondition}
                    onValueChanged={(e) =>
                      handleFieldChange("fuelSensorCondition", e.value)
                    }
                    className="tw-mt-1"
                  />
                </div>
                <div className="tw-flex tw-items-center tw-gap-3">
                  <label className="tw-text-sm tw-text-gray-600">Working:</label>
                  <Switch
                    value={formData.fuelSensorWorking}
                    onValueChanged={(e) =>
                      handleFieldChange("fuelSensorWorking", e.value)
                    }
                  />
                  <span className="tw-text-sm">
                    {formData.fuelSensorWorking ? "Yes" : "No"}
                  </span>
                </div>
                <div>
                  <label className="tw-text-sm tw-text-gray-600">Remarks</label>
                  <TextBox
                    value={formData.fuelSensorRemarks}
                    onValueChanged={(e) =>
                      handleFieldChange("fuelSensorRemarks", e.value)
                    }
                    placeholder="Fuel sensor remarks"
                    className="tw-mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Departure/Arrival Info */}
          <div className="tw-bg-white tw-border tw-rounded-lg tw-p-4">
            <h3 className="tw-font-semibold tw-text-gray-800 tw-mb-4">
              <i className="fa-light fa-clock tw-mr-2"></i>
              Departure / Arrival
            </h3>

            <div className="tw-grid tw-grid-cols-2 tw-gap-4">
              <div>
                <label className="tw-text-sm tw-text-gray-600">
                  Departure Time
                </label>
                <DateBox
                  value={formData.departureTime}
                  onValueChanged={(e) =>
                    handleFieldChange("departureTime", e.value)
                  }
                  type="datetime"
                  displayFormat="dd/MM/yyyy HH:mm"
                  className="tw-mt-1"
                />
              </div>
              <div>
                <label className="tw-text-sm tw-text-gray-600">
                  Arrival Time
                </label>
                <DateBox
                  value={formData.arrivalTime}
                  onValueChanged={(e) =>
                    handleFieldChange("arrivalTime", e.value)
                  }
                  type="datetime"
                  displayFormat="dd/MM/yyyy HH:mm"
                  className="tw-mt-1"
                />
              </div>
            </div>

            <div className="tw-flex tw-gap-6 tw-mt-4">
              <label className="tw-flex tw-items-center tw-gap-2">
                <input
                  type="checkbox"
                  checked={formData.antiTheftCheckedDeparture}
                  onChange={(e) =>
                    handleFieldChange(
                      "antiTheftCheckedDeparture",
                      e.target.checked
                    )
                  }
                  className="tw-w-4 tw-h-4"
                />
                <span className="tw-text-sm">Anti-theft Checked (Departure)</span>
              </label>
              <label className="tw-flex tw-items-center tw-gap-2">
                <input
                  type="checkbox"
                  checked={formData.keysInEnvelopeChecked}
                  onChange={(e) =>
                    handleFieldChange("keysInEnvelopeChecked", e.target.checked)
                  }
                  className="tw-w-4 tw-h-4"
                />
                <span className="tw-text-sm">Keys in Envelope</span>
              </label>
            </div>
          </div>

          {/* Document Upload */}
          <div className="tw-bg-white tw-border tw-rounded-lg tw-p-4">
            <h3 className="tw-font-semibold tw-text-gray-800 tw-mb-4">
              <i className="fa-light fa-upload tw-mr-2"></i>
              Document Upload
            </h3>

            <FileUploader
              selectButtonText="Select Transfer Document"
              labelText="or drop file here"
              accept=".pdf,.jpg,.jpeg,.png"
              uploadMode="useForm"
              onValueChanged={(e) => setDocumentFile(e.value?.[0] || null)}
            />
            {documentFile && (
              <p className="tw-mt-2 tw-text-sm tw-text-green-600">
                <i className="fa-light fa-check tw-mr-1"></i>
                {documentFile.name}
              </p>
            )}
          </div>
        </div>

        {/* Right Column - Checkup Items */}
        <div className="tw-space-y-6">
          {/* Checkup Items Grid */}
          <div className="tw-bg-white tw-border tw-rounded-lg tw-p-4">
            <h3 className="tw-font-semibold tw-text-gray-800 tw-mb-4">
              <i className="fa-light fa-clipboard-check tw-mr-2"></i>
              Equipment Checkup Items
            </h3>

            <DataGrid
              dataSource={checkupItems}
              showBorders={true}
              columnAutoWidth={true}
              rowAlternationEnabled={true}
              keyExpr="serialNo"
              height={400}
              onRowUpdated={(e) => {
                const updated = checkupItems.map((item) =>
                  item.serialNo === e.key ? { ...item, ...e.data } : item
                );
                setCheckupItems(updated);
              }}
            >
              <Editing mode="cell" allowUpdating={true} />
              <Column
                dataField="serialNo"
                caption="#"
                width={40}
                allowEditing={false}
              />
              <Column
                dataField="description"
                caption="Check-up Description"
                width={250}
                allowEditing={false}
              />
              <Column
                dataField="checkType"
                caption="Type"
                width={80}
                allowEditing={false}
              />
              <Column
                dataField="isGood"
                caption="Good"
                dataType="boolean"
                width={60}
              />
              <Column
                dataField="isFair"
                caption="Fair"
                dataType="boolean"
                width={60}
              />
              <Column
                dataField="isDamaged"
                caption="Damaged"
                dataType="boolean"
                width={70}
              />
              <Column
                dataField="isWorn"
                caption="Worn"
                dataType="boolean"
                width={60}
              />
              <Column
                dataField="wornPercentage"
                caption="%"
                dataType="number"
                width={50}
              />
              <Column dataField="remarks" caption="Remarks" width={120} />
            </DataGrid>
          </div>

          {/* Service Filter Parts */}
          <div className="tw-bg-white tw-border tw-rounded-lg tw-p-4">
            <h3 className="tw-font-semibold tw-text-gray-800 tw-mb-4">
              <i className="fa-light fa-filter tw-mr-2"></i>
              Service Filters (Part Numbers)
            </h3>

            <DataGrid
              dataSource={serviceFilterParts}
              showBorders={true}
              columnAutoWidth={true}
              rowAlternationEnabled={true}
              keyExpr="number"
              height={200}
              onRowInserted={(e) =>
                setServiceFilterParts([...serviceFilterParts, e.data])
              }
              onRowRemoved={(e) =>
                setServiceFilterParts(
                  serviceFilterParts.filter((p) => p.number !== e.key)
                )
              }
            >
              <Editing
                mode="row"
                allowAdding={true}
                allowDeleting={true}
                allowUpdating={true}
              />
              <Column dataField="number" caption="#" width={50} />
              <Column
                dataField="description"
                caption="Description"
                width={200}
              />
              <Column dataField="partNumber" caption="Part Number" width={150} />
              <Column
                dataField="quantity"
                caption="Qty"
                dataType="number"
                width={60}
              />
            </DataGrid>
          </div>

          {/* Signatures */}
          <div className="tw-bg-white tw-border tw-rounded-lg tw-p-4">
            <h3 className="tw-font-semibold tw-text-gray-800 tw-mb-4">
              <i className="fa-light fa-signature tw-mr-2"></i>
              Signatures & Approvals
            </h3>

            <div className="tw-grid tw-grid-cols-2 tw-gap-4">
              <div>
                <label className="tw-text-sm tw-text-gray-600">
                  Workshop Manager
                </label>
                <TextBox
                  value={formData.workshopManagerSign}
                  onValueChanged={(e) =>
                    handleFieldChange("workshopManagerSign", e.value)
                  }
                  className="tw-mt-1"
                />
              </div>
              <div>
                <label className="tw-text-sm tw-text-gray-600">
                  Approved By
                </label>
                <TextBox
                  value={formData.approvedBy}
                  onValueChanged={(e) =>
                    handleFieldChange("approvedBy", e.value)
                  }
                  className="tw-mt-1"
                />
              </div>
              <div>
                <label className="tw-text-sm tw-text-gray-600">
                  Sender Name
                </label>
                <TextBox
                  value={formData.senderName}
                  onValueChanged={(e) =>
                    handleFieldChange("senderName", e.value)
                  }
                  className="tw-mt-1"
                />
              </div>
              <div>
                <label className="tw-text-sm tw-text-gray-600">
                  Sender Function
                </label>
                <TextBox
                  value={formData.senderFunction}
                  onValueChanged={(e) =>
                    handleFieldChange("senderFunction", e.value)
                  }
                  className="tw-mt-1"
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="tw-bg-gray-50 tw-border tw-rounded-lg tw-p-4">
            <h3 className="tw-font-semibold tw-text-gray-800 tw-mb-4">
              <i className="fa-light fa-cog tw-mr-2"></i>
              Options
            </h3>

            <div className="tw-space-y-3">
              <label className="tw-flex tw-items-center tw-gap-2">
                <input
                  type="checkbox"
                  checked={formData.updateOdometer}
                  onChange={(e) =>
                    handleFieldChange("updateOdometer", e.target.checked)
                  }
                  className="tw-w-4 tw-h-4"
                />
                <span className="tw-text-sm">
                  Update vehicle odometer/hour reading
                </span>
              </label>
              <label className="tw-flex tw-items-center tw-gap-2">
                <input
                  type="checkbox"
                  checked={formData.createMaintenanceEntry}
                  onChange={(e) =>
                    handleFieldChange(
                      "createMaintenanceEntry",
                      e.target.checked
                    )
                  }
                  className="tw-w-4 tw-h-4"
                />
                <span className="tw-text-sm">
                  Create maintenance entry for this transfer inspection
                </span>
              </label>
              <label className="tw-flex tw-items-center tw-gap-2">
                <input
                  type="checkbox"
                  checked={formData.sendEmail}
                  onChange={(e) =>
                    handleFieldChange("sendEmail", e.target.checked)
                  }
                  className="tw-w-4 tw-h-4"
                />
                <span className="tw-text-sm">Send email notification</span>
              </label>
            </div>
          </div>

          {/* Remarks */}
          <div className="tw-bg-white tw-border tw-rounded-lg tw-p-4">
            <h3 className="tw-font-semibold tw-text-gray-800 tw-mb-4">
              <i className="fa-light fa-comment tw-mr-2"></i>
              Remarks
            </h3>
            <TextArea
              value={formData.remarks}
              onValueChanged={(e) => handleFieldChange("remarks", e.value)}
              height={100}
              placeholder="Enter any additional remarks..."
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="tw-flex tw-justify-end tw-gap-4 tw-mt-6 tw-pt-4 tw-border-t">
        <Button
          text="Cancel"
          type="normal"
          stylingMode="outlined"
          onClick={onClose}
          disabled={isSubmitting}
        />
        <Button
          text={isSubmitting ? "Submitting..." : "Create Transfer"}
          type="success"
          stylingMode="contained"
          icon={isSubmitting ? "fa-light fa-spinner fa-spin" : "fa-light fa-check"}
          onClick={handleSubmit}
          disabled={isSubmitting}
        />
      </div>
    </div>
  );
};

export default VehicleTransferForm;
