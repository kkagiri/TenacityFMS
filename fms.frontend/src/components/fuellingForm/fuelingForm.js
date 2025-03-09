import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchPumps, fetchPumpStatus } from "../../redux/actions/pumpActions";
import { fetchTags } from "../../redux/actions/tagActions";
import { fetchFuelTypes } from "../../redux/actions/fuelTypeActions";
import { SelectBox } from "devextreme-react/select-box";
import { fetchPTSDeviceList } from "../../redux/actions/ptsDeviceActions";
import { GasPump, Droplet, Car, Scan, Info } from "lucide-react";
import { SignalRService } from "../../signalR/SignalRService";
import "./fuelingform.scss";

const FuelingForm = () => {
  const dispatch = useDispatch();
  const pumps = useSelector((state) => state.pumps);
  const tags = useSelector((state) => state.tags);
  //const fuelTypes = useSelector((state) => state.fuelTypes);
  const PTSDevice = useSelector((state) => state.PTSDevice);
  const { ptsDeviceList, onlineDevices } = useSelector(
    (state) => state.ptsDevice
  );

  // Local state for multi-step process
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedPump, setSelectedPump] = useState(null);
  const [selectedNozzle, setSelectedNozzle] = useState(null);
  const [vehicleOption, setVehicleOption] = useState(null);
  const [showVehicleDetails, setShowVehicleDetails] = useState(false);
  const [liters, setLiters] = useState("");
  const [fuelingInProgress, setFuelingInProgress] = useState(false);
  // New state for tank selection
  const [selectedTank, setSelectedTank] = useState(null);

  // Sample data for devices and nozzles
  const sampleDevices = [
    { id: "device1", label: "PTSID 12345678 : Main Site : Tank 1 : Idle" },
    { id: "device2", label: "PTSID 87654321 : Secondary Site : Tank 2 : Busy" },
    { id: "device3", label: "PTSID 11223344 : Test Site : Tank 3 : Idle" },
    { id: "device4", label: "PTSID 44332211 : Backup Site : Tank 4 : Idle" },
  ];

  const sampleNozzles = [
    { id: "nozzle1", name: "Nozzle 1", status: "Idle" },
    { id: "nozzle2", name: "Nozzle 2", status: "Busy" },
  ];

  useEffect(() => {
    // Dispatch initial data loads
    dispatch(fetchPumps());
    dispatch(fetchTags());
    dispatch(fetchFuelTypes());
    dispatch(fetchPTSDeviceList());
    SignalRService.startConnection();

    //if component unmounts stop the signalR connection
    return () => {
      SignalRService.stopConnection();
    };
  }, [dispatch]);

  //map the fetch device list to device options for the select box
  const deviceOptions = ptsDeviceList
    ? ptsDeviceList.map((device) => {
        // Determine online status by matching device id (assuming device.Ptsid is unique)
        const onlineDevice = onlineDevices?.find(
          (d) => d.DeviceId === device.Ptsid.toString()
        );
        // Use the online device's status if available; default to 'Offline'
        const statusLabel = onlineDevice
          ? onlineDevice.Status || "Idle"
          : "Offline";
        return {
          id: device.Ptsid, // Use the device's PTS ID as a unique identifier
          label: `PTSID ${device.Ptsid} : ${
            device.SiteNavigation?.Name || "Unknown Site"
          }  : ${statusLabel}`,
        };
      })
    : [];

  // Handlers
  const handleDeviceSelect = (e) => {
    setSelectedDevice(e.value);
    // Reset downstream selections
    setSelectedTank(null); // reset tank selection
    setSelectedPump(null);
    setSelectedNozzle(null);
    setVehicleOption(null);
  };

  const handlePumpSelect = (pump) => {
    setSelectedPump(pump);
    // Reset downstream selections
    setSelectedNozzle(null);
    setVehicleOption(null);
  };

  const handleNozzleSelect = (nozzle) => {
    setSelectedNozzle(nozzle);
    setVehicleOption(null);
  };

  const handleVehicleOptionSelect = (option) => {
    setVehicleOption(option);
  };

  const toggleVehicleDetails = () => {
    setShowVehicleDetails(!showVehicleDetails);
  };

  const handleLitersChange = (e) => {
    setLiters(e.target.value);
  };

  const handleTankSelect = (tank) => {
    setSelectedTank(tank);
    // Reset downstream selections
    setSelectedPump(null);
    setSelectedNozzle(null);
    setVehicleOption(null);
  };

  const selectedPTSDevice = ptsDeviceList?.find(
    (device) => device.Ptsid.toString() === selectedDevice?.toString()
  );
  const tankList = selectedPTSDevice?.tankList || [];

  return (
    <div className="fueling-form">
      {/* Step 1: Device Selection */}
      <div className="step step-device-selection">
        <h3>Step 1: Device Selection</h3>
        <SelectBox
          dataSource={deviceOptions}
          displayExpr="label"
          valueExpr="id"
          value={selectedDevice}
          onValueChanged={handleDeviceSelect}
          disabled={fuelingInProgress}
          placeholder="Select a device..."
        />
      </div>

      {/* Step 2: Tank Selection */}
      {selectedDevice && tankList.length > 0 && (
        <div className="step step-tank-selection">
          <h3>Step 2: Tank Selection</h3>
          <div className="card-grid">
            {tankList.map((tank) => (
              <div
                key={tank.id}
                className={`card tank-card ${
                  selectedTank?.id === tank.id ? "selected" : ""
                }`}
                onClick={() => handleTankSelect(tank)}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  padding: "10px",
                  margin: "5px",
                  cursor: "pointer",
                  width: "45%",
                }}
              >
                <div style={{ fontWeight: "bold" }}>{tank.name}</div>
                {tank.capacity && (
                  <div>
                    <strong>Capacity:</strong> {tank.capacity} L
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Pump Selection */}
      {selectedDevice && (tankList.length === 0 || selectedTank) && (
        <div className="step step-pump-selection">
          <h3>Step 3: Pump Selection</h3>
          <div className="card-grid">
            {pumps && pumps.length > 0 ? (
              pumps.map((pump) => (
                <div
                  key={pump.id}
                  className={`card pump-card ${
                    selectedPump?.id === pump.id ? "selected" : ""
                  }`}
                  onClick={() => handlePumpSelect(pump)}
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    padding: "10px",
                    margin: "5px",
                    cursor: "pointer",
                    width: "45%",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <GasPump size={24} />
                    <span style={{ marginLeft: "8px" }}>
                      {pump.name || "Pump Name"}
                    </span>
                  </div>
                  <div>
                    <strong>Fuel Type:</strong> {pump.fuelType || "N/A"}
                  </div>
                  <div>
                    <strong>Status:</strong>
                    <span
                      style={{
                        color: pump.status === "Idle" ? "green" : "red",
                        marginLeft: "4px",
                      }}
                    >
                      {pump.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div>No pumps available</div>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Nozzle Selection */}
      {selectedPump && (
        <div className="step step-nozzle-selection">
          <h3>Step 4: Nozzle Selection</h3>
          <div className="card-grid">
            {sampleNozzles.map((nozzle) => (
              <div
                key={nozzle.id}
                className={`card nozzle-card ${
                  selectedNozzle?.id === nozzle.id ? "selected" : ""
                }`}
                onClick={() => handleNozzleSelect(nozzle)}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  padding: "10px",
                  margin: "5px",
                  cursor: "pointer",
                  width: "45%",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <Droplet size={24} />
                  <span style={{ marginLeft: "8px" }}>{nozzle.name}</span>
                </div>
                <div>
                  <strong>Status:</strong>
                  <span
                    style={{
                      color: nozzle.status === "Idle" ? "green" : "red",
                      marginLeft: "4px",
                    }}
                  >
                    {nozzle.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 5: Vehicle/Tag Information */}
      {selectedNozzle && (
        <div className="step step-vehicle-info">
          <h3>Step 5: Vehicle/Tag Information</h3>
          <div className="card-grid">
            <div
              className={`card vehicle-option ${
                vehicleOption === "enter" ? "selected" : ""
              }`}
              onClick={() => handleVehicleOptionSelect("enter")}
              style={{
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "10px",
                margin: "5px",
                cursor: "pointer",
                width: "45%",
              }}
            >
              <Car size={24} />
              <span style={{ marginLeft: "8px" }}>Enter Vehicle</span>
            </div>
            <div
              className={`card vehicle-option ${
                vehicleOption === "scan" ? "selected" : ""
              }`}
              onClick={() => handleVehicleOptionSelect("scan")}
              style={{
                border: "1px solid #ccc",
                borderRadius: "4px",
                padding: "10px",
                margin: "5px",
                cursor: "pointer",
                width: "45%",
              }}
            >
              <Scan size={24} />
              <span style={{ marginLeft: "8px" }}>Scan RFID</span>
            </div>
          </div>

          {vehicleOption && (
            <div
              className="vehicle-details"
              style={{
                marginTop: "10px",
                border: "1px solid #ddd",
                padding: "10px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h4>Vehicle/Tag Details</h4>
                <button
                  onClick={toggleVehicleDetails}
                  style={{
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                  }}
                >
                  <Info size={20} />
                </button>
              </div>
              {showVehicleDetails && (
                <div>
                  <p>
                    <strong>Daily Limit:</strong> 100 liters
                  </p>
                  <p>
                    <strong>Daily Usage:</strong> 50 liters
                  </p>
                  <p>
                    <strong>Monthly Limit:</strong> 2000 liters
                  </p>
                  <p>
                    <strong>Monthly Usage:</strong> 1200 liters
                  </p>
                  <p>
                    <strong>Fueling Limit:</strong> 60 liters
                  </p>
                  <p>
                    <strong>Current Tank Level:</strong> 500 liters
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 6: Amount Input */}
      {vehicleOption && (
        <div className="step step-amount-input">
          <h3>Step 6: Amount Input</h3>
          <div style={{ display: "flex", alignItems: "center" }}>
            <Droplet size={24} />
            <input
              type="number"
              placeholder="Enter liters"
              value={liters}
              onChange={handleLitersChange}
              disabled={fuelingInProgress}
              style={{ marginLeft: "8px" }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FuelingForm;
