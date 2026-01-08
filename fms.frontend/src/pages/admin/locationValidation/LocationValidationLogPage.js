/**
 * File: LocationValidationLogPage.js
 * Purpose: Admin page for viewing location validation audit logs with map visualization
 * Dependencies: Redux, DevExtreme, Google Maps API
 * Last Modified: 2026-01-08
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import DataGrid, {
  Column,
  Paging,
  Pager,
  FilterRow,
  HeaderFilter,
  Scrolling,
  Selection,
} from "devextreme-react/data-grid";
import DateBox from "devextreme-react/date-box";
import SelectBox from "devextreme-react/select-box";
import Button from "devextreme-react/button";
import LoadIndicator from "devextreme-react/load-indicator";
import Popup from "devextreme-react/popup";
import notify from "devextreme/ui/notify";
import axiosInstance from "../../../api/axiosInstance";
import {
  fetchLocationValidationLogs,
  setFilters,
  resetFilters,
  setSelectedLog,
  clearSelectedLog,
  selectLogs,
  selectPagination,
  selectFilters,
  selectSelectedLog,
  selectIsLoading,
  setPageNumber,
  setPageSize,
} from "../../../redux/slices/locationValidationSlice";

import "./LocationValidationLogPage.scss";

const LocationValidationLogPage = () => {
  const dispatch = useDispatch();
  const logs = useSelector(selectLogs);
  const pagination = useSelector(selectPagination);
  const filters = useSelector(selectFilters);
  const selectedLog = useSelector(selectSelectedLog);
  const isLoading = useSelector(selectIsLoading);

  const [mapApiKey, setMapApiKey] = useState(null);
  const [showMapPopup, setShowMapPopup] = useState(false);
  const [popupLog, setPopupLog] = useState(null); // Local state for popup content
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const validationResultOptions = [
    { value: null, text: "All" },
    { value: "Passed", text: "Passed" },
    { value: "Failed", text: "Failed" },
    { value: "Bypassed", text: "Bypassed" },
    { value: "Skipped", text: "Skipped" },
  ];

  const isValidOptions = [
    { value: null, text: "All" },
    { value: true, text: "Valid" },
    { value: false, text: "Invalid" },
  ];

  // Load data on mount and when filters change
  useEffect(() => {
    loadData();
    loadMapApiKey();
  }, []);

  const loadData = useCallback(() => {
    dispatch(
      fetchLocationValidationLogs({
        ...filters,
        pageNumber: pagination.pageNumber,
        pageSize: pagination.pageSize,
      })
    );
  }, [dispatch, filters, pagination.pageNumber, pagination.pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadMapApiKey = async () => {
    try {
      const response = await axiosInstance.get(
        "/SystemConfiguration/by-key/GoogleMaps.ApiKey"
      );
      if (
        response.data &&
        (response.data.success || response.data.isSuccess) &&
        response.data.data
      ) {
        setMapApiKey(response.data.data.configurationValue);
      }
    } catch (error) {
      console.error("Error loading Google Maps API key:", error);
    }
  };

  const handleApplyFilters = () => {
    dispatch(setPageNumber(1));
    loadData();
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
    dispatch(setPageNumber(1));
  };

  const handleRowClick = (e) => {
    if (e.data) {
      console.log("Row clicked, data:", e.data); // Debug log
      setPopupLog(e.data); // Set local state first
      dispatch(setSelectedLog(e.data));
      setShowMapPopup(true);
    }
  };

  const handleClosePopup = () => {
    setShowMapPopup(false);
    setPopupLog(null);
    dispatch(clearSelectedLog());
  };

  const handlePageChanged = (e) => {
    if (e.fullName === "paging.pageIndex") {
      dispatch(setPageNumber(e.value + 1));
    }
    if (e.fullName === "paging.pageSize") {
      dispatch(setPageSize(e.value));
    }
  };

  // Initialize map when popup opens
  useEffect(() => {
    if (showMapPopup && popupLog && mapApiKey) {
      // Wait for popup to render
      setTimeout(() => {
        initializeMap();
      }, 500);
    }
  }, [showMapPopup, popupLog, mapApiKey]);

  const loadGoogleMapsScript = () => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve();
        return;
      }

      const existingScript = document.querySelector(
        'script[src*="maps.googleapis.com"]'
      );
      if (existingScript) {
        existingScript.addEventListener("load", resolve);
        existingScript.addEventListener("error", reject);
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${mapApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const initializeMap = async () => {
    if (!mapRef.current || !popupLog) return;

    try {
      await loadGoogleMapsScript();

      // Determine center and markers based on available data
      const markers = [];
      let centerLat = null;
      let centerLng = null;

      // Tank location
      if (popupLog.tankLatitude && popupLog.tankLongitude) {
        markers.push({
          lat: parseFloat(popupLog.tankLatitude),
          lng: parseFloat(popupLog.tankLongitude),
          title: "Tank/Dispenser",
          icon: "tank",
          color: "#2563eb", // blue
        });
        centerLat = parseFloat(popupLog.tankLatitude);
        centerLng = parseFloat(popupLog.tankLongitude);
      }

      // Vehicle location
      if (popupLog.vehicleLatitude && popupLog.vehicleLongitude) {
        markers.push({
          lat: parseFloat(popupLog.vehicleLatitude),
          lng: parseFloat(popupLog.vehicleLongitude),
          title: `Vehicle (${popupLog.vehicleName || popupLog.vehicleId})`,
          icon: "vehicle",
          color: "#16a34a", // green
        });
        if (!centerLat) {
          centerLat = parseFloat(popupLog.vehicleLatitude);
          centerLng = parseFloat(popupLog.vehicleLongitude);
        }
      }

      // Mobile location
      if (popupLog.mobileLatitude && popupLog.mobileLongitude) {
        markers.push({
          lat: parseFloat(popupLog.mobileLatitude),
          lng: parseFloat(popupLog.mobileLongitude),
          title: "Mobile App",
          icon: "mobile",
          color: "#9333ea", // purple
        });
        if (!centerLat) {
          centerLat = parseFloat(popupLog.mobileLatitude);
          centerLng = parseFloat(popupLog.mobileLongitude);
        }
      }

      if (!centerLat || !centerLng) {
        console.warn("No valid coordinates to display");
        return;
      }

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: centerLat, lng: centerLng },
        zoom: 14,
        mapTypeId: "roadmap",
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
      });

      // Add markers
      const bounds = new window.google.maps.LatLngBounds();
      markers.forEach((m) => {
        const position = { lat: m.lat, lng: m.lng };
        bounds.extend(position);

        const marker = new window.google.maps.Marker({
          position,
          map,
          title: m.title,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: m.color,
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });

        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${m.title}</h4>
              <p style="margin: 4px 0; font-size: 12px;"><strong>Lat:</strong> ${m.lat.toFixed(6)}</p>
              <p style="margin: 4px 0; font-size: 12px;"><strong>Lng:</strong> ${m.lng.toFixed(6)}</p>
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });
      });

      // Draw line between tank and vehicle if both exist
      if (
        popupLog.tankLatitude &&
        popupLog.tankLongitude &&
        popupLog.vehicleLatitude &&
        popupLog.vehicleLongitude
      ) {
        new window.google.maps.Polyline({
          path: [
            {
              lat: parseFloat(popupLog.tankLatitude),
              lng: parseFloat(popupLog.tankLongitude),
            },
            {
              lat: parseFloat(popupLog.vehicleLatitude),
              lng: parseFloat(popupLog.vehicleLongitude),
            },
          ],
          map,
          geodesic: true,
          strokeColor: popupLog.isValid ? "#16a34a" : "#dc2626",
          strokeOpacity: 0.8,
          strokeWeight: 3,
        });
      }

      // Fit bounds if multiple markers
      if (markers.length > 1) {
        map.fitBounds(bounds);
      }

      mapInstanceRef.current = map;
    } catch (error) {
      console.error("Error initializing map:", error);
      notify("Failed to load map", "error", 3000);
    }
  };

  const getStatusBadge = (result, isValid) => {
    const classes = {
      Passed: "tw-bg-green-100 tw-text-green-800",
      Failed: "tw-bg-red-100 tw-text-red-800",
      Bypassed: "tw-bg-yellow-100 tw-text-yellow-800",
      Skipped: "tw-bg-gray-100 tw-text-gray-800",
    };
    return (
      <span
        className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${classes[result] || "tw-bg-gray-100"}`}
      >
        {result}
      </span>
    );
  };

  const formatDistance = (meters) => {
    if (!meters && meters !== 0) return "-";
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${meters.toFixed(0)} m`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="location-validation-page tw-p-4">
      {/* Header */}
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-6">
        <div>
          <h1 className="tw-text-2xl tw-font-bold tw-text-gray-800">
            <i className="fa-light fa-location-crosshairs tw-mr-3"></i>
            Location Validation Logs
          </h1>
          <p className="tw-text-gray-500 tw-mt-1">
            View and analyze location validation attempts during fueling
            operations
          </p>
        </div>
        <div className="tw-flex tw-gap-2">
          <Button
            text="Refresh"
            icon="refresh"
            type="default"
            onClick={loadData}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-4 tw-mb-4">
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-5 tw-gap-4">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Start Date
            </label>
            <DateBox
              type="datetime"
              value={filters.startDate}
              onValueChanged={(e) =>
                dispatch(setFilters({ startDate: e.value }))
              }
              placeholder="Start Date"
              showClearButton
              width="100%"
            />
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              End Date
            </label>
            <DateBox
              type="datetime"
              value={filters.endDate}
              onValueChanged={(e) => dispatch(setFilters({ endDate: e.value }))}
              placeholder="End Date"
              showClearButton
              width="100%"
            />
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Result
            </label>
            <SelectBox
              dataSource={validationResultOptions}
              valueExpr="value"
              displayExpr="text"
              value={filters.validationResult}
              onValueChanged={(e) =>
                dispatch(setFilters({ validationResult: e.value }))
              }
              placeholder="All Results"
              showClearButton
              width="100%"
            />
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Valid
            </label>
            <SelectBox
              dataSource={isValidOptions}
              valueExpr="value"
              displayExpr="text"
              value={filters.isValid}
              onValueChanged={(e) =>
                dispatch(setFilters({ isValid: e.value }))
              }
              placeholder="All"
              showClearButton
              width="100%"
            />
          </div>
          <div className="tw-flex tw-items-end tw-gap-2">
            <Button
              text="Apply"
              type="success"
              onClick={handleApplyFilters}
              width="100%"
            />
            <Button
              text="Reset"
              type="normal"
              onClick={handleResetFilters}
              width="100%"
            />
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow">
        <DataGrid
          dataSource={logs}
          showBorders={false}
          columnAutoWidth={true}
          rowAlternationEnabled={true}
          hoverStateEnabled={true}
          onRowClick={handleRowClick}
          onOptionChanged={handlePageChanged}
          height="calc(100vh - 360px)"
        >
          <Scrolling mode="virtual" />
          <FilterRow visible={true} />
          <HeaderFilter visible={true} />
          <Selection mode="single" />

          <Column
            dataField="validationTime"
            caption="Time"
            dataType="datetime"
            format="yyyy-MM-dd HH:mm:ss"
            width={160}
          />
          <Column
            dataField="validationResult"
            caption="Result"
            width={100}
            cellRender={(cellData) =>
              getStatusBadge(cellData.value, cellData.data.isValid)
            }
          />
          <Column dataField="ptsId" caption="PTS Device" width={200} />
          <Column dataField="tankName" caption="Tank" width={150} />
          <Column dataField="vehicleName" caption="Vehicle" width={150} />
          <Column
            dataField="vehicleDistanceMeters"
            caption="Vehicle Distance"
            width={130}
            cellRender={(cellData) => formatDistance(cellData.value)}
          />
          <Column
            dataField="vehicleRadiusUsed"
            caption="Max Radius"
            width={100}
            cellRender={(cellData) =>
              cellData.value ? `${cellData.value} m` : "-"
            }
          />
          <Column
            dataField="vehicleProximityValid"
            caption="Vehicle OK"
            width={90}
            cellRender={(cellData) => (
              <span
                className={
                  cellData.value === true
                    ? "tw-text-green-600"
                    : cellData.value === false
                      ? "tw-text-red-600"
                      : "tw-text-gray-400"
                }
              >
                {cellData.value === true
                  ? "✓"
                  : cellData.value === false
                    ? "✗"
                    : "-"}
              </span>
            )}
          />
          <Column
            dataField="failureReason"
            caption="Failure Reason"
            width={300}
          />
          <Column dataField="userName" caption="User" width={120} />
          <Column
            dataField="transactionId"
            caption="Transaction ID"
            width={120}
          />

          <Paging
            defaultPageSize={50}
            pageSize={pagination.pageSize}
            pageIndex={pagination.pageNumber - 1}
          />
          <Pager
            showPageSizeSelector={true}
            allowedPageSizes={[25, 50, 100]}
            showInfo={true}
            infoText={`Page {0} of {1} (${pagination.totalCount} items)`}
          />
        </DataGrid>
      </div>

      {/* Map Popup */}
      <Popup
        visible={showMapPopup}
        onHiding={handleClosePopup}
        dragEnabled={true}
        closeOnOutsideClick={true}
        showCloseButton={true}
        showTitle={true}
        title="Location Validation Details"
        width={900}
        height={700}
      >
        {popupLog && (
          <div className="tw-flex tw-flex-col tw-h-full">
            {/* Details Section */}
            <div className="tw-grid tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4 tw-mb-4">
              <div className="tw-bg-gray-50 tw-rounded tw-p-3">
                <div className="tw-text-xs tw-text-gray-500">Result</div>
                <div className="tw-mt-1">
                  {getStatusBadge(
                    popupLog.validationResult,
                    popupLog.isValid
                  )}
                </div>
              </div>
              <div className="tw-bg-gray-50 tw-rounded tw-p-3">
                <div className="tw-text-xs tw-text-gray-500">Time</div>
                <div className="tw-text-sm tw-font-medium">
                  {formatDateTime(popupLog.validationTime)}
                </div>
              </div>
              <div className="tw-bg-gray-50 tw-rounded tw-p-3">
                <div className="tw-text-xs tw-text-gray-500">
                  Vehicle Distance
                </div>
                <div className="tw-text-sm tw-font-medium">
                  {formatDistance(popupLog.vehicleDistanceMeters)}
                  {popupLog.vehicleRadiusUsed && (
                    <span className="tw-text-gray-500">
                      {" "}
                      / {popupLog.vehicleRadiusUsed}m max
                    </span>
                  )}
                </div>
              </div>
              <div className="tw-bg-gray-50 tw-rounded tw-p-3">
                <div className="tw-text-xs tw-text-gray-500">Transaction</div>
                <div className="tw-text-sm tw-font-medium">
                  {popupLog.transactionId || "-"}
                </div>
              </div>
            </div>

            {/* Failure Reason */}
            {popupLog.failureReason && (
              <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded tw-p-3 tw-mb-4">
                <div className="tw-text-xs tw-text-red-600 tw-font-medium">
                  Failure Reason
                </div>
                <div className="tw-text-sm tw-text-red-800 tw-mt-1">
                  {popupLog.failureReason}
                </div>
              </div>
            )}

            {/* Map */}
            <div className="tw-flex-1 tw-min-h-0">
              <div className="tw-mb-2 tw-flex tw-gap-4 tw-text-xs">
                <span className="tw-flex tw-items-center tw-gap-1">
                  <span className="tw-w-3 tw-h-3 tw-rounded-full tw-bg-blue-600"></span>
                  Tank/Dispenser
                </span>
                <span className="tw-flex tw-items-center tw-gap-1">
                  <span className="tw-w-3 tw-h-3 tw-rounded-full tw-bg-green-600"></span>
                  Vehicle
                </span>
                <span className="tw-flex tw-items-center tw-gap-1">
                  <span className="tw-w-3 tw-h-3 tw-rounded-full tw-bg-purple-600"></span>
                  Mobile App
                </span>
              </div>
              {mapApiKey ? (
                <div
                  ref={mapRef}
                  className="tw-w-full tw-h-full tw-min-h-[350px] tw-rounded tw-border tw-border-gray-200"
                />
              ) : (
                <div className="tw-flex tw-items-center tw-justify-center tw-h-full tw-bg-gray-100 tw-rounded">
                  <div className="tw-text-center tw-text-gray-500">
                    <i className="fa-light fa-map tw-text-4xl tw-mb-2"></i>
                    <p>Map not available</p>
                    <p className="tw-text-xs">
                      Google Maps API key not configured
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Details */}
            <div className="tw-mt-4 tw-grid tw-grid-cols-2 tw-gap-4 tw-text-xs">
              <div>
                <div className="tw-font-medium tw-text-gray-700 tw-mb-1">
                  Tank Location
                </div>
                <div className="tw-text-gray-600">
                  {popupLog.tankLatitude && popupLog.tankLongitude
                    ? `${parseFloat(popupLog.tankLatitude).toFixed(6)}, ${parseFloat(popupLog.tankLongitude).toFixed(6)}`
                    : "Not available"}
                  {popupLog.tankLocationSource && (
                    <span className="tw-text-gray-400">
                      {" "}
                      ({popupLog.tankLocationSource})
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="tw-font-medium tw-text-gray-700 tw-mb-1">
                  Vehicle Location
                </div>
                <div className="tw-text-gray-600">
                  {popupLog.vehicleLatitude && popupLog.vehicleLongitude
                    ? `${parseFloat(popupLog.vehicleLatitude).toFixed(6)}, ${parseFloat(popupLog.vehicleLongitude).toFixed(6)}`
                    : "Not available"}
                  {popupLog.vehicleGPSAccuracy && (
                    <span className="tw-text-gray-400">
                      {" "}
                      (±{popupLog.vehicleGPSAccuracy}m)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Popup>

      {/* Loading overlay */}
      {isLoading && (
        <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-20 tw-flex tw-items-center tw-justify-center tw-z-50">
          <div className="tw-bg-white tw-rounded-lg tw-p-6 tw-shadow-xl">
            <LoadIndicator width="48px" height="48px" visible={true} />
            <p className="tw-mt-2 tw-text-gray-600">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationValidationLogPage;
