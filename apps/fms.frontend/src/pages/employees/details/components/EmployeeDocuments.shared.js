/**
 * File: EmployeeDocuments.shared.js
 * Purpose: Shared constants and normalizers for employee document workflows.
 * Dependencies: Browser Date APIs.
 * Last Modified: 2026-03-25
 */

export const EMPLOYEE_DOCUMENT_TYPE_OPTIONS = [
  { value: 1, label: "Driving License" },
  { value: 2, label: "National ID" },
  { value: 3, label: "Medical Certificate" },
  { value: 4, label: "Employment Contract" },
  { value: 5, label: "Training Certificate" },
  { value: 99, label: "Other" },
];

export const EMPTY_EMPLOYEE_DOCUMENT_FORM_STATE = {
  id: null,
  documentType: "1",
  documentNumber: "",
  issueDate: "",
  expiryDate: "",
  alertLeadDays: 30,
  issuingAuthority: "",
  notes: "",
  file: null,
};

export const toDateInputValue = (value) => {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = `${parsed.getMonth() + 1}`.padStart(2, "0");
  const day = `${parsed.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatDisplayDate = (value) => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

export const getStatusDescriptor = (status, expiryDate) => {
  if (status === 3) {
    return { key: "expired", label: "Expired", tone: "danger" };
  }

  if (status === 2) {
    return { key: "expiring", label: "Due soon", tone: "warning" };
  }

  if (status === 1) {
    return { key: "valid", label: "Valid", tone: "success" };
  }

  if (expiryDate) {
    const expiry = new Date(expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expiry < today) {
      return { key: "expired", label: "Expired", tone: "danger" };
    }
  }

  return { key: "valid", label: "Valid", tone: "success" };
};

export const normalizeEmployeeDocument = (document) => {
  const documentType = Number(document?.documentType ?? document?.DocumentType ?? 99);

  return {
    id: document?.id ?? document?.Id ?? null,
    employeeId: Number(document?.employeeId ?? document?.EmployeeId ?? 0),
    employeeName: document?.employeeName ?? document?.EmployeeName ?? "",
    employeeWorkNo: document?.employeeWorkNo ?? document?.EmployeeWorkNo ?? "",
    documentType,
    documentTypeName:
      document?.documentTypeName ??
      document?.DocumentTypeName ??
      EMPLOYEE_DOCUMENT_TYPE_OPTIONS.find((option) => option.value === documentType)?.label ??
      "Other",
    documentNumber: document?.documentNumber ?? document?.DocumentNumber ?? "",
    issueDate: document?.issueDate ?? document?.IssueDate ?? null,
    expiryDate: document?.expiryDate ?? document?.ExpiryDate ?? null,
    alertLeadDays: Number(document?.alertLeadDays ?? document?.AlertLeadDays ?? 30) || 30,
    issuingAuthority: document?.issuingAuthority ?? document?.IssuingAuthority ?? "",
    notes: document?.notes ?? document?.Notes ?? "",
    documentFileName: document?.documentFileName ?? document?.DocumentFileName ?? "",
    documentFileUrl: document?.documentFileUrl ?? document?.DocumentFileUrl ?? "",
    status: Number(document?.status ?? document?.Status ?? 0),
    daysUntilExpiry: Number(document?.daysUntilExpiry ?? document?.DaysUntilExpiry ?? 0) || 0,
    createdAt: document?.createdAt ?? document?.CreatedAt ?? null,
  };
};