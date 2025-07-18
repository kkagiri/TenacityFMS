
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import MissionControlLayout from '../../components/missionControl/layout/MissionControlLayout';
import EnhancedOperatorDashboard from "./components/EnhancedOperatorDashboard";
import EnhancedManagerDashboard from "./components/EnhancedManagerDashboard";
import EnhancedExecutiveDashboard from "./components/EnhancedExecutiveDashboard";
import PolicyManagement from "./components/PolicyManagement";
import ExecutionMonitoring from "./components/ExecutionMonitoring";
import DiscrepancyAnalysis from "./components/DiscrepancyAnalysis";
import ReconciliationMissionControl from "./components/ReconciliationMissionControl";
import SettingsPopup from "./components/SettingsPopup";
import { setActiveTab, setUserRole } from "../../redux/actions/automatedReconciliationActions";
import './EnhancedAutomatedReconciliationSystem.scss';

//Cursor - Enhanced Automated Reconciliation System with Mission Control integration
const EnhancedAutomatedReconciliationSystem = () => {
  const dispatch = useDispatch();
  const { activeTab, userRole } = useSelector(state => state.automatedReconciliation);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Mission Control specific data
  const [missionControlData, setMissionControlData] = useState({
    criticalAlerts: [],
    liveMetrics: {},
    quickActions: []
  });

  const [reconciliationStatus, setReconciliationStatus] = useState({
    isRunning: false,
    lastRun: new Date(),
    success: true,
    totalDiscrepancies: 3,
    autoResolvedDiscrepancies: 2,
    pendingDiscrepancies: 1,
    averageAccuracy: 98.5,
    systemHealth: 'healthy'
  });

  useEffect(() => {
    //Cursor - Setup Mission Control data for reconciliation
    const alerts = [
      {
        id: 'variance_alert_1',
        message: 'High variance detected in Tank #3 - Automatic reconciliation failed',
        severity: 'critical',
        location: 'Site A - Tank #3',
        actionRequired: true,
        onAction: () => handleForceReconciliation('tank_3')
      },
      {
        id: 'compliance_warning',
        message: 'Reconciliation accuracy below threshold (95%)',
        severity: 'warning',
        location: 'Site B',
        actionRequired: true,
        onAction: () => handleComplianceReview()
      }
    ];

    const metrics = {
      totalTanks: 24,
      stockLevel: 87,
      reconciliationAccuracy: reconciliationStatus.averageAccuracy,
      activeAlerts: alerts.length,
      systemUptime: 99.8
    };

    const actions = [
      {
        id: 'force_reconciliation',
        label: 'Force Reconciliation',
        icon: 'fa-calculator',
        criticality: 'HIGH',
        isPrimary: true,
        requiresConfirmation: true,
        estimatedTime: '5 min',
        onClick: () => handleForceReconciliation()
      },
      {
        id: 'run_compliance_check',
        label: 'Compliance Check',
        icon: 'fa-shield-check',
        criticality: 'MEDIUM',
        isPrimary: true,
        estimatedTime: '3 min',
        onClick: () => handleComplianceCheck()
      },
      {
        id: 'audit_trail',
        label: 'Generate Audit Trail',
        icon: 'fa-file-lines',
        criticality: 'LOW',
        isPrimary: true,
        estimatedTime: '2 min',
        onClick: () => handleGenerateAuditTrail()
      },
      {
        id: 'variance_analysis',
        label: 'Variance Analysis',
        icon: 'fa-chart-line',
        criticality: 'LOW',
        isPrimary: false,
        estimatedTime: '10 min',
        onClick: () => handleVarianceAnalysis()
      },
      {
        id: 'backup_reconciliation',
        label: 'Backup Reconciliation',
        icon: 'fa-database',
        criticality: 'MEDIUM',
        isPrimary: false,
        estimatedTime: '15 min',
        onClick: () => handleBackupReconciliation()
      }
    ];

    setMissionControlData({
      criticalAlerts: alerts,
      liveMetrics: metrics,
      quickActions: actions
    });
  }, [reconciliationStatus]);

  const handleTabChange = (newTab) => {
    dispatch(setActiveTab(newTab));
  };

  const handleRoleChange = (newRole) => {
    dispatch(setUserRole(newRole));
  };

  const handleForceReconciliation = async (tankId = null) => {
    //Cursor - Force reconciliation workflow
    console.log('Forcing reconciliation for:', tankId || 'all tanks');
    setReconciliationStatus(prev => ({ ...prev, isRunning: true }));

    // Simulate reconciliation process
    setTimeout(() => {
      setReconciliationStatus(prev => ({
        ...prev,
        isRunning: false,
        lastRun: new Date(),
        success: true
      }));
    }, 5000);
  };

  const handleComplianceCheck = async () => {
    //Cursor - Compliance check workflow
    console.log('Running compliance check...');
  };

  const handleGenerateAuditTrail = async () => {
    //Cursor - Generate audit trail workflow
    console.log('Generating audit trail...');
  };

  const handleVarianceAnalysis = async () => {
    //Cursor - Variance analysis workflow
    console.log('Running variance analysis...');
  };

  const handleBackupReconciliation = async () => {
    //Cursor - Backup reconciliation workflow
    console.log('Running backup reconciliation...');
  };

  const handleComplianceReview = () => {
    //Cursor - Navigate to compliance review
    dispatch(setActiveTab('discrepancies'));
  };

  const additionalHeaderContent = (
    <div className="tw-flex tw-items-center tw-space-x-4">
      <Badge
        variant="outline"
        className={`tw-${reconciliationStatus.systemHealth === 'healthy' ? 'bg-green-50 tw-text-green-700 tw-border-green-200' : 'bg-red-50 tw-text-red-700 tw-border-red-200'}`}
      >
        <i className={`fa-light fa-${reconciliationStatus.systemHealth === 'healthy' ? 'circle-check' : 'triangle-exclamation'} tw-mr-1`}></i>
        System {reconciliationStatus.systemHealth === 'healthy' ? 'Healthy' : 'Alert'}
      </Badge>

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

      <button
        onClick={() => setIsSettingsOpen(true)}
        className="tw-bg-gray-100 tw-text-gray-700 tw-px-4 tw-py-2 tw-rounded-lg tw-text-sm tw-font-medium tw-transition-all tw-hover:bg-gray-200"
      >
        <i className="fa-light fa-gear tw-mr-2"></i>
        Settings
      </button>
    </div>
  );

  return (
    <MissionControlLayout
      title="Reconciliation Mission Control"
      criticalAlerts={missionControlData.criticalAlerts}
      liveMetrics={missionControlData.liveMetrics}
      quickActions={missionControlData.quickActions}
      additionalHeaderContent={additionalHeaderContent}
      className="enhanced-reconciliation-system"
    >
      {/* Mission Control Reconciliation Overview */}
      <div className="tw-mb-6">
        <ReconciliationMissionControl
          status={reconciliationStatus}
          onForceReconciliation={handleForceReconciliation}
        />
      </div>

      {/* Navigation */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="tw-w-full">
          <TabsList className="tw-grid tw-w-full tw-grid-cols-5 tw-bg-gray-100 tw-h-12 tw-rounded-lg">
            <TabsTrigger value="dashboard" className="tw-flex tw-items-center tw-space-x-2 tw-rounded-lg">
              <i className="fa-light fa-chart-bar tw-text-sm"></i>
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="policies" className="tw-flex tw-items-center tw-space-x-2 tw-rounded-lg">
              <i className="fa-light fa-file-text tw-text-sm"></i>
              <span>Policies</span>
            </TabsTrigger>
            <TabsTrigger value="executions" className="tw-flex tw-items-center tw-space-x-2 tw-rounded-lg">
              <i className="fa-light fa-play tw-text-sm"></i>
              <span>Executions</span>
            </TabsTrigger>
            <TabsTrigger value="discrepancies" className="tw-flex tw-items-center tw-space-x-2 tw-rounded-lg">
              <i className="fa-light fa-triangle-exclamation tw-text-sm"></i>
              <span>Discrepancies</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="tw-flex tw-items-center tw-space-x-2 tw-rounded-lg">
              <i className="fa-light fa-chart-mixed tw-text-sm"></i>
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
      </div>

      <SettingsPopup isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </MissionControlLayout>
  );
};

export default EnhancedAutomatedReconciliationSystem;