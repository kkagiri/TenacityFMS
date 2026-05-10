/**
 * Step5VehiclePreviewHelpers.js
 * Helper components and configuration for Step 5: Vehicle Data Preview
 */

import React from 'react';
import { Popup } from 'devextreme-react/popup';

// Category configuration matching updated Step4
export const CATEGORY_CONFIG = {
  1: {
    name: 'Site GPS Fleet',
    icon: 'fa-satellite',
    bgColor: 'tw-bg-green-50',
    borderColor: 'tw-border-green-200',
    textColor: 'tw-text-green-700',
    badgeColor: 'tw-bg-green-100 tw-text-green-800',
    confidence: 'HIGH',
    dataSource: 'GPS REST API',
    description: 'Vehicles with GPS + Fuel Sensor. Real-time opening/closing from GPS.',
    canFetchGps: true,
    showOpeningClosing: true
  },
  2: {
    name: 'Site Full Tank',
    icon: 'fa-gas-pump',
    bgColor: 'tw-bg-yellow-50',
    borderColor: 'tw-border-yellow-200',
    textColor: 'tw-text-yellow-700',
    badgeColor: 'tw-bg-yellow-100 tw-text-yellow-800',
    confidence: 'MEDIUM',
    dataSource: 'Full Tank Estimate',
    description: 'Full tank policy vehicles. Opening/Closing = Tank Capacity.',
    canFetchGps: false,
    showOpeningClosing: true
  },
  3: {
    name: 'Site Equipment',
    icon: 'fa-gear',
    bgColor: 'tw-bg-orange-50',
    borderColor: 'tw-border-orange-200',
    textColor: 'tw-text-orange-700',
    badgeColor: 'tw-bg-orange-100 tw-text-orange-800',
    confidence: 'LOW',
    dataSource: 'Fuel Issued Only',
    description: 'Equipment without GPS/sensor. Track fuel dispensed only.',
    canFetchGps: false,
    showOpeningClosing: false
  },
  4: {
    name: 'Cross-Site Company',
    icon: 'fa-arrow-right-arrow-left',
    bgColor: 'tw-bg-cyan-50',
    borderColor: 'tw-border-cyan-200',
    textColor: 'tw-text-cyan-700',
    badgeColor: 'tw-bg-cyan-100 tw-text-cyan-800',
    confidence: 'HIGH',
    dataSource: 'GPS SOAP Report 212',
    description: 'Company vehicles from other sites. Opening=FuelBefore@RefillSite, Closing=FuelBefore@NextRefill.',
    canFetchGps: true,
    showOpeningClosing: true
  },
  5: {
    name: 'External Non-Company',
    icon: 'fa-user-plus',
    bgColor: 'tw-bg-pink-50',
    borderColor: 'tw-border-pink-200',
    textColor: 'tw-text-pink-700',
    badgeColor: 'tw-bg-pink-100 tw-text-pink-800',
    confidence: 'ACCOUNTED',
    dataSource: 'Fuel Issued Only',
    description: 'External/contractor vehicles. Fuel accountability only.',
    canFetchGps: false,
    showOpeningClosing: false
  }
};

// Helper to map data quality values (can be number or string)
export const getDataQualityInfo = (quality) => {
  const qualityMap = {
    1: { label: 'Exact', color: 'tw-text-green-600' },
    2: { label: 'Interpolated', color: 'tw-text-blue-600' },
    3: { label: 'EstimatedFromRefill', color: 'tw-text-yellow-600' },
    4: { label: 'Unavailable', color: 'tw-text-red-600' },
    'Exact': { label: 'Exact', color: 'tw-text-green-600' },
    'Interpolated': { label: 'Interpolated', color: 'tw-text-blue-600' },
    'EstimatedFromRefill': { label: 'Estimated', color: 'tw-text-yellow-600' },
    'Unavailable': { label: 'Unavailable', color: 'tw-text-red-600' },
    'Low': { label: 'Low Quality', color: 'tw-text-orange-600' }
  };
  return qualityMap[quality] || { label: String(quality || '-'), color: 'tw-text-gray-600' };
};

