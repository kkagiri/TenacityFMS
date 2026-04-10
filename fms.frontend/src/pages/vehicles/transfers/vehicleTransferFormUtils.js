/**
 * File: vehicleTransferFormUtils.js
 * Purpose: Shared mapping and validation helpers for the vehicle transfer wizard.
 * Dependencies: None
 * Last Modified: 2026-02-26
 *
 * Key Functions:
 * - isEquipmentVehicle: Detects heavy-equipment types for reading unit defaults.
 * - getVehicleTypeName/getVehicleManufacturerName/getVehicleModelName: Normalizes vehicle display names from mixed DTO shapes.
 * - buildVehicleMakeModel: Composes stable make/model label for header display.
 * - getUserId/getUserDisplayName: Normalizes user identity fields for user selectors.
 * - buildCheckupTemplateItems: Normalizes checkup template payload into editable rows.
 * - buildDefaultCheckupItems: Provides fallback checkup rows when API template is unavailable.
 * - getEmployeePhoneNumber: Resolves employee phone across API naming variants.
 * - validateTransferDetails: Runs Step 1 validation rules and returns field error map.
 */

export const DRIVER_PHONE_PATTERN = /^(\+?\d{1,4})?[\s-]?\d{7,15}$/;

const DEFAULT_CHECKUP_TEMPLATE = [
  { serialNo: 1, description: "SUSPENSION", checkType: "CHECK" },
  { serialNo: 2, description: "BRAKES, INDICATORS, GAUGES & FAN BELT", checkType: "CHECK & TEST" },
  { serialNo: 3, description: "COOLING SYSTEM, COOLANT LEVEL & LEAKS", checkType: "CHECK" },
  { serialNo: 4, description: "ENGINE OIL LEVEL & LEAKS", checkType: "CHECK" },
];

const toCheckupItem = (item) => ({
  ...item,
  isGood: false,
  isFair: false,
  isDamaged: false,
  isWorn: false,
  wornPercentage: null,
  remarks: "",
});

const CHECKUP_STATUS_FIELDS = ["isGood", "isFair", "isDamaged", "isWorn"];

export const isPercentageCheckType = (checkType = "") =>
  String(checkType || "").includes("%");

export const normalizeCheckupItemSelection = (item = {}) => {
  const nextItem = {
    ...item,
    isGood: Boolean(item.isGood),
    isFair: Boolean(item.isFair),
    isDamaged: Boolean(item.isDamaged),
    isWorn: Boolean(item.isWorn),
  };

  const selectedField = CHECKUP_STATUS_FIELDS.find((fieldName) => nextItem[fieldName]);

  if (selectedField) {
    CHECKUP_STATUS_FIELDS.forEach((fieldName) => {
      nextItem[fieldName] = fieldName === selectedField;
    });
  }

  if (!isPercentageCheckType(nextItem.checkType) && !nextItem.isWorn) {
    nextItem.wornPercentage = null;
  }

  return nextItem;
};

export const applyCheckupItemUpdate = (item, updates = {}) => {
  const mergedItem = {
    ...item,
    ...updates,
  };

  const toggledStatusField = CHECKUP_STATUS_FIELDS.find((fieldName) => Object.prototype.hasOwnProperty.call(updates, fieldName));

  if (toggledStatusField && updates[toggledStatusField]) {
    CHECKUP_STATUS_FIELDS.forEach((fieldName) => {
      mergedItem[fieldName] = fieldName === toggledStatusField;
    });
  }

  return normalizeCheckupItemSelection(mergedItem);
};

export const isEquipmentVehicle = (vehicleTypeName = "") =>
  ["generator", "excavator", "loader", "dozer", "crane", "forklift"].some((keyword) =>
    vehicleTypeName.toLowerCase().includes(keyword)
  );

const readString = (...values) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
};

export const getVehicleTypeName = (vehicle) =>
  readString(
    vehicle?.vehicleType?.name,
    vehicle?.vehicleType?.vehicleTypeName,
    typeof vehicle?.vehicleType === "string" ? vehicle.vehicleType : "",
    vehicle?.vehicleTypeName,
    vehicle?.VehicleTypeName
  );

export const getVehicleManufacturerName = (vehicle) =>
  readString(
    vehicle?.vehicleManufacturer?.name,
    vehicle?.vehicleManufacturer?.vehicleManufacturerName,
    typeof vehicle?.vehicleManufacturer === "string" ? vehicle.vehicleManufacturer : "",
    vehicle?.vehicleManufacturerName,
    vehicle?.VehicleManufacturerName
  );

