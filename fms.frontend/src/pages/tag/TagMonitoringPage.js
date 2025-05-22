import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchTagConfigs,
  createTagConfig,
  updateTagConfig,
  deleteTagConfig,
  fetchTagLogs,
} from "../../redux/actions/tagMonitoringActions";

const TagMonitoringPage = () => {
  const dispatch = useDispatch();
  const { configs, logs, loading } = useSelector(
    (state) => state.tagMonitoring || {}
  );

  useEffect(() => {
    dispatch(fetchTagConfigs());
    dispatch(fetchTagLogs());
  }, [dispatch]);

  return (
    <div className="tw-p-6">
      <h2 className="tw-text-xl tw-font-bold tw-mb-4">
        <i className="fas fa-tags tw-mr-2"></i>Tag Monitoring Configurations
      </h2>
      {loading && <div>Loading...</div>}
      <table className="tw-table-auto tw-w-full tw-mb-8">
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Tag Name</th>
            <th>Enabled</th>
            <th>Ignored Locations</th>
            <th>Monitored</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {configs &&
            configs.map((cfg) => (
              <tr key={cfg.id}>
                <td>{cfg.vehicle?.hyoungNo || cfg.vehicleId}</td>
                <td>{cfg.tagName}</td>
                <td>{cfg.isEnabled ? "Yes" : "No"}</td>
                <td>{cfg.ignoredLocations}</td>
                <td>{cfg.monitored ? "Yes" : "No"}</td>
                <td>
                  {/* Add edit/delete buttons here */}
                  <button
                    className="tw-text-red-500 tw-mr-2"
                    onClick={() => dispatch(deleteTagConfig(cfg.id))}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                  {/* You can add edit functionality here */}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      <h2 className="tw-text-xl tw-font-bold tw-mb-4">
        <i className="fas fa-history tw-mr-2"></i>Tag Change Logs
      </h2>
      <table className="tw-table-auto tw-w-full">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Vehicle</th>
            <th>Old Tag</th>
            <th>New Tag</th>
            <th>Location</th>
            <th>Action</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {logs &&
            logs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.vehicle?.hyoungNo || log.vehicleId}</td>
                <td>{log.oldTag}</td>
                <td>{log.newTag}</td>
                <td>{log.location}</td>
                <td>{log.action}</td>
                <td>{log.note}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};

export default TagMonitoringPage;
