import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, SelectBox } from "devextreme-react";
import {
  toggleLiveData,
  setUpdateFrequency,
} from "../../redux/actions/ptsActions/realtimeStatusActions";
import "./LiveStatusControl.scss";

export const LiveStatusControl = ({ compact = false }) => {
  const dispatch = useDispatch();
  const realtimeStatus = useSelector((state) => state.realtimeStatus);

  const handleLiveDataToggle = () => {
    dispatch(toggleLiveData());
  };

  const handleUpdateFrequencyChange = (e) => {
    dispatch(setUpdateFrequency(e.value));
  };

  const frequencyOptions = [
    { value: 5, text: "5 sec" },
    { value: 10, text: "10 sec" },
    { value: 30, text: "30 sec" },
    { value: 60, text: "1 min" },
    { value: 300, text: "5 min" },
  ];

  return (
    <div className={`live-status-control ${compact ? "compact" : ""}`}>
      <div className="live-indicator">
        <span
          className={`status-dot ${
            realtimeStatus.isLiveDataEnabled ? "active" : "inactive"
          }`}
        ></span>
        <span className="status-text">
          {realtimeStatus.isLiveDataEnabled ? "Live Data" : "Paused"}
        </span>
      </div>

      {!compact && (
        <div className="frequency-control">
          <span className="frequency-label">Update every:</span>
          <SelectBox
            className="frequency-select"
            items={frequencyOptions}
            value={realtimeStatus.updateFrequency}
            onValueChanged={handleUpdateFrequencyChange}
            displayExpr="text"
            valueExpr="value"
          />
        </div>
      )}

      <Button
        icon={realtimeStatus.isLiveDataEnabled ? "pause" : "play"}
        onClick={handleLiveDataToggle}
        stylingMode="contained"
        type={realtimeStatus.isLiveDataEnabled ? "danger" : "success"}
        width={compact ? 32 : 40}
        height={compact ? 32 : 40}
        hint={
          realtimeStatus.isLiveDataEnabled
            ? "Pause Live Data"
            : "Resume Live Data"
        }
      />
    </div>
  );
};

export default LiveStatusControl;