export const getVehicleModelName = (vehicle) =>
  readString(
    vehicle?.vehicleModel?.name,
    vehicle?.vehicleModel?.vehicleModelName,
    typeof vehicle?.vehicleModel === "string" ? vehicle.vehicleModel : "",
    vehicle?.vehicleModelName,
    vehicle?.VehicleModelName
  );

export const buildVehicleMakeModel = (vehicle) =>
  [getVehicleManufacturerName(vehicle), getVehicleModelName(vehicle)]
    .filter(Boolean)
    .join(" ");

export const getVehicleDisplayNumber = (vehicle) =>
  readString(
    vehicle?.hyoungNo,
    vehicle?.HyoungNo,
    vehicle?.vehicleHyoungNo,
    vehicle?.VehicleHyoungNo
  );

export const getVehicleRegistrationNumber = (vehicle) =>
  readString(
    vehicle?.numberPlate,
    vehicle?.NumberPlate,
    vehicle?.registrationNumber,
    vehicle?.RegistrationNumber,
    vehicle?.vehicleNumberPlate,
    vehicle?.VehicleNumberPlate
  );

export const getVehicleWorkingSiteId = (vehicle) => {
  const rawValue =
    vehicle?.workingSiteId ??
    vehicle?.WorkingSiteId ??
    vehicle?.workingSite?.id ??
    vehicle?.workingSite?.Id ??
    vehicle?.currentSiteId ??
    vehicle?.CurrentSiteId ??
    null;

  const numericValue = Number(rawValue);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
};

export const getUserId = (user) =>
  user?.id ??
  user?.userId ??
  user?.Id ??
  user?.UserId ??
  null;

export const getUserDisplayName = (user) => {
  const firstName = readString(user?.firstName, user?.FirstName);
  const lastName = readString(user?.lastName, user?.LastName);
  const fullName = `${firstName} ${lastName}`.trim();

  return readString(
    user?.fullName,
    user?.fullname,
    fullName,
    user?.userName,
    user?.username,
    user?.name,
    user?.email,
    user?.Email
  );
};

export const buildCheckupTemplateItems = (templateItems = []) =>
  templateItems.map(toCheckupItem).map(normalizeCheckupItemSelection);

export const buildDefaultCheckupItems = () =>
  DEFAULT_CHECKUP_TEMPLATE.map(toCheckupItem).map(normalizeCheckupItemSelection);

export const getEmployeePhoneNumber = (employee) =>
  employee?.employeephoneNumber ||
  employee?.employeePhoneNumber ||
  employee?.phoneNumber ||
  employee?.phone ||
  employee?.mobileNumber ||
  employee?.mobile ||
  "";

export const validateTransferDetails = (formData, isStandaloneMode) => {
  const errors = {};

  if (isStandaloneMode && !formData.vehicleId) {
    errors.vehicleId = "Vehicle is required";
  }

  if (!formData.fromSiteId) {
    errors.fromSiteId = "From site is required";
  }

  if (!formData.toSiteId) {
    errors.toSiteId = "To site is required";
  }

  if (formData.fromSiteId && formData.toSiteId && formData.fromSiteId === formData.toSiteId) {
    errors.toSiteId = "To site must be different from From site";
  }

  if (!formData.transferDate) {
    errors.transferDate = "Transfer date is required";
  }

  const driverPhone = (formData.driverPhone || "").trim();
  if (driverPhone && !DRIVER_PHONE_PATTERN.test(driverPhone)) {
    errors.driverPhone = "Enter a valid phone number";
  }

  if (formData.driverId && !driverPhone) {
    errors.driverPhone = "Driver phone is required";
  }

  if (formData.departureTime && formData.arrivalTime) {
    const departureTime = new Date(formData.departureTime).getTime();
    const arrivalTime = new Date(formData.arrivalTime).getTime();

    if (!Number.isNaN(departureTime) && !Number.isNaN(arrivalTime) && arrivalTime <= departureTime) {
      errors.arrivalTime = "Arrival time must be after departure time";
    }
  }

  const hasCurrentReading = formData.currentReading !== null && formData.currentReading !== undefined;
  const hasNextServiceReading = formData.nextServiceReading !== null && formData.nextServiceReading !== undefined;

  if (hasCurrentReading && hasNextServiceReading) {
    const currentReading = Number(formData.currentReading);
    const nextServiceReading = Number(formData.nextServiceReading);

    if (!Number.isNaN(currentReading) && !Number.isNaN(nextServiceReading) && nextServiceReading <= currentReading) {
      errors.nextServiceReading = "Next service reading must be greater than current reading";
    }
  }

  return errors;
};
