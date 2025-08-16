import React, { useState, useEffect } from "react";
import "./Dashboard.scss";
import { StatsCards } from "./StatsCards";
import { FuelEfficiency } from "./FuelEfficiency";
import { WeeklyPerformance } from "./WeeklyPerformance";
import { FuelManagement } from "./FuelManagement";
import { IssueTracking } from "./IssueTracking";
import { TankLevels } from "./TankLevels";
import { PumpStatus } from "./PumpStatus";
import { SystemModules } from "./SystemModules";
import { DashboardFilters } from "./DashboardFilters";
import DashboardAlarmWidget from "./DashboardAlarmWidget";

//claude - created main dashboard component that composes smaller components

export default function Dashboard() {
  const [stats, setStats] = useState({
    activeTags: 0,
    activeAlerts: 0,
    todayTransactions: 0,
    todayVolume: 0,
    tankLevels: [],
    pumpStatus: [],
  });

  const [selectedSite, setSelectedSite] = useState("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState("week");
  const [selectedVehicleType, setSelectedVehicleType] = useState("all");

  // Demo data for sites
  const sites = [
    { id: 1, name: "Main Station IP" },
    { id: 2, name: "Katani" },
    { id: 3, name: "Meru" },
    { id: 4, name: "Muhoroni" },
  ];

  // Demo data for vehicle consumption
  //todo: replace with real data from API
  const vehicleConsumptionData = {
    previousDay: [
      {
        vehicleType: "TEX",
        consumption: 245.6,
        hours: 18.5,
        distance: 320,
        efficiency: 13.1,
        site: 1,
      },
      {
        vehicleType: "WEX",
        consumption: 189.2,
        hours: 12.3,
        distance: 210,
        efficiency: 11.1,
        site: 1,
      },
      {
        vehicleType: "BHL",
        consumption: 320.5,
        hours: 22.7,
        distance: 180,
        efficiency: 5.6,
        site: 2,
      },
      {
        vehicleType: "MG",
        consumption: 98.3,
        hours: 8.2,
        distance: 150,
        efficiency: 15.3,
        site: 2,
      },
      {
        vehicleType: "SB",
        consumption: 156.7,
        hours: 14.5,
        distance: 280,
        efficiency: 17.9,
        site: 3,
      },
      {
        vehicleType: "TP",
        consumption: 278.9,
        hours: 19.8,
        distance: 340,
        efficiency: 12.2,
        site: 3,
      },
      {
        vehicleType: "PM",
        consumption: 134.2,
        hours: 10.6,
        distance: 190,
        efficiency: 14.2,
        site: 4,
      },
      {
        vehicleType: "PickUP",
        consumption: 87.5,
        hours: 7.3,
        distance: 230,
        efficiency: 26.3,
        site: 4,
      },
    ],
    weeklyEngineHours: [
      { vehicleType: "TEX", hours: 112.5, site: 1 },
      { vehicleType: "WEX", hours: 98.7, site: 1 },
      { vehicleType: "BHL", hours: 145.2, site: 2 },
      { vehicleType: "MG", hours: 67.8, site: 2 },
      { vehicleType: "TEX", hours: 105.3, site: 3 },
      { vehicleType: "WEX", hours: 87.6, site: 3 },
      { vehicleType: "BHL", hours: 132.1, site: 4 },
      { vehicleType: "MG", hours: 58.9, site: 4 },
    ],
    weeklyDistance: [
      { vehicleType: "SB", distance: 1850, site: 1 },
      { vehicleType: "TP", distance: 2340, site: 1 },
      { vehicleType: "PM", distance: 1230, site: 2 },
      { vehicleType: "PickUP", distance: 1780, site: 2 },
      { vehicleType: "SB", distance: 1650, site: 3 },
      { vehicleType: "TP", distance: 2120, site: 3 },
      { vehicleType: "PM", distance: 1180, site: 4 },
      { vehicleType: "PickUP", distance: 1620, site: 4 },
    ],
    fuelEfficiency: [
      { vehicleType: "TEX", kmPerLiter: 0, literPerHour: 13.2, site: 1 },
      { vehicleType: "WEX", kmPerLiter: 0, literPerHour: 15.4, site: 1 },
      { vehicleType: "BHL", kmPerLiter: 0, literPerHour: 14.1, site: 2 },
      { vehicleType: "MG", kmPerLiter: 0, literPerHour: 12.0, site: 2 },
      { vehicleType: "SB", kmPerLiter: 6.8, literPerHour: 0, site: 3 },
      { vehicleType: "TP", kmPerLiter: 8.5, literPerHour: 0, site: 3 },
      { vehicleType: "PM", kmPerLiter: 7.2, literPerHour: 0, site: 4 },
      { vehicleType: "PickUP", kmPerLiter: 12.5, literPerHour: 0, site: 4 },
    ],
    fuelIssue: [
      {
        site: 1,
        amount: 3450.5,
        cost: 13432.45,
        vehicleType: "TEX",
        count: 12,
      },
      { site: 1, amount: 2780.2, cost: 10825.98, vehicleType: "WEX", count: 8 },
      {
        site: 2,
        amount: 4120.8,
        cost: 16030.92,
        vehicleType: "BHL",
        count: 15,
      },
      { site: 2, amount: 1560.3, cost: 6069.57, vehicleType: "MG", count: 6 },
      { site: 3, amount: 2890.6, cost: 11244.34, vehicleType: "SB", count: 10 },
      { site: 3, amount: 3210.4, cost: 12488.56, vehicleType: "TP", count: 11 },
      { site: 4, amount: 1980.7, cost: 7704.73, vehicleType: "PM", count: 7 },
      {
        site: 4,
        amount: 1450.2,
        cost: 5641.28,
        vehicleType: "PickUP",
        count: 5,
      },
    ],
    fuelDelivery: [
      { site: 1, amount: 8000, date: "2025-03-15" },
      { site: 2, amount: 6000, date: "2025-03-16" },
      { site: 3, amount: 7000, date: "2025-03-17" },
      { site: 4, amount: 5000, date: "2025-03-18" },
    ],
    issueTracking: [
      { category: "Mechanical", count: 8, priority: "High", site: 1 },
      { category: "Electrical", count: 5, priority: "Medium", site: 1 },
      { category: "Fuel System", count: 3, priority: "High", site: 2 },
      { category: "GPS Device", count: 4, priority: "Low", site: 2 },
      { category: "Mechanical", count: 6, priority: "Medium", site: 3 },
      { category: "Electrical", count: 2, priority: "High", site: 3 },
      { category: "Fuel System", count: 5, priority: "Medium", site: 4 },
      { category: "GPS Device", count: 3, priority: "Low", site: 4 },
    ],
  };

  useEffect(() => {
    // Simulate loading data
    //todo: replace with actual API call
    const loadData = () => {
      setStats({
        activeTags: 4,
        activeAlerts: 2,
        todayTransactions: 28,
        todayVolume: 1245.67,
        tankLevels: [
          { id: 1, name: "Regular Unleaded", level: 77, volume: 15420 },
          { id: 2, name: "Premium Unleaded", level: 65, volume: 12980 },
          { id: 3, name: "Diesel", level: 42, volume: 8450 },
        ],
        pumpStatus: [
          { id: 1, status: "Idle" },
          { id: 2, status: "Filling" },
          { id: 3, status: "Idle" },
          { id: 4, status: "Offline" },
        ],
      });
    };

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter data based on selected site
  const filterBySite = (data, siteKey = "site") => {
    if (selectedSite === "all") return data;
    return data.filter(
      (item) => item[siteKey] === Number.parseInt(selectedSite)
    );
  };

  // Filter data based on selected vehicle type
  const filterByVehicleType = (data) => {
    if (selectedVehicleType === "all") return data;
    return data.filter((item) => item.vehicleType === selectedVehicleType);
  };

  // Calculate totals for engine hours by vehicle type
  const engineHoursByType = () => {
    const filteredData = filterBySite(vehicleConsumptionData.weeklyEngineHours);
    const result = {};

    filteredData.forEach((item) => {
      if (!result[item.vehicleType]) {
        result[item.vehicleType] = 0;
      }
      result[item.vehicleType] += item.hours;
    });

    return Object.entries(result).map(([vehicleType, hours]) => ({
      vehicleType,
      hours,
    }));
  };

  // Calculate totals for distance by vehicle type
  const distanceByType = () => {
    const filteredData = filterBySite(vehicleConsumptionData.weeklyDistance);
    const result = {};

    filteredData.forEach((item) => {
      if (!result[item.vehicleType]) {
        result[item.vehicleType] = 0;
      }
      result[item.vehicleType] += item.distance;
    });

    return Object.entries(result).map(([vehicleType, distance]) => ({
      vehicleType,
      distance,
    }));
  };

  // Calculate fuel efficiency averages
  const fuelEfficiencyAverages = () => {
    const filteredData = filterBySite(vehicleConsumptionData.fuelEfficiency);
    const kmPerLiterVehicles = filteredData.filter(
      (item) => item.kmPerLiter > 0
    );
    const literPerHourVehicles = filteredData.filter(
      (item) => item.literPerHour > 0
    );

    const avgKmPerLiter =
      kmPerLiterVehicles.length > 0
        ? kmPerLiterVehicles.reduce((sum, item) => sum + item.kmPerLiter, 0) /
          kmPerLiterVehicles.length
        : 0;

    const avgLiterPerHour =
      literPerHourVehicles.length > 0
        ? literPerHourVehicles.reduce(
            (sum, item) => sum + item.literPerHour,
            0
          ) / literPerHourVehicles.length
        : 0;

    return { avgKmPerLiter, avgLiterPerHour };
  };

  // Calculate fuel issue by vehicle type
  const fuelIssueByVehicleType = () => {
    const filteredData = filterBySite(vehicleConsumptionData.fuelIssue);
    return filteredData.sort((a, b) => b.amount - a.amount);
  };

  // Calculate total fuel issued and cost by site
  const fuelIssueBySite = () => {
    const result = {};

    vehicleConsumptionData.fuelIssue.forEach((item) => {
      if (!result[item.site]) {
        result[item.site] = {
          site: item.site,
          siteName:
            sites.find((s) => s.id === item.site)?.name || `Site ${item.site}`,
          totalAmount: 0,
          totalCost: 0,
          count: 0,
        };
      }
      result[item.site].totalAmount += item.amount;
      result[item.site].totalCost += item.cost;
      result[item.site].count += item.count;
    });

    return Object.values(result);
  };

  // Calculate previous day consumption totals
  const previousDayTotals = () => {
    const filteredData = filterByVehicleType(
      filterBySite(vehicleConsumptionData.previousDay)
    );

    return {
      consumption: filteredData.reduce(
        (sum, item) => sum + item.consumption,
        0
      ),
      hours: filteredData.reduce((sum, item) => sum + item.hours, 0),
      distance: filteredData.reduce((sum, item) => sum + item.distance, 0),
    };
  };

  // Format numbers with commas
  const formatNumber = (num) => {
    return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const modules = [
    {
      name: "Tag Management",
      icon: "tag",
      path: "/tag-management",
      description: "Manage RFID tags for vehicles and drivers",
      stat: `${stats.activeTags} Active Tags`,
    },
    {
      name: "Alerts Monitor",
      icon: "warning",
      path: "/alerts",
      description: "View and manage system alerts",
      stat: `${stats.activeAlerts} Active Alerts`,
      highlight: stats.activeAlerts > 0,
    },
    {
      name: "Reports",
      icon: "chart",
      path: "/reports",
      description: "Generate detailed reports and analytics",
      stat: "Custom Reports",
    },
    {
      name: "Transactions",
      icon: "file",
      path: "/transactions",
      description: "View and export transaction reports",
      stat: `${stats.todayTransactions} Today`,
    },
    {
      name: "Tank Monitoring",
      icon: "database",
      path: "/tank-monitoring",
      description: "Monitor tank levels and status",
      stat: `${stats.tankLevels.length} Tanks`,
    },
    {
      name: "Pump Control",
      icon: "gauge",
      path: "/pump-control",
      description: "Control and monitor fuel pumps",
      stat: `${stats.pumpStatus.length} Pumps`,
    },
    {
      name: "Fuel Grades",
      icon: "drop",
      path: "/fuel-grades",
      description: "Manage fuel grades and pricing",
      stat: "Price Management",
    },
    {
      name: "PTS Devices",
      icon: "car",
      path: "/pts-devices",
      description: "Manage PTS devices and configuration",
      stat: "Device Management",
    },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Hyoung FMS Dashboard</h1>
        <DashboardFilters
          sites={sites}
          selectedSite={selectedSite}
          setSelectedSite={setSelectedSite}
          selectedTimeframe={selectedTimeframe}
          setSelectedTimeframe={setSelectedTimeframe}
          selectedVehicleType={selectedVehicleType}
          setSelectedVehicleType={setSelectedVehicleType}
        />
      </div>

      {/* Key Stats */}
      <StatsCards pdTotals={previousDayTotals()} stats={stats} />

      {/* Alarm Status Widget */}
      <h2 className="section-title">System Alerts</h2>
      <DashboardAlarmWidget />

      {/* Combined Fuel Efficiency and Weekly Performance */}
      <h2 className="section-title">Performance Metrics</h2>
      <div className="full-width-section">
        <div className="section-row">
          <div className="section-column">
            <h3 className="subsection-title">Fuel Efficiency</h3>
            <FuelEfficiency
              efficiencyAvgs={fuelEfficiencyAverages()}
              filteredEfficiencyData={filterBySite(
                vehicleConsumptionData.fuelEfficiency
              )}
            />
          </div>
          <div className="section-column">
            <h3 className="subsection-title">Weekly Performance</h3>
            <WeeklyPerformance
              engineHoursData={engineHoursByType()}
              distanceData={distanceByType()}
            />
          </div>
        </div>
      </div>

      {/* Fuel Management */}
      <h2 className="section-title">Fuel Management</h2>
      <div className="full-width-section">
        <FuelManagement
          fuelIssueData={fuelIssueByVehicleType()}
          fuelSiteData={fuelIssueBySite()}
          formatNumber={formatNumber}
          formatCurrency={formatCurrency}
        />
      </div>

      {/* Issue Tracking */}
      <h2 className="section-title">Issue Tracking</h2>
      <IssueTracking
        issueData={filterBySite(vehicleConsumptionData.issueTracking)}
      />

      {/* Combined Tank Levels and Pump Status */}
      <h2 className="section-title">
        Fuel System Status
        <div className="section-controls">
          <span className="update-interval">Updates: 1m 30s</span>
          <div className="dropdown-menu">
            <button>
              <i className="fa-solid fa-ellipsis-vertical"></i>
            </button>
            <div className="dropdown-content">
              <div className="dropdown-item">Live</div>
              <div className="dropdown-item">30s</div>
              <div className="dropdown-item">1m</div>
              <div className="dropdown-item">5m</div>
            </div>
          </div>
        </div>
      </h2>
      <div className="combined-section">
        <h3 className="section-title">Tank Levels</h3>
        <TankLevels tankLevels={stats.tankLevels} />

        <h3 className="section-title">Pump Status</h3>
        <PumpStatus pumpStatus={stats.pumpStatus} />
      </div>

      {/* Modules */}
      <h2 className="section-title">System Modules</h2>
      <SystemModules modules={modules} />
    </div>
  );
}
