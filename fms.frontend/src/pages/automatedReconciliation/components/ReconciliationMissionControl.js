
import PropTypes from 'prop-types';
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Progress } from "../../../components/ui/progress";
import './ReconciliationMissionControl.scss';

//Cursor - Reconciliation Mission Control - Live reconciliation status and controls
const ReconciliationMissionControl = ({ status, onForceReconciliation }) => {
  const getStatusColor = (isRunning, success) => {
    if (isRunning) return 'tw-bg-blue-100 tw-text-blue-800';
    if (success) return 'tw-bg-green-100 tw-text-green-800';
    return 'tw-bg-red-100 tw-text-red-800';
  };

  const getStatusIcon = (isRunning, success) => {
    if (isRunning) return 'fa-spinner fa-spin';
    if (success) return 'fa-check-circle';
    return 'fa-triangle-exclamation';
  };

  const formatLastRun = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;

    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  };

  const accuracyPercentage = status.averageAccuracy || 0;
  const totalDiscrepancies = status.totalDiscrepancies || 0;
  const resolvedDiscrepancies = status.autoResolvedDiscrepancies || 0;
  const pendingDiscrepancies = status.pendingDiscrepancies || 0;

  return (
    <div className="reconciliation-mission-control">
      <Card className="tw-border-l-4 tw-border-l-blue-600">
        <CardHeader>
          <div className="tw-flex tw-items-center tw-justify-between">
            <CardTitle className="tw-flex tw-items-center tw-space-x-3">
              <i className="fa-light fa-calculator tw-text-blue-600 tw-text-xl"></i>
              <span>Reconciliation Mission Control</span>
            </CardTitle>
            <div className="tw-flex tw-items-center tw-space-x-3">
              <Badge className={getStatusColor(status.isRunning, status.success)}>
                <i className={`fa-light ${getStatusIcon(status.isRunning, status.success)} tw-mr-1`}></i>
                {status.isRunning ? 'Running' : status.success ? 'Healthy' : 'Alert'}
              </Badge>
              <Button
                onClick={onForceReconciliation}
                disabled={status.isRunning}
                variant="outline"
                size="sm"
              >
                <i className="fa-light fa-bolt tw-mr-2"></i>
                Force Reconciliation
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6">
            {/* Accuracy Metric */}
            <div className="tw-bg-gradient-to-br tw-from-green-50 tw-to-emerald-100 tw-p-4 tw-rounded-lg tw-border tw-border-green-200">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                <i className="fa-light fa-target tw-text-green-600 tw-text-lg"></i>
                <span className="tw-text-2xl tw-font-bold tw-text-green-800">
                  {accuracyPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="tw-text-sm tw-text-green-700 tw-font-medium">Accuracy Rate</div>
              <Progress
                value={accuracyPercentage}
                className="tw-mt-2 tw-h-2"
                style={{ '--progress-background': '#10b981' }}
              />
            </div>

            {/* Total Discrepancies */}
            <div className="tw-bg-gradient-to-br tw-from-yellow-50 tw-to-amber-100 tw-p-4 tw-rounded-lg tw-border tw-border-yellow-200">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                <i className="fa-light fa-triangle-exclamation tw-text-yellow-600 tw-text-lg"></i>
                <span className="tw-text-2xl tw-font-bold tw-text-yellow-800">
                  {totalDiscrepancies}
                </span>
              </div>
              <div className="tw-text-sm tw-text-yellow-700 tw-font-medium">Total Discrepancies</div>
              <div className="tw-text-xs tw-text-yellow-600 tw-mt-1">
                {resolvedDiscrepancies} resolved, {pendingDiscrepancies} pending
              </div>
            </div>

            {/* Auto Resolution Rate */}
            <div className="tw-bg-gradient-to-br tw-from-blue-50 tw-to-cyan-100 tw-p-4 tw-rounded-lg tw-border tw-border-blue-200">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                <i className="fa-light fa-robot tw-text-blue-600 tw-text-lg"></i>
                <span className="tw-text-2xl tw-font-bold tw-text-blue-800">
                  {totalDiscrepancies > 0 ? Math.round((resolvedDiscrepancies / totalDiscrepancies) * 100) : 0}%
                </span>
              </div>
              <div className="tw-text-sm tw-text-blue-700 tw-font-medium">Auto Resolution</div>
              <div className="tw-text-xs tw-text-blue-600 tw-mt-1">
                {resolvedDiscrepancies} of {totalDiscrepancies} auto-resolved
              </div>
            </div>

            {/* Last Run Status */}
            <div className="tw-bg-gradient-to-br tw-from-gray-50 tw-to-slate-100 tw-p-4 tw-rounded-lg tw-border tw-border-gray-200">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
                <i className="fa-light fa-clock tw-text-gray-600 tw-text-lg"></i>
                <div className="tw-text-right">
                  <div className="tw-text-sm tw-font-medium tw-text-gray-800">
                    {formatLastRun(status.lastRun)}
                  </div>
                  <div className="tw-text-xs tw-text-gray-600">
                    {status.lastRun.toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <div className="tw-text-sm tw-text-gray-700 tw-font-medium">Last Reconciliation</div>
            </div>
          </div>

          {/* Running Status */}
          {status.isRunning && (
            <div className="tw-mt-6 tw-p-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg">
              <div className="tw-flex tw-items-center tw-space-x-3">
                <i className="fa-light fa-spinner fa-spin tw-text-blue-600 tw-text-lg"></i>
                <div>
                  <div className="tw-font-medium tw-text-blue-800">Reconciliation in Progress</div>
                  <div className="tw-text-sm tw-text-blue-700">
                    Processing tank measurements and transaction data...
                  </div>
                </div>
              </div>
              <Progress value={75} className="tw-mt-3 tw-h-2" />
              <div className="tw-text-xs tw-text-blue-600 tw-mt-1">
                Estimated completion: 2 minutes
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="tw-mt-6">
            <div className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-3">Quick Actions</div>
            <div className="tw-flex tw-flex-wrap tw-gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => console.log('Viewing variance heatmap...')}
              >
                <i className="fa-light fa-chart-scatter tw-mr-2"></i>
                Variance Heatmap
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => console.log('Generating compliance report...')}
              >
                <i className="fa-light fa-file-chart-column tw-mr-2"></i>
                Compliance Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => console.log('Viewing audit trail...')}
              >
                <i className="fa-light fa-list-timeline tw-mr-2"></i>
                Audit Trail
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => console.log('Managing automation rules...')}
              >
                <i className="fa-light fa-gear tw-mr-2"></i>
                Automation Rules
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

ReconciliationMissionControl.propTypes = {
  status: PropTypes.shape({
    isRunning: PropTypes.bool.isRequired,
    lastRun: PropTypes.instanceOf(Date).isRequired,
    success: PropTypes.bool.isRequired,
    totalDiscrepancies: PropTypes.number,
    autoResolvedDiscrepancies: PropTypes.number,
    pendingDiscrepancies: PropTypes.number,
    averageAccuracy: PropTypes.number,
    systemHealth: PropTypes.string
  }).isRequired,
  onForceReconciliation: PropTypes.func.isRequired
};

export default ReconciliationMissionControl;