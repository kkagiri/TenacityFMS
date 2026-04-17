/**
 * File:          VehicleConsumptionPage.js
 * Purpose:       GPS consumption analytics dashboard — stat cards, daily trend charts, fuel by vehicle type pie chart.
 * Dependencies:  axiosInstance, DevExtreme Chart/PieChart, React hooks
 * Last Modified: 2026-04-16
 *
 * Key Functions:
 * - fetchAnalytics(): Loads analytics data from gpsAnalytics endpoint
 * - StatCard: Renders a gradient stat card with icon, value, label
 * - renderDailyFuelChart(): Bar chart of daily fuel usage
 * - renderDailyDistanceChart(): Spline chart of daily distance
 * - renderDailyEngHoursChart(): Area chart of daily engine hours
 * - renderVehicleTypePieChart(): Pie chart of fuel by vehicle type
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Chart, Series, ArgumentAxis, ValueAxis, Legend, Tooltip, CommonSeriesSettings, Label, Grid } from 'devextreme-react/chart';
import { PieChart } from 'devextreme-react/pie-chart';
import { Series as PieSeries, Label as PieLabel, Connector, Legend as PieLegend, Tooltip as PieTooltip } from 'devextreme-react/pie-chart';
import LoadIndicator from 'devextreme-react/load-indicator';
import axiosInstance from '../../../api/axiosInstance';

const PERIOD_OPTIONS = [
  { id: 7, name: 'Last 7 Days' },
  { id: 14, name: 'Last 14 Days' },
  { id: 30, name: 'Last 30 Days' },
  { id: 60, name: 'Last 60 Days' },
  { id: 90, name: 'Last 90 Days' },
];

const StatCard = ({ icon, label, value, unit, subLabel, subValue, gradient }) => (
  <div className={`tw-rounded-lg tw-p-4 tw-border tw-relative tw-overflow-hidden ${gradient}`}>
    <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
      <div className="tw-flex tw-items-center tw-gap-2">
        <i className={`${icon} tw-text-lg`}></i>
        <span className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-opacity-80">{label}</span>
      </div>
    </div>
    <div className="tw-text-2xl tw-font-bold tw-mb-1">
      {value} <span className="tw-text-sm tw-font-normal tw-opacity-70">{unit}</span>
    </div>
    {subLabel && (
      <div className="tw-text-xs tw-opacity-70">
        {subLabel}: <span className="tw-font-semibold">{subValue}</span>
      </div>
    )}
  </div>
);

const VehicleConsumptionPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState(7);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - period);

      const params = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      };

      const response = await axiosInstance.get('/Consumption/gpsAnalytics', { params });
      setAnalytics(response.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const dailyChartData = useMemo(() => {
    if (!analytics?.dailyData) return [];
    return analytics.dailyData.map(d => ({
      ...d,
      date: new Date(d.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      totalFuel: Math.round(d.totalFuel * 100) / 100,
      totalDistance: Math.round(d.totalDistance * 100) / 100,
      totalEngHours: Math.round(d.totalEngHours * 100) / 100,
      avgSpeed: Math.round(d.avgSpeed * 100) / 100,
    }));
  }, [analytics]);

  const pieChartData = useMemo(() => {
    if (!analytics?.byVehicleType) return [];
    const total = analytics.byVehicleType.reduce((sum, v) => sum + v.totalFuel, 0);
    return analytics.byVehicleType.map(v => ({
      vehicleType: v.vehicleType,
      totalFuel: Math.round(v.totalFuel * 100) / 100,
      percentage: total > 0 ? Math.round((v.totalFuel / total) * 10000) / 100 : 0,
      vehicleCount: v.vehicleCount,
    }));
  }, [analytics]);

  const formatNumber = (num) => {
    if (num == null || isNaN(num)) return '0';
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const avgDailyFuel = useMemo(() => {
    if (!analytics?.dailyData?.length) return 0;
    return analytics.totalFuel / analytics.dailyData.length;
  }, [analytics]);

  const avgDailyDistance = useMemo(() => {
    if (!analytics?.dailyData?.length) return 0;
    return analytics.totalDistance / analytics.dailyData.length;
  }, [analytics]);

  if (loading && !analytics) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
        <LoadIndicator height={40} width={40} />
        <span className="tw-ml-3 tw-text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="tw-p-4">
      {/* Header */}
      <div className="m365-page-header tw-mb-4">
        <div className="m365-page-header__left">
          <i className="fa-light fa-chart-mixed m365-page-header__icon"></i>
          <h2 className="m365-page-header__title">Fuel Consumption Analytics</h2>
        </div>
        <div className="m365-page-header__actions tw-flex tw-items-center tw-gap-3">
          <select
            className="m365-select"
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
          >
            {PERIOD_OPTIONS.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.name}</option>
            ))}
          </select>
          <button className="m365-btn m365-btn--ghost" onClick={fetchAnalytics} disabled={loading}>
            <i className={`fa-light fa-arrows-rotate ${loading ? 'tw-animate-spin' : ''}`}></i>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="m365-info-banner m365-info-banner--error tw-mb-4">
          <i className="fa-light fa-circle-exclamation m365-info-banner__icon" />
          <span className="m365-info-banner__text">{error}</span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4 tw-mb-6">
        <StatCard
          icon="fa-light fa-gas-pump tw-text-blue-600"
          label="Total Fuel Used"
          value={formatNumber(analytics?.totalFuel || 0)}
          unit="L"
          subLabel="Daily Avg"
          subValue={`${formatNumber(avgDailyFuel)} L`}
          gradient="tw-bg-blue-50 tw-border-blue-200 tw-text-blue-900"
        />
        <StatCard
          icon="fa-light fa-route tw-text-green-600"
          label="Total Distance"
          value={formatNumber(analytics?.totalDistance || 0)}
          unit="km"
          subLabel="Daily Avg"
          subValue={`${formatNumber(avgDailyDistance)} km`}
          gradient="tw-bg-green-50 tw-border-green-200 tw-text-green-900"
        />
        <StatCard
          icon="fa-light fa-clock tw-text-amber-600"
          label="Total Engine Hours"
          value={formatNumber(analytics?.totalEngHours || 0)}
          unit="hrs"
          subLabel="Vehicles"
          subValue={analytics?.totalVehicles || 0}
          gradient="tw-bg-amber-50 tw-border-amber-200 tw-text-amber-900"
        />
        <StatCard
          icon="fa-light fa-gauge-high tw-text-purple-600"
          label="Avg Consumption"
          value={formatNumber(analytics?.avgConsumption || 0)}
          unit="km/L"
          subLabel="Avg Speed"
          subValue={`${formatNumber(analytics?.avgSpeed || 0)} km/h`}
          gradient="tw-bg-purple-50 tw-border-purple-200 tw-text-purple-900"
        />
      </div>

      {/* Secondary stat row */}
      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-3 tw-gap-4 tw-mb-6">
        <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-3 tw-flex tw-items-center tw-gap-3">
          <div className="tw-w-10 tw-h-10 tw-rounded-full tw-bg-red-50 tw-flex tw-items-center tw-justify-center">
            <i className="fa-light fa-droplet-slash tw-text-red-500"></i>
          </div>
          <div>
            <div className="tw-text-lg tw-font-bold tw-text-gray-800">{formatNumber(analytics?.totalFuelLost || 0)} L</div>
            <div className="tw-text-xs tw-text-gray-500">Total Fuel Lost</div>
          </div>
        </div>
        <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-3 tw-flex tw-items-center tw-gap-3">
          <div className="tw-w-10 tw-h-10 tw-rounded-full tw-bg-indigo-50 tw-flex tw-items-center tw-justify-center">
            <i className="fa-light fa-cars tw-text-indigo-500"></i>
          </div>
          <div>
            <div className="tw-text-lg tw-font-bold tw-text-gray-800">{analytics?.totalVehicles || 0}</div>
            <div className="tw-text-xs tw-text-gray-500">Active Vehicles</div>
          </div>
        </div>
        <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-3 tw-flex tw-items-center tw-gap-3">
          <div className="tw-w-10 tw-h-10 tw-rounded-full tw-bg-teal-50 tw-flex tw-items-center tw-justify-center">
            <i className="fa-light fa-database tw-text-teal-500"></i>
          </div>
          <div>
            <div className="tw-text-lg tw-font-bold tw-text-gray-800">{analytics?.totalRecords || 0}</div>
            <div className="tw-text-xs tw-text-gray-500">Total Records</div>
          </div>
        </div>
      </div>

      {/* Charts Row 1: Daily Fuel + Distance */}
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4 tw-mb-4">
        {/* Daily Fuel Usage */}
        <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4">
          <h3 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-chart-column tw-text-blue-500"></i>
            Daily Fuel Usage (L)
          </h3>
          {dailyChartData.length > 0 ? (
            <Chart dataSource={dailyChartData} height={250}>
              <CommonSeriesSettings argumentField="date" />
              <Series valueField="totalFuel" name="Fuel (L)" type="bar" color="#0078d4" />
              <ArgumentAxis>
                <Label rotationAngle={-45} overlappingBehavior="rotate" />
                <Grid visible={false} />
              </ArgumentAxis>
              <ValueAxis>
                <Label format={{ type: 'fixedPoint', precision: 0 }} />
                <Grid visible={true} color="#f3f2f1" />
              </ValueAxis>
              <Legend visible={false} />
              <Tooltip enabled={true} customizeTooltip={(arg) => ({
                text: `${arg.argumentText}\nFuel: ${formatNumber(arg.value)} L`
              })} />
            </Chart>
          ) : (
            <div className="tw-h-[250px] tw-flex tw-items-center tw-justify-center tw-text-gray-400">
              <span>No data available</span>
            </div>
          )}
        </div>

        {/* Daily Distance */}
        <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4">
          <h3 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-route tw-text-green-500"></i>
            Daily Distance (km)
          </h3>
          {dailyChartData.length > 0 ? (
            <Chart dataSource={dailyChartData} height={250}>
              <CommonSeriesSettings argumentField="date" />
              <Series valueField="totalDistance" name="Distance (km)" type="spline" color="#107c10">
              </Series>
              <ArgumentAxis>
                <Label rotationAngle={-45} overlappingBehavior="rotate" />
                <Grid visible={false} />
              </ArgumentAxis>
              <ValueAxis>
                <Label format={{ type: 'fixedPoint', precision: 0 }} />
                <Grid visible={true} color="#f3f2f1" />
              </ValueAxis>
              <Legend visible={false} />
              <Tooltip enabled={true} customizeTooltip={(arg) => ({
                text: `${arg.argumentText}\nDistance: ${formatNumber(arg.value)} km`
              })} />
            </Chart>
          ) : (
            <div className="tw-h-[250px] tw-flex tw-items-center tw-justify-center tw-text-gray-400">
              <span>No data available</span>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2: Engine Hours + Fuel by Vehicle Type */}
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4 tw-mb-4">
        {/* Daily Engine Hours */}
        <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4">
          <h3 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-clock tw-text-amber-500"></i>
            Daily Engine Hours
          </h3>
          {dailyChartData.length > 0 ? (
            <Chart dataSource={dailyChartData} height={250}>
              <CommonSeriesSettings argumentField="date" />
              <Series valueField="totalEngHours" name="Engine Hours" type="area" color="#ca5010" opacity={0.3} />
              <ArgumentAxis>
                <Label rotationAngle={-45} overlappingBehavior="rotate" />
                <Grid visible={false} />
              </ArgumentAxis>
              <ValueAxis>
                <Label format={{ type: 'fixedPoint', precision: 1 }} />
                <Grid visible={true} color="#f3f2f1" />
              </ValueAxis>
              <Legend visible={false} />
              <Tooltip enabled={true} customizeTooltip={(arg) => ({
                text: `${arg.argumentText}\nEngine Hours: ${formatNumber(arg.value)} hrs`
              })} />
            </Chart>
          ) : (
            <div className="tw-h-[250px] tw-flex tw-items-center tw-justify-center tw-text-gray-400">
              <span>No data available</span>
            </div>
          )}
        </div>

        {/* Fuel by Vehicle Type - Pie Chart */}
        <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4">
          <h3 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-chart-pie tw-text-purple-500"></i>
            Fuel by Vehicle Type
          </h3>
          {pieChartData.length > 0 ? (
            <PieChart dataSource={pieChartData} height={250} type="doughnut" innerRadius={0.6}>
              <PieSeries argumentField="vehicleType" valueField="totalFuel">
                <PieLabel visible={true} format={{ type: 'fixedPoint', precision: 0 }} customizeText={(arg) => `${arg.valueText} L`}>
                  <Connector visible={true} width={1} />
                </PieLabel>
              </PieSeries>
              <PieLegend
                visible={true}
                horizontalAlignment="right"
                verticalAlignment="top"
                itemTextFormat=""
                customizeText={(arg) => `${arg.pointName} (${formatNumber(arg.point?.data?.totalFuel || 0)} L)`}
              />
              <PieTooltip enabled={true} customizeTooltip={(arg) => ({
                text: `${arg.argumentText}\nFuel: ${formatNumber(arg.value)} L\n${arg.percentText}\nVehicles: ${arg.point?.data?.vehicleCount || 0}`
              })} />
            </PieChart>
          ) : (
            <div className="tw-h-[250px] tw-flex tw-items-center tw-justify-center tw-text-gray-400">
              <span>No data available</span>
            </div>
          )}
        </div>
      </div>

      {/* Avg Speed Chart */}
      <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4">
        <h3 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3 tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-gauge tw-text-indigo-500"></i>
          Daily Average Speed (km/h)
        </h3>
        {dailyChartData.length > 0 ? (
          <Chart dataSource={dailyChartData} height={200}>
            <CommonSeriesSettings argumentField="date" />
            <Series valueField="avgSpeed" name="Avg Speed (km/h)" type="spline" color="#5c2d91" />
            <ArgumentAxis>
              <Label rotationAngle={-45} overlappingBehavior="rotate" />
              <Grid visible={false} />
            </ArgumentAxis>
            <ValueAxis>
              <Label format={{ type: 'fixedPoint', precision: 1 }} />
              <Grid visible={true} color="#f3f2f1" />
            </ValueAxis>
            <Legend visible={false} />
            <Tooltip enabled={true} customizeTooltip={(arg) => ({
              text: `${arg.argumentText}\nAvg Speed: ${formatNumber(arg.value)} km/h`
            })} />
          </Chart>
        ) : (
          <div className="tw-h-[200px] tw-flex tw-items-center tw-justify-center tw-text-gray-400">
            <span>No data available</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleConsumptionPage;
