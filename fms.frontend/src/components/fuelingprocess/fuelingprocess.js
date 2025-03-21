import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
//claude import needed components from devextreme
import { Popup } from "devextreme-react/popup";
import { Button } from "devextreme-react/button";
import { TextBox } from "devextreme-react/text-box";
import { SelectBox } from "devextreme-react/select-box";
import { NumberBox } from "devextreme-react/number-box";
import ScrollView from "devextreme-react/scroll-view";
import { TileView } from "devextreme-react/tile-view";
import ProgressBar from "devextreme-react/progress-bar";
import LoadIndicator from "devextreme-react/load-indicator";
import notify from "devextreme/ui/notify";
//claude import icons and confirm dialog
import { Tooltip } from "devextreme-react/tooltip";

// Import styles
import "./fuelingprocess.scss"; //claude import scss file

// Sample data - To replace with live data from redux/API
const pumps = [
  { id: 1, name: "Pump 1", status: "idle", fuelType: "Diesel" },
  { id: 2, name: "Pump 2", status: "busy", fuelType: "Petrol" },
  { id: 3, name: "Pump 3", status: "idle", fuelType: "Diesel" },
  { id: 4, name: "Pump 4", status: "maintenance", fuelType: "Petrol" },
];

const nozzles = [
  { id: 1, name: "Nozzle 1", status: "idle" },
  { id: 2, name: "Nozzle 2", status: "idle" },
];

const vehicleDetails = {
  monthlyLimit: 2000,
  monthlyUsed: 1200,
  dailyLimit: 100,
  dailyUsed: 50,
  fuelingLimit: 60,
};

//To:DOlink required
// 1. Redux actions for PTSDevices, tanks, pumps, nozzles
// 2. API services for fueling transactions
// 3. Vehicle information/limits API
// 4. Authentication/user permissions
// 5. SignalR for real-time fueling status

