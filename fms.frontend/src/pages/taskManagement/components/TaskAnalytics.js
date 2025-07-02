import React, { useState, useEffect } from 'react';
import { Chart, Series, ArgumentAxis, ValueAxis, Legend, Title } from 'devextreme-react/chart';
import { PieChart, Series as PieSeries, Label } from 'devextreme-react/pie-chart';
import { DataGrid, Column, Summary, TotalItem, Paging, Pager } from 'devextreme-react/data-grid';
import { SelectBox } from 'devextreme-react/select-box';
import { DateBox } from 'devextreme-react/date-box';
import { Button } from 'devextreme-react/button';
import { TaskService } from '../../../services/taskService';
import notify from 'devextreme/ui/notify';

const TaskAnalytics = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
    siteId: null
  });
  const [tasksByStatus, setTasksByStatus] = useState([]);
  const [tasksByPriority, setTasksByPriority] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Load tasks with filters
      const tasksResponse = await TaskService.getTasks({
        startDate: filters.startDate,
        endDate: filters.endDate,
        siteId: filters.siteId,
        pageSize: 1000 // Get all tasks for analysis
      });

      const tasksData = tasksResponse.data || [];
      setTasks(tasksData);

      // Load summary data
      try {
        await TaskService.getTaskSummary(
          filters.siteId,
          filters.startDate,
          filters.endDate
        );
      } catch (summaryError) {
        console.warn('Summary data not available:', summaryError.message);
      }

      // Process data for charts
      processChartData(tasksData);

    } catch (error) {
      notify('Failed to load analytics data: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.startDate, filters.endDate, filters.siteId]);

  const processChartData = (tasksData) => {
    // Tasks by Status
    const statusCounts = tasksData.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    setTasksByStatus(Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: ((count / tasksData.length) * 100).toFixed(1)
    })));

    // Tasks by Priority
    const priorityCounts = tasksData.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});

    setTasksByPriority(Object.entries(priorityCounts).map(([priority, count]) => ({
      priority,
      count,
      percentage: ((count / tasksData.length) * 100).toFixed(1)
    })));

    // Tasks by Type (removed from component state as it's not used in render)
    const typeCounts = tasksData.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1;
      return acc;
    }, {});

    console.log('Task distribution by type:', typeCounts);

    // Performance Data (completion time analysis)
    const performanceByType = tasksData
      .filter(task => task.status === 'Completed' && task.assignedOn && task.completedOn)
      .map(task => {
        const assignedDate = new Date(task.assignedOn);
        const completedDate = new Date(task.completedOn);
        const completionTime = Math.ceil((completedDate - assignedDate) / (1000 * 60 * 60 * 24)); // days

        return {
          type: task.type,
          completionTime,
          priority: task.priority
        };
      });

    const avgCompletionByType = performanceByType.reduce((acc, task) => {
      if (!acc[task.type]) {
        acc[task.type] = { total: 0, count: 0 };
      }
      acc[task.type].total += task.completionTime;
      acc[task.type].count += 1;
      return acc;
    }, {});

    setPerformanceData(Object.entries(avgCompletionByType).map(([type, data]) => ({
      type,
      avgCompletionDays: (data.total / data.count).toFixed(1),
      count: data.count
    })));
  };

  const handleFilterChange = () => {
    loadAnalyticsData();
  };

  const overdueCount = tasks.filter(task =>
    task.status !== 'Completed' &&
    new Date(task.dueDate) < new Date()
  ).length;

  const siteOptions = [
    { value: null, text: 'All Sites' },
    { value: 1, text: 'Site A' },
    { value: 2, text: 'Site B' },
    { value: 3, text: 'Site C' }
  ];

  return (
    <div className="tw-p-6 tw-bg-gray-50 tw-min-h-screen">
      <div className="tw-mb-6">
        <h1 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-mb-4">
          <i className="fa-light fa-chart-line tw-mr-2"></i>
          Task Analytics & Reports
        </h1>

        {/* Filters */}
        <div className="tw-bg-white tw-p-4 tw-rounded-lg tw-shadow tw-mb-6">
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4 tw-items-end">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Start Date
              </label>
              <DateBox
                value={filters.startDate}
                onValueChanged={(e) => setFilters({...filters, startDate: e.value})}
                type="date"
              />
            </div>
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                End Date
              </label>
              <DateBox
                value={filters.endDate}
                onValueChanged={(e) => setFilters({...filters, endDate: e.value})}
                type="date"
              />
            </div>
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                Site
              </label>
              <SelectBox
                dataSource={siteOptions}
                displayExpr="text"
                valueExpr="value"
                value={filters.siteId}
                onValueChanged={(e) => setFilters({...filters, siteId: e.value})}
              />
            </div>
            <div>
              <Button
                text="Apply Filters"
                type="default"
                onClick={handleFilterChange}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4 tw-mb-6">
          <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow">
            <div className="tw-flex tw-items-center">
              <div className="tw-p-3 tw-rounded-full tw-bg-blue-100">
                <i className="fa-light fa-tasks tw-text-blue-600"></i>
              </div>
              <div className="tw-ml-4">
                <p className="tw-text-2xl tw-font-semibold tw-text-gray-900">{tasks.length}</p>
                <p className="tw-text-gray-600">Total Tasks</p>
              </div>
            </div>
          </div>

          <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow">
            <div className="tw-flex tw-items-center">
              <div className="tw-p-3 tw-rounded-full tw-bg-green-100">
                <i className="fa-light fa-check-circle tw-text-green-600"></i>
              </div>
              <div className="tw-ml-4">
                <p className="tw-text-2xl tw-font-semibold tw-text-gray-900">
                  {tasks.filter(t => t.status === 'Completed').length}
                </p>
                <p className="tw-text-gray-600">Completed</p>
              </div>
            </div>
          </div>

          <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow">
            <div className="tw-flex tw-items-center">
              <div className="tw-p-3 tw-rounded-full tw-bg-yellow-100">
                <i className="fa-light fa-clock tw-text-yellow-600"></i>
              </div>
              <div className="tw-ml-4">
                <p className="tw-text-2xl tw-font-semibold tw-text-gray-900">
                  {tasks.filter(t => t.status === 'In Progress').length}
                </p>
                <p className="tw-text-gray-600">In Progress</p>
              </div>
            </div>
          </div>

          <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow">
            <div className="tw-flex tw-items-center">
              <div className="tw-p-3 tw-rounded-full tw-bg-red-100">
                <i className="fa-light fa-exclamation-triangle tw-text-red-600"></i>
              </div>
              <div className="tw-ml-4">
                <p className="tw-text-2xl tw-font-semibold tw-text-gray-900">{overdueCount}</p>
                <p className="tw-text-gray-600">Overdue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6 tw-mb-6">
          {/* Task Status Distribution */}
          <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">Task Status Distribution</h3>
            <PieChart
              dataSource={tasksByStatus}
              palette="Bright"
              width="100%"
              height={300}
            >
              <PieSeries
                argumentField="status"
                valueField="count"
              >
                <Label visible={true} format="percent" />
              </PieSeries>
              <Title text="Tasks by Status" />
            </PieChart>
          </div>

          {/* Task Priority Distribution */}
          <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">Task Priority Distribution</h3>
            <PieChart
              dataSource={tasksByPriority}
              palette="Harmony Light"
              width="100%"
              height={300}
            >
              <PieSeries
                argumentField="priority"
                valueField="count"
              >
                <Label visible={true} format="percent" />
              </PieSeries>
              <Title text="Tasks by Priority" />
            </PieChart>
          </div>
        </div>

        {/* Performance Chart */}
        <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow tw-mb-6">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">Average Completion Time by Task Type</h3>
          <Chart
            dataSource={performanceData}
            width="100%"
            height={400}
          >
            <Series
              valueField="avgCompletionDays"
              argumentField="type"
              name="Average Completion Days"
              type="bar"
              color="#2563eb"
            />
            <ArgumentAxis>
              <Title text="Task Type" />
            </ArgumentAxis>
            <ValueAxis>
              <Title text="Days" />
            </ValueAxis>
            <Legend visible={true} />
            <Title text="Task Completion Performance" />
          </Chart>
        </div>

        {/* Detailed Task List */}
        <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">Detailed Task Analysis</h3>
          <DataGrid
            dataSource={tasks}
            showBorders={true}
            width="100%"
            height={500}
            allowColumnReordering={true}
            allowColumnResizing={true}
            columnAutoWidth={true}
          >
            <Column dataField="title" caption="Task Title" width={200} />
            <Column dataField="type" caption="Type" width={120} />
            <Column dataField="priority" caption="Priority" width={100} />
            <Column dataField="status" caption="Status" width={120} />
            <Column dataField="assignedToName" caption="Assigned To" width={150} />
            <Column
              dataField="dueDate"
              caption="Due Date"
              dataType="date"
              width={120}
              cellRender={(cellData) => {
                const date = new Date(cellData.value);
                const isOverdue = date < new Date() && cellData.data.status !== 'Completed';
                return (
                  <span className={isOverdue ? 'tw-text-red-600 tw-font-semibold' : ''}>
                    {date.toLocaleDateString()}
                  </span>
                );
              }}
            />
            <Column
              dataField="createdOn"
              caption="Created"
              dataType="date"
              width={120}
              cellRender={(cellData) => new Date(cellData.value).toLocaleDateString()}
            />
            <Column dataField="siteName" caption="Site" width={100} />
            <Column dataField="tankName" caption="Tank" width={100} />

            <Summary>
              <TotalItem column="title" summaryType="count" displayFormat="Total: {0} tasks" />
              <TotalItem
                column="status"
                summaryType="count"
                displayFormat="Completed: {0}"
                customizeText={(options) => {
                  const completedCount = tasks.filter(t => t.status === 'Completed').length;
                  return `Completed: ${completedCount}`;
                }}
              />
            </Summary>

            <Paging defaultPageSize={20} />
            <Pager showPageSizeSelector={true} allowedPageSizes={[10, 20, 50, 100]} />
          </DataGrid>
        </div>
      </div>
    </div>
  );
};

export default TaskAnalytics;
