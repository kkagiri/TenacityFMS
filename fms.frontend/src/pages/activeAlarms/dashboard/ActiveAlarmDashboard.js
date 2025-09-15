import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadActiveAlarmDashboard } from '../../../redux/actions/activeAlarmActions';
import AlarmCard from '../components/shared/AlarmCard';

const ActiveAlarmDashboard = () => {
  const dispatch = useDispatch();
  const { statistics, alarms, loadingStates } = useSelector(state => state.activeAlarm);

  useEffect(() => {
    dispatch(loadActiveAlarmDashboard());
  }, [dispatch]);

  return (
    <div className="active-alarm-dashboard">
      {/* Alarm Statistics Summary */}
      <div className="tw-mb-8">
        <AlarmCard
          type="summary"
          statistics={statistics}
          showActions={true}
          showDetails={true}
        />
      </div>

      {/* Recent Alarms Table */}
      <div className="dashboard-section">
        <h2>Recent Active Alarms</h2>
        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-overflow-hidden">
          {loadingStates.fetchingAlarms ? (
            <div className="tw-p-8 tw-text-center">
              <div className="tw-animate-spin tw-rounded-full tw-h-12 tw-w-12 tw-border-b-2 tw-border-red-600 tw-mx-auto"></div>
              <p className="tw-mt-4 tw-text-gray-600">Loading alarms...</p>
            </div>
          ) : alarms && alarms.length > 0 ? (
            <div className="tw-overflow-x-auto">
              <table className="tw-min-w-full tw-divide-y tw-divide-gray-200">
                <thead className="tw-bg-gray-50">
                  <tr>
                    <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                      Priority
                    </th>
                    <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                      Type
                    </th>
                    <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                      Message
                    </th>
                    <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                      Site
                    </th>
                    <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                      Time
                    </th>
                    <th className="tw-px-6 tw-py-3 tw-text-left tw-text-xs tw-font-medium tw-text-gray-500 tw-uppercase tw-tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="tw-bg-white tw-divide-y tw-divide-gray-200">
                  {alarms.slice(0, 10).map((alarm) => (
                    <tr key={alarm.id} className="tw-hover:tw-bg-gray-50">
                      <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap">
                        <span className={`priority-badge ${alarm.priority?.toLowerCase()}`}>
                          {alarm.priority}
                        </span>
                      </td>
                      <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-gray-900">
                        {alarm.alarmType}
                      </td>
                      <td className="tw-px-6 tw-py-4 tw-text-sm tw-text-gray-900">
                        <div className="tw-max-w-xs tw-truncate" title={alarm.message}>
                          {alarm.message}
                        </div>
                      </td>
                      <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-gray-900">
                        {alarm.site?.name || 'N/A'}
                      </td>
                      <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-text-gray-500">
                        {new Date(alarm.triggeredAt).toLocaleString()}
                      </td>
                      <td className="tw-px-6 tw-py-4 tw-whitespace-nowrap tw-text-sm tw-font-medium">
                        <button
                          className="tw-text-red-600 hover:tw-text-red-900 tw-mr-3"
                          onClick={() => window.location.href = `/active-alarms/${alarm.id}/details`}
                        >
                          View
                        </button>
                        {alarm.state === 'Active' && (
                          <button className="tw-text-blue-600 hover:tw-text-blue-900">
                            Acknowledge
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="tw-p-8 tw-text-center">
              <i className="fa-light fa-bell-slash tw-text-4xl tw-text-gray-400 tw-mb-4"></i>
              <p className="tw-text-gray-600">No active alarms at this time</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .dashboard-section {
          @apply tw-mb-8;
        }

        .dashboard-section h2 {
          @apply tw-text-xl tw-font-semibold tw-text-gray-900 tw-mb-4;
        }

        .priority-badge {
          @apply tw-inline-flex tw-items-center tw-px-2.5 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium;
        }

        .priority-badge.critical {
          @apply tw-bg-red-100 tw-text-red-800;
        }

        .priority-badge.high {
          @apply tw-bg-orange-100 tw-text-orange-800;
        }

        .priority-badge.medium {
          @apply tw-bg-yellow-100 tw-text-yellow-800;
        }

        .priority-badge.low {
          @apply tw-bg-green-100 tw-text-green-800;
        }
      `}</style>
    </div>
  );
};

export default ActiveAlarmDashboard;
