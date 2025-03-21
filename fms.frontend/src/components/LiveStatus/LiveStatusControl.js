import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button, SelectBox } from "devextreme-react";
import {
  toggleLiveData,
  setUpdateFrequency,
} from "../../redux/actions/ptsActions/realtimeStatusActions";
import "./LiveStatusControl.scss";

const LiveStatusControl = ({ compact = false }) => {
  const dispatch = useDispatch();
  const realtimeStatus = useSelector((state) => state.realtimeStatus);

  const handleLiveDataToggle = () => {
    dispatch(toggleLiveData());
  };

  const handleUpdateFrequencyChange = (e) => {
    dispatch(setUpdateFrequency(e.value));
  };

  const frequencyOptions = [
    { value: 10, text: "10 seconds" },
    { value: 30, text: "30 seconds" },
    { value: 60, text: "1 minute" },
    { value: 300, text: "5 minutes" },
  ];

  if (compact) {
    return (
      <div className="live-status-control compact">
        <div className="live-indicator">
          <span
            className={`status-dot ${
              realtimeStatus.isLiveDataEnabled ? "active" : "inactive"
            }`}
          ></span>
          <span className="status-text">Live</span>
        </div>
        <Button
          icon={realtimeStatus.isLiveDataEnabled ? "pause" : "play"}
          onClick={handleLiveDataToggle}
          stylingMode="contained"
          type={realtimeStatus.isLiveDataEnabled ? "danger" : "success"}
          width={32}
          height={32}
        />
      </div>
    );
  }

  return (
    <div className="live-status-control">
      <div className="live-indicator">
        <span
          className={`status-dot ${
            realtimeStatus.isLiveDataEnabled ? "active" : "inactive"
          }`}
        ></span>
        <span className="status-text">
          Live Data: {realtimeStatus.isLiveDataEnabled ? "On" : "Off"}
        </span>
      </div>
      <Button
        text={
          realtimeStatus.isLiveDataEnabled
            ? "Pause Live Updates"
            : "Enable Live Updates"
        }
        onClick={handleLiveDataToggle}
        stylingMode="contained"
        type={realtimeStatus.isLiveDataEnabled ? "danger" : "success"}
        className="live-toggle-btn"
      />
      <div className="frequency-selector">
        <span>Update Frequency:</span>
        <SelectBox
          items={frequencyOptions}
          valueExpr="value"
          displayExpr="text"
          value={realtimeStatus.updateFrequency}
          onValueChanged={handleUpdateFrequencyChange}
          width={150}
          disabled={!realtimeStatus.isLiveDataEnabled}
        />
      </div>
    </div>
  );
};

export default LiveStatusControl;
