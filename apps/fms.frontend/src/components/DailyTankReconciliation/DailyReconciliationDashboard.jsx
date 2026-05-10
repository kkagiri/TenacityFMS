import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Alert,
  Spin,
  DatePicker,
  Select,
  Button,
  Statistic,
  Progress,
} from "antd";
import {
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  DownloadOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import { Line, Column } from "@ant-design/plots";
import moment from "moment";
import axiosInstance from "../../api/axiosInstance";
import "./DailyReconciliationDashboard.css";

const { RangePicker } = DatePicker;
const { Option } = Select;

//Cursor - Daily Tank Reconciliation Dashboard Component
const DailyReconciliationDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [filters, setFilters] = useState({
    dateRange: [moment().subtract(7, "days"), moment()],
    siteId: null,
    tankId: null,
    discrepanciesOnly: false,
  });

  useEffect(() => {
    loadDashboardData();
  }, [filters]);

  //Cursor - Load dashboard data from API
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [reportResponse, summaryResponse, alertsResponse] =
        await Promise.all([
          fetchReconciliationReport(),
          fetchReconciliationSummary(),
          fetchDiscrepancyAlerts(),
        ]);

      setReportData(reportResponse);
      setSummary(summaryResponse);
      setAlerts(alertsResponse);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  //Cursor - Fetch reconciliation report
  const fetchReconciliationReport = async () => {
    const params = new URLSearchParams({
      startDate: filters.dateRange[0].format("YYYY-MM-DD"),
      endDate: filters.dateRange[1].format("YYYY-MM-DD"),
      includeDiscrepanciesOnly: filters.discrepanciesOnly,
      pageNumber: 1,
      pageSize: 100,
    });

    if (filters.siteId) params.append("siteId", filters.siteId);
    if (filters.tankId) params.append("tankId", filters.tankId);

    const response = await axiosInstance.get(
      `/DailyTankReconciliation/report?${params}`
    );
    const result = response.data;
    return result.isSuccess ? result.data : null;
  };

  //Cursor - Fetch reconciliation summary
  const fetchReconciliationSummary = async () => {
    const days = filters.dateRange[1].diff(filters.dateRange[0], "days");
    const params = new URLSearchParams({ days });
    if (filters.siteId) params.append("siteId", filters.siteId);

    const response = await axiosInstance.get(
      `/DailyTankReconciliation/summary?${params}`
    );
    const result = response.data;
    return result.isSuccess ? result.data : null;
  };

  //Cursor - Fetch discrepancy alerts
  const fetchDiscrepancyAlerts = async () => {
    const params = new URLSearchParams({ days: 3 });
    if (filters.siteId) params.append("siteId", filters.siteId);

    const response = await axiosInstance.get(
      `/DailyTankReconciliation/alerts?${params}`
    );
    const result = response.data;
    return result.isSuccess ? result.data : [];
  };

  //Cursor - Process yesterday's reconciliation
  const processYesterdayReconciliation = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.siteId) params.append("siteId", filters.siteId);
      if (filters.tankId) params.append("tankId", filters.tankId);

      const response = await axiosInstance.post(
        `/DailyTankReconciliation/process-yesterday?${params}`
      );
      const result = response.data;

      if (result.isSuccess) {
        message.success(
          `Successfully processed reconciliation for ${result.data.totalTanksProcessed} tanks`
        );
        loadDashboardData();
      } else {
        message.error(`Failed to process reconciliation: ${result.message}`);
      }
    } catch (error) {
      message.error("Error processing reconciliation");
    } finally {
      setLoading(false);
    }
  };

  //Cursor - Prepare chart data for variance trends
  const getVarianceTrendData = () => {
    if (!reportData?.items) return [];

    const dailyVariances = reportData.items.reduce((acc, item) => {
      const date = moment(item.reconciliationDate).format("YYYY-MM-DD");
      if (!acc[date]) {
        acc[date] = { date, totalVariance: 0, count: 0 };
      }
      acc[date].totalVariance += item.variance;
      acc[date].count += 1;
      return acc;
    }, {});

    return Object.values(dailyVariances)
      .map((day) => ({
        date: day.date,
        averageVariance: day.totalVariance / day.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  //Cursor - Prepare chart data for tank performance
  const getTankPerformanceData = () => {
    if (!reportData?.items) return [];

    const tankVariances = reportData.items.reduce((acc, item) => {
      if (!acc[item.tankName]) {
        acc[item.tankName] = {
          tankName: item.tankName,
          totalVariance: 0,
          count: 0,
        };
      }
      acc[item.tankName].totalVariance += item.variance;
      acc[item.tankName].count += 1;
      return acc;
    }, {});

    return Object.values(tankVariances)
      .map((tank) => ({
        tankName: tank.tankName,
        averageVariance: tank.totalVariance / tank.count,
      }))
      .sort((a, b) => b.averageVariance - a.averageVariance)
      .slice(0, 10); // Top 10 tanks
  };

  //Cursor - Table columns for reconciliation data
  const reconciliationColumns = [
    {
      title: "Date",
      dataIndex: "reconciliationDate",
      key: "date",
      render: (date) => moment(date).format("YYYY-MM-DD"),
      sorter: (a, b) =>
        moment(a.reconciliationDate).unix() -
        moment(b.reconciliationDate).unix(),
    },
    {
      title: "Tank",
      dataIndex: "tankName",
      key: "tank",
      sorter: (a, b) => a.tankName.localeCompare(b.tankName),
    },
    {
      title: "Site",
      dataIndex: "siteName",
      key: "site",
      sorter: (a, b) => a.siteName.localeCompare(b.siteName),
    },
    {
      title: "Opening (L)",
      dataIndex: "openingLevel",
      key: "opening",
      render: (value) => value.toFixed(2),
      sorter: (a, b) => a.openingLevel - b.openingLevel,
    },
    {
      title: "Closing (L)",
      dataIndex: "closingLevel",
      key: "closing",
      render: (value) => value.toFixed(2),
      sorter: (a, b) => a.closingLevel - b.closingLevel,
    },
    {
      title: "Expected (L)",
      dataIndex: "calculatedClosing",
      key: "expected",
      render: (value) => value.toFixed(2),
      sorter: (a, b) => a.calculatedClosing - b.calculatedClosing,
    },
    {
      title: "Variance (L)",
      dataIndex: "variance",
      key: "variance",
      render: (value, record) => (
        <span
          className={`tw-font-semibold ${
            record.hasDiscrepancy ? "tw-text-red-600" : "tw-text-green-600"
          }`}
        >
          {value.toFixed(2)}
        </span>
      ),
      sorter: (a, b) => a.variance - b.variance,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status, record) => (
        <span
          className={`tw-flex tw-items-center tw-gap-1 ${
            record.hasDiscrepancy ? "tw-text-red-600" : "tw-text-green-600"
          }`}
        >
          {record.hasDiscrepancy ? (
            <ExclamationCircleOutlined />
          ) : (
            <CheckCircleOutlined />
          )}
          {status}
        </span>
      ),
    },
  ];

  //Cursor - Alert severity colors
  const getAlertColor = (severity) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "error";
      case "high":
        return "warning";
      case "medium":
        return "info";
      default:
        return "success";
    }
  };

  return (
    <div className="tw-p-6 tw-bg-gray-50 tw-min-h-screen">
      <div className="tw-mb-6">
        <h1 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-mb-2">
          <i className="fa-light fa-chart-line tw-mr-2"></i>
          Daily Tank Reconciliation Dashboard
        </h1>
        <p className="tw-text-gray-600">
          Monitor tank reconciliation status and discrepancies
        </p>
      </div>

      {/* Filters */}
      <Card className="tw-mb-6">
        <Row gutter={16} align="middle">
          <Col span={6}>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
              Date Range
            </label>
            <RangePicker
              value={filters.dateRange}
              onChange={(dates) =>
                setFilters((prev) => ({ ...prev, dateRange: dates }))
              }
              format="YYYY-MM-DD"
              className="tw-w-full"
            />
          </Col>
          <Col span={4}>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
              Site
            </label>
            <Select
              placeholder="All Sites"
              value={filters.siteId}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, siteId: value }))
              }
              className="tw-w-full"
              allowClear
            >
              {/* Site options would be loaded from API */}
            </Select>
          </Col>
          <Col span={4}>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">
              Tank
            </label>
            <Select
              placeholder="All Tanks"
              value={filters.tankId}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, tankId: value }))
              }
              className="tw-w-full"
              allowClear
            >
              {/* Tank options would be loaded from API */}
            </Select>
          </Col>
          <Col span={6}>
            <div className="tw-flex tw-gap-2 tw-mt-6">
              <Button
                type="primary"
                icon={<FilterOutlined />}
                onClick={loadDashboardData}
                loading={loading}
              >
                Apply Filters
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={processYesterdayReconciliation}
                loading={loading}
              >
                Process Yesterday
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Summary Statistics */}
      {summary && (
        <Row gutter={16} className="tw-mb-6">
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Records"
                value={summary.totalRecords}
                prefix={
                  <i className="fa-light fa-database tw-text-blue-500"></i>
                }
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Discrepancy Rate"
                value={summary.discrepancyRate}
                suffix="%"
                precision={1}
                prefix={
                  <i className="fa-light fa-exclamation-triangle tw-text-orange-500"></i>
                }
              />
              <Progress
                percent={summary.discrepancyRate}
                showInfo={false}
                strokeColor={
                  summary.discrepancyRate > 10 ? "#ff4d4f" : "#52c41a"
                }
                className="tw-mt-2"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Average Variance"
                value={summary.averageVariance}
                suffix="L"
                precision={2}
                prefix={
                  <i className="fa-light fa-chart-line tw-text-green-500"></i>
                }
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Max Variance"
                value={summary.maxVariance}
                suffix="L"
                precision={2}
                prefix={
                  <i className="fa-light fa-arrow-up tw-text-red-500"></i>
                }
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card
          title={
            <>
              <WarningOutlined className="tw-mr-2" />
              Recent Discrepancy Alerts
            </>
          }
          className="tw-mb-6"
        >
          <Row gutter={16}>
            {alerts.slice(0, 3).map((alert, index) => (
              <Col span={8} key={index}>
                <Alert
                  type={getAlertColor(alert.severity)}
                  message={`${alert.tankName} - ${alert.siteName}`}
                  description={alert.message}
                  showIcon
                  className="tw-mb-2"
                />
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Charts */}
      <Row gutter={16} className="tw-mb-6">
        <Col span={12}>
          <Card title="Variance Trend" loading={loading}>
            {reportData && (
              <Line
                data={getVarianceTrendData()}
                xField="date"
                yField="averageVariance"
                height={300}
                smooth={true}
                point={{ size: 4 }}
                color="#1890ff"
              />
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Top Tanks by Variance" loading={loading}>
            {reportData && (
              <Column
                data={getTankPerformanceData()}
                xField="tankName"
                yField="averageVariance"
                height={300}
                color="#ff7875"
                label={{
                  position: "top",
                  formatter: (datum) => `${datum.averageVariance.toFixed(1)}L`,
                }}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Reconciliation Data Table */}
      <Card
        title="Reconciliation Records"
        loading={loading}
        extra={
          <Button
            icon={<DownloadOutlined />}
            onClick={() => {
              /* Export functionality */
            }}
          >
            Export
          </Button>
        }
      >
        <Table
          columns={reconciliationColumns}
          dataSource={reportData?.items || []}
          rowKey="id"
          pagination={{
            total: reportData?.pagination?.totalRecords || 0,
            pageSize: reportData?.pagination?.pageSize || 50,
            current: reportData?.pagination?.currentPage || 1,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} records`,
          }}
          scroll={{ x: 1200 }}
          size="small"
          rowClassName={(record) =>
            record.hasDiscrepancy ? "tw-bg-red-50" : ""
          }
        />
      </Card>
    </div>
  );
};

export default DailyReconciliationDashboard;
