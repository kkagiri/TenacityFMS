import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import EnhancedOperatorDashboard from "./components/EnhancedOperatorDashboard";
import EnhancedManagerDashboard from "./components/EnhancedManagerDashboard";
import EnhancedExecutiveDashboard from "./components/EnhancedExecutiveDashboard";
import PolicyManagement from "./components/PolicyManagement";
import ExecutionMonitoring from "./components/ExecutionMonitoring";
import DiscrepancyAnalysis from "./components/DiscrepancyAnalysis";
import SettingsPopup from "./components/SettingsPopup";
import { setActiveTab, setUserRole } from "../../redux/actions/automatedReconciliationActions";

const AutomatedReconciliationSystem = () => {
  const dispatch = useDispatch();
  const { activeTab, userRole } = useSelector(state => state.automatedReconciliation);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleTabChange = (newTab) => {
    dispatch(setActiveTab(newTab));
  };

  const handleRoleChange = (newRole) => {
    dispatch(setUserRole(newRole));
  };

  return (
    <div className="tw-min-h-screen tw-bg-gray-50">
      {/* Header */}
      <header className="tw-bg-white tw-border-b tw-border-gray-200 tw-px-6 tw-py-4">
        <div className="tw-flex tw-items-center tw-justify-between">
          <div className="tw-flex tw-items-center tw-space-x-4">
            <h1 className="tw-text-2xl tw-font-bold tw-text-gray-900">Automated Reconciliation System</h1>
            <Badge variant="outline" className="tw-bg-green-50 tw-text-green-700 tw-border-green-200">
              <i className="fa-light fa-circle-check tw-mr-1"></i>
              System Healthy
            </Badge>
          </div>
          <div className="tw-flex tw-items-center tw-space-x-4">
            <Select value={userRole} onValueChange={handleRoleChange}>
              <SelectTrigger className="tw-w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operator">Operator View</SelectItem>
                <SelectItem value="manager">Manager View</SelectItem>
                <SelectItem value="executive">Executive View</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
              <i className="fa-light fa-gear tw-mr-2"></i>
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="tw-bg-white tw-border-b tw-border-gray-200 tw-px-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="tw-w-full">
          <TabsList className="tw-grid tw-w-full tw-grid-cols-5 tw-bg-transparent tw-h-12">
            <TabsTrigger value="dashboard" className="tw-flex tw-items-center tw-space-x-2">
              <i className="fa-light fa-chart-bar tw-text-sm"></i>
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="policies" className="tw-flex tw-items-center tw-space-x-2">
              <i className="fa-light fa-file-text tw-text-sm"></i>
              <span>Policies</span>
            </TabsTrigger>
            <TabsTrigger value="executions" className="tw-flex tw-items-center tw-space-x-2">
              <i className="fa-light fa-play tw-text-sm"></i>
              <span>Executions</span>
            </TabsTrigger>
            <TabsTrigger value="discrepancies" className="tw-flex tw-items-center tw-space-x-2">
              <i className="fa-light fa-triangle-exclamation tw-text-sm"></i>
              <span>Discrepancies</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="tw-flex tw-items-center tw-space-x-2">
              <i className="fa-light fa-users tw-text-sm"></i>
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>

          <div className="tw-py-6">
            <TabsContent value="dashboard" className="tw-mt-0">
              {userRole === "operator" && <EnhancedOperatorDashboard />}
              {userRole === "manager" && <EnhancedManagerDashboard />}
              {userRole === "executive" && <EnhancedExecutiveDashboard />}
            </TabsContent>

            <TabsContent value="policies" className="tw-mt-0">
              <PolicyManagement />
            </TabsContent>

            <TabsContent value="executions" className="tw-mt-0">
              <ExecutionMonitoring />
            </TabsContent>

            <TabsContent value="discrepancies" className="tw-mt-0">
              <DiscrepancyAnalysis />
            </TabsContent>

            <TabsContent value="analytics" className="tw-mt-0">
              <EnhancedExecutiveDashboard />
            </TabsContent>
          </div>
        </Tabs>
      </nav>
      <SettingsPopup isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default AutomatedReconciliationSystem;