const FuelingProcess = () => {
  const dispatch = useDispatch();
  const { ptsId } = useParams();
  const navigate = useNavigate();

  // In a real implementation, these would come from Redux/API
  const [ptsDevice, setPtsDevice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showNavigationDialog, setShowNavigationDialog] = useState(false);
  const [navigateTo, setNavigateTo] = useState(null);

  // Step management
  const [step, setStep] = useState("pump");
  const [selectedPump, setSelectedPump] = useState(null);
  const [selectedNozzle, setSelectedNozzle] = useState(null);
  const [vehicleReg, setVehicleReg] = useState("");
  const [isFueling, setIsFueling] = useState(false);
  const [fuelingComplete, setFuelingComplete] = useState(false);
  const [fuelingAmount, setFuelingAmount] = useState(0);

  // Fetch PTS device data when component mounts
  useEffect(() => {
    // In a real implementation, this would be:
    // dispatch(fetchPTSDeviceById(ptsId))
    //   .then(() => setIsLoading(false))
    //   .catch(error => {
    //     notify(error.message, 'error', 3000);
    //     setIsLoading(false);
    //   });

    // Simulate API call with timeout
    setTimeout(() => {
      setPtsDevice({
        id: ptsId,
        name: `PTS Device ${ptsId}`,
        deviceId: `PTS00${ptsId}`,
        status: "online",
        lastSync: "2 mins ago",
        tanks: 4,
        pumps: 8,
        tankLevel: 75,
      });
      setIsLoading(false);
    }, 1000);
  }, [ptsId, dispatch]);

  // Simulate fueling progress
  useEffect(() => {
    if (isFueling) {
      const interval = setInterval(() => {
        setFuelingAmount((prev) => {
          if (prev >= 45) {
            clearInterval(interval);
            setTimeout(() => {
              setIsFueling(false);
              setFuelingComplete(true);
            }, 1000);
            return 45;
          }
          return prev + 1;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isFueling]);

  const startFueling = () => {
    // In a real implementation, we would call an API here
    // dispatch(startFuelingTransaction({
    //   ptsId,
    //   pumpId: selectedPump.id,
    //   nozzleId: selectedNozzle.id,
    //   vehicleReg
    // }))
    setIsFueling(true);
  };

  const completeFueling = () => {
    // In a real implementation:
    // dispatch(completeFuelingTransaction({
    //   transactionId,
    //   amount: fuelingAmount
    // }))
    navigate("/");
  };

  // Navigation with fueling process check
  const handleNavigation = (path) => {
    if (isFueling) {
      setNavigateTo(path);
      setShowNavigationDialog(true);
    } else {
      navigate(path);
    }
  };

  const confirmNavigation = () => {
    setShowNavigationDialog(false);
    if (navigateTo) {
      navigate(navigateTo);
    }
  };

  const cancelNavigation = () => {
    setShowNavigationDialog(false);
    setNavigateTo(null);
  };

  const renderPumpSelection = () => {
    const availablePumps = pumps.filter((pump) => pump.status === "idle");

    return (
      <div className="dx-card responsive-paddings">
        <h3>Select Pump</h3>
        <div className="dx-fieldset">
          <TileView
            items={pumps}
            baseItemHeight={100}
            baseItemWidth={200}
            itemMargin={10}
            itemRender={(item) => (
              <div
                className={`pump-tile ${
                  item.status === "idle" ? "active" : "disabled"
                }`}
                style={{
                  padding: "15px",
                  borderRadius: "8px",
                  height: "100%",
                  border: "1px solid #ddd",
                  backgroundColor: item.status === "idle" ? "#f8f8f8" : "#eee",
                  opacity: item.status === "idle" ? 1 : 0.6,
                  cursor: item.status === "idle" ? "pointer" : "not-allowed",
                }}
              >
                <h4>{item.name}</h4>
                <p>Type: {item.fuelType}</p>
                <p>
                  Status:{" "}
                  <span
                    style={{
                      color:
                        item.status === "idle"
                          ? "green"
                          : item.status === "busy"
                          ? "orange"
                          : "red",
                    }}
                  >
                    {item.status}
                  </span>
                </p>
              </div>
            )}
            onItemClick={(e) => {
              if (e.itemData.status === "idle") {
                setSelectedPump(e.itemData);
                setStep("nozzle");
              }
            }}
          />
        </div>
      </div>
    );
  };

  const renderNozzleSelection = () => {
    return (
      <div className="dx-card responsive-paddings">
        <h3>Select Nozzle</h3>
        <div className="dx-fieldset">
          <TileView
            items={nozzles}
            baseItemHeight={100}
            baseItemWidth={200}
            itemMargin={10}
            itemRender={(item) => (
              <div
                className="nozzle-tile"
                style={{
                  padding: "15px",
                  borderRadius: "8px",
                  height: "100%",
                  border: "1px solid #ddd",
                  backgroundColor: "#f8f8f8",
                  cursor: "pointer",
                }}
              >
                <h4>{item.name}</h4>
                <p>Status: {item.status}</p>
              </div>
            )}
            onItemClick={(e) => {
              setSelectedNozzle(e.itemData);
              setStep("vehicle");
            }}
          />
        </div>
        <Button
          text="Back"
          type="normal"
          stylingMode="outlined"
          onClick={() => setStep("pump")}
        />
      </div>
    );
  };

  const renderVehicleSelection = () => {
    return (
      <div className="dx-card responsive-paddings">
        <h3>Vehicle Information</h3>
        <div className="dx-fieldset">
          <div className="dx-field">
            <Button
              text="Enter Vehicle Registration"
              width="100%"
              height={60}
              stylingMode="contained"
              type="default"
              onClick={() => setStep("reg")}
              icon="car"
            />
          </div>
          <div className="dx-field">
            <Button
              text="Scan RFID Tag"
              width="100%"
              height={60}
              stylingMode="contained"
              type="default"
              onClick={() => setStep("reg")}
              icon="barcode"
            />
          </div>
        </div>
        <Button
          text="Back"
          type="normal"
          stylingMode="outlined"
          onClick={() => setStep("nozzle")}
        />
      </div>
    );
  };

  const renderVehicleRegistration = () => {
    return (
      <div className="dx-card responsive-paddings">
        <h3>Enter Vehicle Details</h3>
        <div className="dx-fieldset">
          <div className="dx-field">
            <TextBox
              value={vehicleReg}
              onValueChanged={(e) => setVehicleReg(e.value)}
              placeholder="Enter vehicle registration"
            />
          </div>

          <div className="dx-field">
            <div className="dx-field-label">Monthly Limit</div>
            <div className="dx-field-value">
              <ProgressBar
                min={0}
                max={vehicleDetails.monthlyLimit}
                value={vehicleDetails.monthlyUsed}
                showStatus={true}
                statusFormat={(value) =>
                  `${value}/${vehicleDetails.monthlyLimit}L`
                }
              />
            </div>
          </div>

          <div className="dx-field">
            <div className="dx-field-label">Daily Limit</div>
            <div className="dx-field-value">
              <ProgressBar
                min={0}
                max={vehicleDetails.dailyLimit}
                value={vehicleDetails.dailyUsed}
                showStatus={true}
                statusFormat={(value) =>
                  `${value}/${vehicleDetails.dailyLimit}L`
                }
              />
            </div>
          </div>

          <div className="dx-field">
            <div className="dx-field-label">Fueling Limit</div>
            <div className="dx-field-value">
              <span>{vehicleDetails.fuelingLimit}L</span>
            </div>
          </div>

          <div className="dx-field">
            <Button
              text="Start Fueling"
              width="100%"
              type="success"
              stylingMode="contained"
              onClick={startFueling}
              disabled={!vehicleReg.trim()}
            />
          </div>
        </div>
        <Button
          text="Back"
          type="normal"
          stylingMode="outlined"
          onClick={() => setStep("vehicle")}
        />
      </div>
    );
  };

  const renderFuelingProgressPopup = () => {
    return (
      <Popup
        visible={isFueling}
        dragEnabled={false}
        closeOnOutsideClick={false}
        showTitle={true}
        title="Fueling in Progress"
        width={400}
        height={250}
        showCloseButton={false}
      >
        <div className="fueling-progress">
          <div className="progress-indicator">
            <ProgressBar min={0} max={45} value={fuelingAmount} width="100%" />
            <div className="progress-text">
              {fuelingAmount.toFixed(1)}L / 45.0L
            </div>
          </div>
          <p className="progress-message">Fueling in progress...</p>
        </div>
      </Popup>
    );
  };

  const renderFuelingCompletePopup = () => {
    return (
      <Popup
        visible={fuelingComplete}
        dragEnabled={false}
        closeOnOutsideClick={false}
        showTitle={true}
        title="Fueling Complete"
        width={400}
        height={320}
        showCloseButton={false}
      >
        <div className="fueling-complete">
          <div className="receipt-details">
            <div className="receipt-item">
              <span className="label">Amount:</span>
              <span className="value">45.0L</span>
            </div>
            <div className="receipt-item">
              <span className="label">Vehicle:</span>
              <span className="value">{vehicleReg}</span>
            </div>
            <div className="receipt-item">
              <span className="label">Pump:</span>
              <span className="value">{selectedPump?.name}</span>
            </div>
            <div className="receipt-item">
              <span className="label">Time:</span>
              <span className="value">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="action-buttons">
            <Button
              text="Done"
              icon="check"
              type="success"
              stylingMode="contained"
              onClick={completeFueling}
            />
            <Button
              text="Print"
              icon="print"
              type="default"
              stylingMode="contained"
              onClick={() => window.print()}
            />
            <Button
              text="Close"
              icon="close"
              type="normal"
              stylingMode="contained"
              onClick={completeFueling}
            />
          </div>
        </div>
      </Popup>
    );
  };

  const renderNavigationDialog = () => {
    return (
      <Popup
        visible={showNavigationDialog}
        dragEnabled={false}
        closeOnOutsideClick={false}
        showTitle={true}
        title="Fueling in Progress"
        width={400}
        height={200}
        showCloseButton={false}
      >
        <div className="navigation-dialog">
          <p>
            A fueling process is currently in progress. Are you sure you want to
            leave this page?
          </p>
          <div className="action-buttons">
            <Button
              text="Continue Fueling"
              type="default"
              onClick={cancelNavigation}
              stylingMode="contained"
            />
            <Button
              text="Leave Anyway"
              type="danger"
              onClick={confirmNavigation}
              stylingMode="contained"
            />
          </div>
        </div>
      </Popup>
    );
  };

  if (isLoading) {
    return (
      <div
        className="loading-container"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <LoadIndicator width={60} height={60} />
      </div>
    );
  }

  if (!ptsDevice) {
    return (
      <div className="error-container dx-card">
        <h2>PTS Device Not Found</h2>
        <Button
          text="Return to Dashboard"
          onClick={() => navigate("/")}
          type="default"
        />
      </div>
    );
  }

  return (
    <div className="fueling-process-container">
      {/* Header */}
      <div className="dx-card responsive-paddings header-card">
        <div className="header-content">
          <div className="header-left">
            <Button
              icon="arrowleft"
              onClick={() => handleNavigation("/atg")}
              type="normal"
              stylingMode="text"
            />
            <div className="header-info">
              <h2>{ptsDevice.name}</h2>
              <p className="dx-field-description">ID: {ptsDevice.deviceId}</p>
            </div>
          </div>

          {/* Middle header section with action buttons */}
          <div className="header-middle">
            <div className="device-status">
              <p>Last Seen: {ptsDevice.lastSync}</p>
            </div>
            <div className="action-buttons">
              <Button
                icon="clock"
                text="History"
                type="normal"
                stylingMode="outlined"
                onClick={() => handleNavigation("/fueling-history")}
                hint="View Fueling History"
              />
              <Button
                icon="preferences"
                text="Settings"
                type="normal"
                stylingMode="outlined"
                onClick={() => handleNavigation("/pts-settings")}
                hint="PTS Settings"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <ScrollView>
        <div className="main-content">
          {step === "pump" && renderPumpSelection()}
          {step === "nozzle" && renderNozzleSelection()}
          {step === "vehicle" && renderVehicleSelection()}
          {step === "reg" && renderVehicleRegistration()}
        </div>
      </ScrollView>

      {/* Popups */}
      {renderFuelingProgressPopup()}
      {renderFuelingCompletePopup()}
      {renderNavigationDialog()}
    </div>
  );
};

export default FuelingProcess;
