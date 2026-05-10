/**
 * File:          GpsIssuePopup.js
 * Purpose:       Side panel form for creating a GPS-related issue ticket from the Vehicle Transfer wizard.
 *                Pre-fills GPS details, supports department-filtered assignee selection.
 * Dependencies:  SlidePanel, DevExtreme (TagBox), axiosInstance, issueTrackerService
 * Last Modified: 2026-04-09
 *
 * Key Functions:
 * - Fetches departments list and users per department
 * - Auto-selects "Control Room and GPS" department (ID=9) by default
 * - Creates issue via issueTrackerService.createIssue()
 */

import React, { useState, useEffect, useCallback } from "react";
import { TagBox } from "devextreme-react/tag-box";
import notify from "devextreme/ui/notify";
import axiosInstance from "../../../../api/axiosInstance";
import issueTrackerService from "../../../../services/issueTrackerService";
import SlidePanel from "../../../../components/ui/SlidePanel";
import "./GpsIssuePopup.scss";

const GPS_DEPARTMENT_ID = 9;
const GPS_ISSUE_CATEGORY_ID = 1; // GPSDEVICE

const PRIORITY_OPTIONS = [
  { value: 1, text: "Low" },
  { value: 2, text: "Medium" },
  { value: 3, text: "High" },
  { value: 4, text: "Critical" },
];