// Render data source badge
export const renderDataSource = (source) => {
  const sourceStr = source != null ? String(source) : null;

  const colors = {
    'GPS_REST': 'tw-bg-green-100 tw-text-green-700',
    'GPS_SOAP': 'tw-bg-cyan-100 tw-text-cyan-700',
    'FullTank': 'tw-bg-yellow-100 tw-text-yellow-700',
    'FullTank_GPS': 'tw-bg-yellow-100 tw-text-yellow-700',
    'Estimated': 'tw-bg-yellow-100 tw-text-yellow-700',
    'FuelRefill': 'tw-bg-gray-100 tw-text-gray-700',
    'Unavailable': 'tw-bg-red-100 tw-text-red-700',
    '1': 'tw-bg-green-100 tw-text-green-700',
    '2': 'tw-bg-cyan-100 tw-text-cyan-700',
    '3': 'tw-bg-yellow-100 tw-text-yellow-700'
  };

  const displayMap = {
    'FullTank_GPS': 'Full Tank',
    '1': 'GPS REST',
    '2': 'GPS SOAP',
    '3': 'Full Tank'
  };

  const displayText = displayMap[sourceStr] || (sourceStr ? sourceStr.replace(/_/g, ' ') : 'N/A');
  return (
    <span className={`tw-px-2 tw-py-0.5 tw-rounded tw-text-xs ${colors[sourceStr] || 'tw-bg-gray-100'}`}>
      {displayText}
    </span>
  );
};

/**
 * GPS Data Details Popup Component
 */
export const GPSDataDetailsPopup = ({
  visible,
  onHiding,
  vehicleDetails
}) => {
  // Don't render if no vehicle details or missing required data
  if (!vehicleDetails || !vehicleDetails.vehicleNo) return null;

  return (
    <Popup
      visible={visible}
      onHiding={onHiding}
      dragEnabled={true}
      hideOnOutsideClick={true}
      showCloseButton={true}
      showTitle={true}
      title={`GPS Data Details - ${vehicleDetails.vehicleNo || 'Unknown'}`}
      width={550}
      height={520}
      contentRender={() => (
        <div className="tw-p-4 tw-space-y-4 tw-overflow-y-auto" style={{ maxHeight: '450px' }}>
          {/* Vehicle Info Header */}
          <div className="tw-bg-blue-50 tw-rounded-lg tw-p-3 tw-border tw-border-blue-200">
            <div className="tw-flex tw-items-center tw-gap-3">
              <i className="fa-light fa-truck tw-text-blue-500 tw-text-xl"></i>
              <div>
                <div className="tw-font-semibold tw-text-gray-800">{vehicleDetails.vehicleNo}</div>
                <div className="tw-text-xs tw-text-gray-500">
                  {vehicleDetails.vehicleTypeName} • {vehicleDetails.driverName || 'No Driver'}
                </div>
                <div className="tw-text-xs tw-text-gray-400">
                  Category {vehicleDetails.vehicleCategory} • {CATEGORY_CONFIG[vehicleDetails.vehicleCategory]?.name || 'Unknown'}
                </div>
              </div>
            </div>
          </div>

          {/* Opening Reading Section */}
          <ReadingSection
            title="Opening Reading"
            icon="fa-play"
            iconColor="tw-text-green-500"
            fuelLevel={vehicleDetails.openingFuel}
            timestamp={vehicleDetails.openingTimestamp}
            dataQuality={vehicleDetails.openingDataQuality}
            wasOnline={vehicleDetails.openingWasOnline}
            daysFromRequested={vehicleDetails.openingDaysFromRequested}
            actualDataDate={vehicleDetails.openingActualDataDate}
            qualityReason={vehicleDetails.openingDataQualityReason}
          />

          {/* Closing Reading Section */}
          <ReadingSection
            title="Closing Reading"
            icon="fa-stop"
            iconColor="tw-text-red-500"
            fuelLevel={vehicleDetails.closingFuel}
            timestamp={vehicleDetails.closingTimestamp}
            dataQuality={vehicleDetails.closingDataQuality}
            wasOnline={vehicleDetails.closingWasOnline}
            daysFromRequested={vehicleDetails.closingDaysFromRequested}
            actualDataDate={vehicleDetails.closingActualDataDate}
            qualityReason={vehicleDetails.closingDataQualityReason}
          />

          {/* Fuel Summary Section */}
          <FuelSummarySection vehicleDetails={vehicleDetails} />

          {/* Data Source Info */}
          <DataSourceInfoSection vehicleDetails={vehicleDetails} />
        </div>
      )}
    />
  );
};

