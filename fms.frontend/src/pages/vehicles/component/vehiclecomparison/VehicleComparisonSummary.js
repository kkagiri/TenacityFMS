/**
 * File: VehicleComparisonSummary.js
 * Purpose: Display summary statistics for vehicle consumption comparison
 * Dependencies: react
 * Last Modified: 2025-11-08
 */

import React, { useMemo } from 'react';

const VehicleComparisonSummary = ({ data, groupBy }) => {
  const summaryStats = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        totalVehicles: 0,
        totalSites: 0,
        totalDays: 0,
        totalDistance: 0,
        totalFuel: 0,
        totalFuelLost: 0,
        totalEngineHours: 0,
        avgEfficiencyKmL: 0,
        avgEfficiencyLHr: 0,
        kmLCount: 0,
        lHrCount: 0,
        bestEfficiencyVehicle: null,
        worstEfficiencyVehicle: null
      };
    }

    // Calculate unique counts
    const uniqueVehicles = new Set(data.map(item => item.vehicleId));
    const uniqueSites = new Set(data.map(item => item.siteId));
    const uniqueDates = new Set(data.map(item =>
      new Date(item.date).toDateString()
    ));

    // Separate km/L and L/hr records
    const kmLRecords = data.filter(item =>
      item.isAverageKm && item.totalDistance > 0 && item.totalFuel > 0
    );
    const lHrRecords = data.filter(item =>
      !item.isAverageKm && item.engHours > 0 && item.totalFuel > 0
    );

    // Calculate average efficiencies
    const avgKmL = kmLRecords.length > 0
      ? kmLRecords.reduce((sum, item) => sum + (item.totalDistance / item.totalFuel), 0) / kmLRecords.length
      : 0;

    const avgLHr = lHrRecords.length > 0
      ? lHrRecords.reduce((sum, item) => sum + (item.totalFuel / item.engHours), 0) / lHrRecords.length
      : 0;

    // Find best and worst efficiency vehicles (km/L)
    let bestVehicle = null;
    let worstVehicle = null;

    if (kmLRecords.length > 0) {
      const vehicleEfficiency = {};

      kmLRecords.forEach(item => {
        const key = item.vehicleNo || `Vehicle ${item.vehicleId}`;
        if (!vehicleEfficiency[key]) {
          vehicleEfficiency[key] = { total: 0, count: 0 };
        }
        vehicleEfficiency[key].total += item.totalDistance / item.totalFuel;
        vehicleEfficiency[key].count += 1;
      });

      const efficiencies = Object.entries(vehicleEfficiency).map(([vehicle, data]) => ({
        vehicle,
        avgEfficiency: data.total / data.count
      }));

      efficiencies.sort((a, b) => b.avgEfficiency - a.avgEfficiency);
      bestVehicle = efficiencies[0];
      worstVehicle = efficiencies[efficiencies.length - 1];
    }

    return {
      totalVehicles: uniqueVehicles.size,
      totalSites: uniqueSites.size,
      totalDays: uniqueDates.size,
      totalDistance: data.reduce((sum, item) => sum + (item.totalDistance || 0), 0),
      totalFuel: data.reduce((sum, item) => sum + (item.totalFuel || 0), 0),
      totalFuelLost: data.reduce((sum, item) => sum + (item.fuelLost || 0), 0),
      totalEngineHours: data.reduce((sum, item) => sum + (item.engHours || 0), 0),
      avgEfficiencyKmL: avgKmL,
      avgEfficiencyLHr: avgLHr,
      kmLCount: kmLRecords.length,
      lHrCount: lHrRecords.length,
      bestEfficiencyVehicle: bestVehicle,
      worstEfficiencyVehicle: worstVehicle
    };
  }, [data]);

  return (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-6 tw-mb-6">
      <div className="tw-flex tw-items-center tw-gap-2 tw-mb-4">
        <i className="fa-light fa-chart-pie tw-text-blue-600"></i>
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
          Summary Statistics
        </h3>
      </div>

      {/* Main Stats */}
      <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 lg:tw-grid-cols-8 tw-gap-3 tw-mb-4">
        <div className="tw-bg-blue-50 tw-p-3 tw-rounded-lg tw-border tw-border-blue-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-xs tw-text-blue-600 tw-font-medium">Vehicles</p>
              <p className="tw-text-xl tw-font-bold tw-text-blue-900">
                {summaryStats.totalVehicles}
              </p>
            </div>
            <i className="fa-light fa-car tw-text-xl tw-text-blue-600"></i>
          </div>
        </div>

        <div className="tw-bg-purple-50 tw-p-3 tw-rounded-lg tw-border tw-border-purple-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-xs tw-text-purple-600 tw-font-medium">Sites</p>
              <p className="tw-text-xl tw-font-bold tw-text-purple-900">
                {summaryStats.totalSites}
              </p>
            </div>
            <i className="fa-light fa-location-dot tw-text-xl tw-text-purple-600"></i>
          </div>
        </div>

        <div className="tw-bg-teal-50 tw-p-3 tw-rounded-lg tw-border tw-border-teal-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-xs tw-text-teal-600 tw-font-medium">Days</p>
              <p className="tw-text-xl tw-font-bold tw-text-teal-900">
                {summaryStats.totalDays}
              </p>
            </div>
            <i className="fa-light fa-calendar-days tw-text-xl tw-text-teal-600"></i>
          </div>
        </div>

        <div className="tw-bg-indigo-50 tw-p-3 tw-rounded-lg tw-border tw-border-indigo-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-xs tw-text-indigo-600 tw-font-medium">Distance</p>
              <p className="tw-text-xl tw-font-bold tw-text-indigo-900">
                {summaryStats.totalDistance.toFixed(0)} <span className="tw-text-sm">km</span>
              </p>
            </div>
            <i className="fa-light fa-route tw-text-xl tw-text-indigo-600"></i>
          </div>
        </div>

        <div className="tw-bg-green-50 tw-p-3 tw-rounded-lg tw-border tw-border-green-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-xs tw-text-green-600 tw-font-medium">Fuel Used</p>
              <p className="tw-text-xl tw-font-bold tw-text-green-900">
                {summaryStats.totalFuel.toFixed(0)} <span className="tw-text-sm">L</span>
              </p>
            </div>
            <i className="fa-light fa-gas-pump tw-text-xl tw-text-green-600"></i>
          </div>
        </div>

        <div className="tw-bg-orange-50 tw-p-3 tw-rounded-lg tw-border tw-border-orange-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-xs tw-text-orange-600 tw-font-medium">Engine Hrs</p>
              <p className="tw-text-xl tw-font-bold tw-text-orange-900">
                {summaryStats.totalEngineHours.toFixed(1)} <span className="tw-text-sm">hr</span>
              </p>
            </div>
            <i className="fa-light fa-engine tw-text-xl tw-text-orange-600"></i>
          </div>
        </div>

        <div className="tw-bg-yellow-50 tw-p-3 tw-rounded-lg tw-border tw-border-yellow-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-xs tw-text-yellow-600 tw-font-medium">Avg km/L</p>
              <p className="tw-text-xl tw-font-bold tw-text-yellow-900">
                {summaryStats.avgEfficiencyKmL > 0 ? summaryStats.avgEfficiencyKmL.toFixed(2) : '-'}
              </p>
              <p className="tw-text-xs tw-text-yellow-600">({summaryStats.kmLCount} records)</p>
            </div>
            <i className="fa-light fa-gauge-high tw-text-xl tw-text-yellow-600"></i>
          </div>
        </div>

        <div className="tw-bg-red-50 tw-p-3 tw-rounded-lg tw-border tw-border-red-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-xs tw-text-red-600 tw-font-medium">Fuel Lost</p>
              <p className="tw-text-xl tw-font-bold tw-text-red-900">
                {summaryStats.totalFuelLost.toFixed(1)} <span className="tw-text-sm">L</span>
              </p>
            </div>
            <i className="fa-light fa-exclamation-triangle tw-text-xl tw-text-red-600"></i>
          </div>
        </div>
      </div>

      {/* Best/Worst Performers */}
      {(summaryStats.bestEfficiencyVehicle || summaryStats.worstEfficiencyVehicle) && (
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4 tw-mt-4 tw-pt-4 tw-border-t tw-border-gray-200">
          {summaryStats.bestEfficiencyVehicle && (
            <div className="tw-bg-emerald-50 tw-p-4 tw-rounded-lg tw-border tw-border-emerald-200">
              <div className="tw-flex tw-items-start tw-gap-3">
                <i className="fa-light fa-trophy tw-text-2xl tw-text-emerald-600 tw-mt-1"></i>
                <div>
                  <p className="tw-text-sm tw-font-semibold tw-text-emerald-900 tw-mb-1">
                    Best Efficiency
                  </p>
                  <p className="tw-text-lg tw-font-bold tw-text-emerald-700">
                    {summaryStats.bestEfficiencyVehicle.vehicle}
                  </p>
                  <p className="tw-text-sm tw-text-emerald-600">
                    {summaryStats.bestEfficiencyVehicle.avgEfficiency.toFixed(2)} km/L
                  </p>
                </div>
              </div>
            </div>
          )}

          {summaryStats.worstEfficiencyVehicle && (
            <div className="tw-bg-rose-50 tw-p-4 tw-rounded-lg tw-border tw-border-rose-200">
              <div className="tw-flex tw-items-start tw-gap-3">
                <i className="fa-light fa-flag tw-text-2xl tw-text-rose-600 tw-mt-1"></i>
                <div>
                  <p className="tw-text-sm tw-font-semibold tw-text-rose-900 tw-mb-1">
                    Needs Attention
                  </p>
                  <p className="tw-text-lg tw-font-bold tw-text-rose-700">
                    {summaryStats.worstEfficiencyVehicle.vehicle}
                  </p>
                  <p className="tw-text-sm tw-text-rose-600">
                    {summaryStats.worstEfficiencyVehicle.avgEfficiency.toFixed(2)} km/L
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(VehicleComparisonSummary);