const GpsIssuePopup = ({
  visible,
  onHide,
  vehicleId,
  vehicleNumber,
  fromSiteId,
  fromSiteName,
  gpsMapping,
  gpsInfo,
  gpsCondition,
  gpsWorking,
  currentUserName,
  onIssueCreated,
}) => {
  const [departments, setDepartments] = useState([]);
  const [departmentUsers, setDepartmentUsers] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState(GPS_DEPARTMENT_ID);
  const [selectedUsernames, setSelectedUsernames] = useState([]);
  const [priority, setPriority] = useState(3); // High by default for GPS issues
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const deviceName = gpsMapping?.deviceName || gpsInfo?.deviceName || "Unknown";
  const deviceIMEI = gpsMapping?.deviceIMEI || gpsInfo?.deviceIMEI || "N/A";

  const defaultTitle = `GPS Not Returning Live Data - ${vehicleNumber || "Vehicle"}`;
  const defaultDescription =
    `GPS device is not returning live data for vehicle ${vehicleNumber || "N/A"} at site ${fromSiteName || "N/A"}.\n\n` +
    `Device: ${deviceName}\n` +
    `IMEI: ${deviceIMEI}\n` +
    `Condition: ${gpsCondition || "Not assessed"}\n` +
    `Working: ${gpsWorking || "Not assessed"}\n\n` +
    `This issue was raised during a vehicle transfer checkup.`;

  // Fetch departments on mount
  useEffect(() => {
    if (!visible) return;
    const fetchDepartments = async () => {
      try {
        const response = await axiosInstance.get("/department/all");
        if (response.data?.isSuccess) {
          setDepartments(response.data.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch departments:", error);
      }
    };
    fetchDepartments();
  }, [visible]);

  // Fetch users when department changes
  useEffect(() => {
    if (!visible || !selectedDeptId) {
      setDepartmentUsers([]);
      return;
    }
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        const response = await axiosInstance.get(`/department/${selectedDeptId}/users`);
        if (response.data?.isSuccess) {
          setDepartmentUsers(response.data.data || []);
        } else {
          setDepartmentUsers([]);
        }
      } catch (error) {
        console.error("Failed to fetch department users:", error);
        setDepartmentUsers([]);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [visible, selectedDeptId]);

  // Reset form when popup opens
  useEffect(() => {
    if (visible) {
      setSelectedDeptId(GPS_DEPARTMENT_ID);
      setSelectedUsernames([]);
      setPriority(3);
      setNotes("");
    }
  }, [visible]);

  const handleSubmit = useCallback(async () => {
    if (selectedUsernames.length === 0) {
      notify("Please select at least one assignee", "warning", 3000);
      return;
    }

    setIsSubmitting(true);
    try {
      const issueData = {
        issueCategory: GPS_ISSUE_CATEGORY_ID,
        site: fromSiteId || 0,
        vehicle: vehicleId || 0,
        openby: currentUserName || "",
        assignTo: selectedUsernames.join(";"),
        problemTitle: defaultTitle,
        problemDescription: notes ? `${defaultDescription}\n\nAdditional Notes:\n${notes}` : defaultDescription,
        priority: priority,
        status: 1, // Open
      };

      await issueTrackerService.createIssue(issueData);
      if (onIssueCreated) onIssueCreated();
      onHide();
    } catch (error) {
      notify(
        error.message || "Failed to create GPS issue",
        "error",
        3000
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    selectedUsernames, fromSiteId, vehicleId, currentUserName,
    defaultTitle, defaultDescription, notes, priority, onIssueCreated, onHide,
  ]);

  return (
    <SlidePanel
      open={visible}
      onClose={onHide}
      title="Send GPS Issue to Department"
      width={540}
      panelClassName="gps-issue-panel"
    >
      <div className="gps-issue-panel__content">
        <div className="gps-issue-panel__hero">
          <div className="gps-issue-panel__hero-icon">
            <i className="fa-light fa-satellite-dish" />
          </div>
          <div className="gps-issue-panel__hero-copy">
            <h4>Create GPS Department Issue</h4>
            <p>
              Raise a ticket for the GPS department and assign the right users to investigate this non-reporting device.
            </p>
          </div>
        </div>

        <div className="gps-issue-panel__section">
          <div className="gps-issue-panel__section-header">
            <i className="fa-light fa-circle-info" />
            <span>Issue Summary</span>
          </div>
          <div className="gps-issue-panel__summary-grid">
            <div className="gps-issue-panel__summary-card">
              <span className="gps-issue-panel__summary-label">Vehicle</span>
              <span className="gps-issue-panel__summary-value">{vehicleNumber || "N/A"}</span>
            </div>
            <div className="gps-issue-panel__summary-card">
              <span className="gps-issue-panel__summary-label">Site</span>
              <span className="gps-issue-panel__summary-value">{fromSiteName || "N/A"}</span>
            </div>
            <div className="gps-issue-panel__summary-card">
              <span className="gps-issue-panel__summary-label">Device</span>
              <span className="gps-issue-panel__summary-value">{deviceName}</span>
            </div>
            <div className="gps-issue-panel__summary-card">
              <span className="gps-issue-panel__summary-label">IMEI</span>
              <span className="gps-issue-panel__summary-value">{deviceIMEI}</span>
            </div>
            <div className="gps-issue-panel__summary-card">
              <span className="gps-issue-panel__summary-label">Condition</span>
              <span className="gps-issue-panel__summary-value">{gpsCondition || "Not assessed"}</span>
            </div>
            <div className="gps-issue-panel__summary-card">
              <span className="gps-issue-panel__summary-label">Working</span>
              <span className="gps-issue-panel__summary-value">{gpsWorking || "Not assessed"}</span>
            </div>
          </div>
        </div>

        <div className="gps-issue-panel__section">
          <div className="gps-issue-panel__section-header">
            <i className="fa-light fa-users" />
            <span>Assignment</span>
          </div>
          <div className="gps-issue-panel__field">
            <label className="gps-issue-panel__label" htmlFor="gpsIssueDepartment">
              Department
            </label>
            <select
              id="gpsIssueDepartment"
              className="m365-select gps-issue-panel__control"
              value={selectedDeptId || ""}
              onChange={(e) => {
                const nextValue = e.target.value ? Number(e.target.value) : null;
                setSelectedDeptId(nextValue);
                setSelectedUsernames([]);
              }}
            >
              <option value="">Select department...</option>
              {departments.map((department) => (
                <option key={department.departmentId} value={department.departmentId}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>
          <div className="gps-issue-panel__field">
            <label className="gps-issue-panel__label" htmlFor="gpsIssueUsers">
              Users {isLoadingUsers && <i className="fa-light fa-spinner fa-spin gps-issue-panel__spinner" />}
            </label>
            <div className="gps-issue-panel__tagbox">
              <TagBox
                inputAttr={{ id: "gpsIssueUsers" }}
                dataSource={departmentUsers}
                displayExpr="displayName"
                valueExpr="userName"
                value={selectedUsernames}
                onValueChanged={(e) => setSelectedUsernames(e.value || [])}
                placeholder={departmentUsers.length === 0 ? "No users in this department" : "Select users..."}
                searchEnabled={true}
                showSelectionControls={true}
                disabled={departmentUsers.length === 0}
                stylingMode="outlined"
              />
            </div>
            {selectedDeptId && departmentUsers.length === 0 && !isLoadingUsers && (
              <p className="gps-issue-panel__warning">
                <i className="fa-light fa-triangle-exclamation" />
                No users are assigned to this department. Select another department or update department membership.
              </p>
            )}
          </div>
        </div>

        <div className="gps-issue-panel__section">
          <div className="gps-issue-panel__section-header">
            <i className="fa-light fa-file-lines" />
            <span>Issue Details</span>
          </div>
          <div className="gps-issue-panel__field">
            <label className="gps-issue-panel__label" htmlFor="gpsIssuePriority">
              Priority
            </label>
            <select
              id="gpsIssuePriority"
              className="m365-select gps-issue-panel__control"
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
            >
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.text}
                </option>
              ))}
            </select>
          </div>
          <div className="gps-issue-panel__field">
            <label className="gps-issue-panel__label" htmlFor="gpsIssueTitle">
              Issue Title
            </label>
            <input
              id="gpsIssueTitle"
              className="m365-input gps-issue-panel__control"
              value={defaultTitle}
              readOnly
            />
          </div>
          <div className="gps-issue-panel__field">
            <label className="gps-issue-panel__label" htmlFor="gpsIssueNotes">
              Additional Notes
            </label>
            <textarea
              id="gpsIssueNotes"
              className="gps-issue-panel__textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes for the GPS department..."
              rows={4}
            />
          </div>
        </div>

        <div className="gps-issue-panel__footer">
          <button
            type="button"
            className="m365-btn m365-btn--ghost"
            onClick={onHide}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="m365-btn m365-btn--primary"
            onClick={handleSubmit}
            disabled={isSubmitting || selectedUsernames.length === 0}
          >
            {isSubmitting ? (
              <><i className="fa-light fa-spinner fa-spin" /> Creating...</>
            ) : (
              <><i className="fa-light fa-paper-plane" /> Create Issue & Notify</>
            )}
          </button>
        </div>
      </div>
    </SlidePanel>
  );
};

export default GpsIssuePopup;