/**
 * Reading Section Component (Opening/Closing)
 */
const ReadingSection = ({
  title,
  icon,
  iconColor,
  fuelLevel,
  timestamp,
  dataQuality,
  wasOnline,
  daysFromRequested,
  actualDataDate,
  qualityReason
}) => {
  const qualityInfo = getDataQualityInfo(dataQuality);

  return (
    <div className="tw-border tw-rounded-lg tw-overflow-hidden">
      <div className="tw-bg-gray-100 tw-px-3 tw-py-2 tw-border-b tw-flex tw-items-center tw-gap-2">
        <i className={`fa-light ${icon} ${iconColor}`}></i>
        <span className="tw-font-medium tw-text-gray-700">{title}</span>
      </div>
      <div className="tw-p-3 tw-space-y-2 tw-text-sm">
        <div className="tw-grid tw-grid-cols-2 tw-gap-2">
          <div>
            <span className="tw-text-gray-500">Fuel Level:</span>
            <span className="tw-ml-2 tw-font-medium">{fuelLevel?.toFixed(2) ?? '-'} L</span>
          </div>
          <div>
            <span className="tw-text-gray-500">Timestamp:</span>
            <span className="tw-ml-2 tw-font-medium">
              {timestamp ? new Date(timestamp).toLocaleString() : '-'}
            </span>
          </div>
        </div>
        <div className="tw-grid tw-grid-cols-2 tw-gap-2">
          <div>
            <span className="tw-text-gray-500">Data Quality:</span>
            <span className={`tw-ml-2 tw-font-medium ${qualityInfo.color}`}>
              {qualityInfo.label}
            </span>
          </div>
          <div>
            <span className="tw-text-gray-500">Was Online:</span>
            <span className="tw-ml-2">
              {wasOnline === true || wasOnline === 1 ? (
                <i className="fa-light fa-circle-check tw-text-green-500" title="Online"></i>
              ) : wasOnline === false || wasOnline === 0 ? (
                <i className="fa-light fa-circle-xmark tw-text-red-500" title="Offline"></i>
              ) : <span className="tw-text-gray-400">-</span>}
            </span>
          </div>
        </div>
        <div className="tw-grid tw-grid-cols-2 tw-gap-2">
          <div>
            <span className="tw-text-gray-500">Days from Requested:</span>
            <span className={`tw-ml-2 tw-font-medium ${
              daysFromRequested === 0 ? 'tw-text-green-600' :
              Math.abs(daysFromRequested || 0) <= 1 ? 'tw-text-yellow-600' :
              'tw-text-red-600'
            }`}>
              {daysFromRequested ?? '-'} {daysFromRequested !== null ? 'days' : ''}
            </span>
          </div>
          <div>
            <span className="tw-text-gray-500">Actual Data Date:</span>
            <span className="tw-ml-2 tw-font-medium">
              {actualDataDate ? new Date(actualDataDate).toLocaleDateString() : '-'}
            </span>
          </div>
        </div>
        {qualityReason && (
          <div className="tw-bg-gray-50 tw-p-2 tw-rounded tw-text-xs tw-text-gray-600">
            <i className="fa-light fa-info-circle tw-mr-1"></i>
            {qualityReason}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Fuel Summary Section Component
 */
const FuelSummarySection = ({ vehicleDetails }) => {
  const variance = vehicleDetails.consumptionVariance || 0;
  const absVariance = Math.abs(variance);

  return (
    <div className="tw-border tw-rounded-lg tw-overflow-hidden">
      <div className="tw-bg-gray-100 tw-px-3 tw-py-2 tw-border-b tw-flex tw-items-center tw-gap-2">
        <i className="fa-light fa-gas-pump tw-text-blue-500"></i>
        <span className="tw-font-medium tw-text-gray-700">Fuel Summary</span>
      </div>
      <div className="tw-p-3 tw-text-sm">
        <div className="tw-grid tw-grid-cols-2 tw-gap-3">
          <div className="tw-bg-green-50 tw-p-2 tw-rounded tw-border tw-border-green-200">
            <div className="tw-text-xs tw-text-gray-500">Dispensed (Refill)</div>
            <div className="tw-font-semibold tw-text-green-600">
              {vehicleDetails.totalFuelAmount?.toFixed(2) ?? '0.00'} L
            </div>
          </div>
          <div className="tw-bg-orange-50 tw-p-2 tw-rounded tw-border tw-border-orange-200">
            <div className="tw-text-xs tw-text-gray-500">Vehicle Consumption (GPS)</div>
            <div className="tw-font-semibold tw-text-orange-600">
              {vehicleDetails.gpsMeasuredConsumption?.toFixed(2) ?? '0.00'} L
            </div>
          </div>
          <div className="tw-bg-blue-50 tw-p-2 tw-rounded tw-border tw-border-blue-200">
            <div className="tw-text-xs tw-text-gray-500">Manual Fuel Consumed</div>
            <div className="tw-font-semibold tw-text-blue-600">
              {vehicleDetails.consumption?.toFixed(2) ?? '0.00'} L
            </div>
          </div>
          <div className={`tw-p-2 tw-rounded tw-border ${
            absVariance < 5 ? 'tw-bg-green-50 tw-border-green-200' :
            absVariance < 20 ? 'tw-bg-yellow-50 tw-border-yellow-200' :
            'tw-bg-red-50 tw-border-red-200'
          }`}>
            <div className="tw-text-xs tw-text-gray-500">Variance</div>
            <div className={`tw-font-semibold ${
              absVariance < 5 ? 'tw-text-green-600' :
              absVariance < 20 ? 'tw-text-yellow-600' :
              'tw-text-red-600'
            }`}>
              {vehicleDetails.consumptionVariance?.toFixed(2) ?? '0.00'} L
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Data Source Info Section Component
 */
const DataSourceInfoSection = ({ vehicleDetails }) => {
  return (
    <div className="tw-bg-gray-50 tw-p-3 tw-rounded-lg tw-border tw-text-xs tw-text-gray-600">
      <div className="tw-flex tw-items-start tw-gap-2">
        <i className="fa-light fa-database tw-text-gray-400 tw-mt-0.5"></i>
        <div className="tw-space-y-1">
          <div className="tw-font-medium tw-text-gray-700">Data Source Info</div>
          {vehicleDetails.dataSourcePrimary && (
            <div><span className="tw-text-gray-500">Source:</span> {vehicleDetails.dataSourcePrimary}</div>
          )}
          {vehicleDetails.dataConfidence && (
            <div><span className="tw-text-gray-500">Confidence:</span> {vehicleDetails.dataConfidence}</div>
          )}
          {vehicleDetails.dataSourceSummary && (
            <div><span className="tw-text-gray-500">Summary:</span> {vehicleDetails.dataSourceSummary}</div>
          )}
          {vehicleDetails.hasVarianceFlag && vehicleDetails.varianceFlagMessage && (
            <div className="tw-mt-2 tw-p-2 tw-bg-yellow-50 tw-rounded tw-border tw-border-yellow-200 tw-text-yellow-700">
              <i className="fa-light fa-exclamation-triangle tw-mr-1"></i>
              {vehicleDetails.varianceFlagMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Data Source Legend Component
 */
export const DataSourceLegend = () => {
  return (
    <div className="tw-mt-6 tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-border">
      <h4 className="tw-font-medium tw-text-gray-700 tw-mb-3">
        <i className="fa-light fa-info-circle tw-mr-2"></i>
        Data Source Legend
      </h4>
      <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 tw-gap-3 tw-text-xs">
        <div className="tw-flex tw-items-center tw-gap-2">
          {renderDataSource('GPS_REST')}
          <span className="tw-text-gray-600">Real-time GPS fuel sensor</span>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          {renderDataSource('GPS_SOAP')}
          <span className="tw-text-gray-600">Historical refuel events</span>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          {renderDataSource('FullTank')}
          <span className="tw-text-gray-600">Tank capacity estimate</span>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          {renderDataSource('FuelRefill')}
          <span className="tw-text-gray-600">Manual entry records</span>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-location-dot tw-text-blue-500"></i>
          <span className="tw-text-gray-600">GPS Tracking</span>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-gauge tw-text-green-500"></i>
          <span className="tw-text-gray-600">Fuel Sensor</span>
        </div>
      </div>
    </div>
  );
};
