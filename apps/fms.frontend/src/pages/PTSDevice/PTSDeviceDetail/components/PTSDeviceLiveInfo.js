import React from "react";
import "./PTSDeviceLiveInfo.scss";

/* ════════════════════════════════════════════════════════════════════════
 *  Helper: case-insensitive property access (handles PascalCase / camelCase)
 * ════════════════════════════════════════════════════════════════════════ */
const ci = (obj, key) => {
  if (!obj) return undefined;
  if (obj[key] !== undefined) return obj[key];
  // Try first-char case swap
  const alt = key.charAt(0) === key.charAt(0).toUpperCase()
    ? key.charAt(0).toLowerCase() + key.slice(1)
    : key.charAt(0).toUpperCase() + key.slice(1);
  return obj[alt];
};

/* ════════════════════════════════════════════════════════════════════════
 *  Status badge helper
 * ════════════════════════════════════════════════════════════════════════ */
const StatusBadge = ({ status, small }) => {
  const map = {
    idle: { cls: "success", icon: "fa-light fa-circle-pause", label: "Idle" },
    filling: { cls: "warning", icon: "fa-light fa-gas-pump", label: "Filling" },
    endoftransaction: { cls: "info", icon: "fa-light fa-circle-check", label: "Completed" },
    offline: { cls: "error", icon: "fa-light fa-circle-xmark", label: "Offline" },
    online: { cls: "success", icon: "fa-light fa-signal", label: "Online" },
    absent: { cls: "warning", icon: "fa-light fa-circle-minus", label: "Absent" },
  };
  const key = (status || "").toLowerCase();
  const m = map[key] || { cls: "warning", icon: "fa-light fa-question", label: status || "Unknown" };
  return (
    <span className={`status-badge ${m.cls} ${small ? "tw-text-xs tw-px-1.5 tw-py-0.5" : ""}`}>
      <i className={`${m.icon} tw-mr-1`}></i>{m.label}
    </span>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 *  PUMP STATUS SECTION
 *  Renders Idle / Filling / EndOfTransaction / Offline pump cards
 * ════════════════════════════════════════════════════════════════════════ */
const PumpStatusSection = ({ pumps }) => {
  if (!pumps) return null;

  const idle = ci(pumps, "IdleStatus") || ci(pumps, "idleStatus") || {};
  const filling = ci(pumps, "FillingStatus") || ci(pumps, "fillingStatus") || {};
  const eot = ci(pumps, "EndOfTransactionStatus") || ci(pumps, "endOfTransactionStatus") || {};
  const offline = ci(pumps, "OfflineStatus") || ci(pumps, "offlineStatus") || {};
  const users = ci(pumps, "Users") || ci(pumps, "users") || [];

  // Build per-pump objects
  const pumpMap = {};

  const addPumps = (statusObj, statusType) => {
    const ids = ci(statusObj, "Ids") || [];
    ids.forEach((id, i) => {
      pumpMap[id] = { id, status: statusType, idx: i, raw: statusObj };
    });
  };

  addPumps(idle, "idle");
  addPumps(filling, "filling");
  addPumps(eot, "endoftransaction");
  addPumps(offline, "offline");

  const pumpList = Object.values(pumpMap).sort((a, b) => a.id - b.id);
  if (pumpList.length === 0) return null;

  return (
    <div className="tw-mt-6">
      <h4 className="tw-text-lg tw-font-semibold tw-mb-4">
        <i className="fa-light fa-gas-pump tw-mr-2"></i>Pump Status
      </h4>
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4">
        {pumpList.map((p) => (
          <PumpCard key={p.id} pump={p} users={users} />
        ))}
      </div>
    </div>
  );
};

/* ── Individual Pump Card ── */
const PumpCard = ({ pump, users }) => {
  const { id, status, idx, raw } = pump;
  const user = users[id - 1] || "";

  return (
    <div className="info-card">
      <div className="card-header tw-flex tw-items-center tw-justify-between">
        <div className="tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-gas-pump"></i>
          <h4>Pump {id}</h4>
        </div>
        <StatusBadge status={status} small />
      </div>
      <div className="card-body">
        {user && (
          <div className="info-row">
            <label>User</label>
            <span className="value">{user}</span>
          </div>
        )}

        {status === "idle" && <PumpIdleDetails raw={raw} idx={idx} />}
        {status === "filling" && <PumpFillingDetails raw={raw} idx={idx} />}
        {status === "endoftransaction" && <PumpEotDetails raw={raw} idx={idx} />}
        {status === "offline" && (
          <div className="tw-text-center tw-py-2">
            <span className="tw-text-sm tw-text-gray-500">Device is offline</span>
          </div>
        )}
      </div>
    </div>
  );
};

const PumpIdleDetails = ({ raw, idx }) => {
  const nozzlesUp = (ci(raw, "NozzlesUp") || [])[idx];
  const lastNozzle = (ci(raw, "LastNozzles") || [])[idx];
  const lastTxn = (ci(raw, "LastTransactions") || [])[idx];
  const lastVol = (ci(raw, "LastVolumes") || [])[idx];
  const lastAmt = (ci(raw, "LastAmounts") || [])[idx];
  const lastPrice = (ci(raw, "LastPrices") || [])[idx];
  const request = (ci(raw, "Requests") || [])[idx];

  return (
    <>
      {nozzlesUp != null && (
        <div className="info-row"><label>Nozzle Up</label><span className="value">{nozzlesUp || "None"}</span></div>
      )}
      {lastNozzle != null && (
        <div className="info-row"><label>Last Nozzle</label><span className="value">{lastNozzle || "–"}</span></div>
      )}
      {lastTxn != null && (
        <div className="info-row"><label>Last Transaction</label><span className="value">{lastTxn || "–"}</span></div>
      )}
      {lastVol != null && (
        <div className="info-row"><label>Last Volume</label><span className="value">{Number(lastVol).toFixed(2)} L</span></div>
      )}
      {lastAmt != null && (
        <div className="info-row"><label>Last Amount</label><span className="value">{Number(lastAmt).toFixed(2)}</span></div>
      )}
      {lastPrice != null && (
        <div className="info-row"><label>Last Price</label><span className="value">{Number(lastPrice).toFixed(2)}</span></div>
      )}
      {request && (
        <div className="info-row"><label>Request</label><span className="value">{request}</span></div>
      )}
    </>
  );
};

const PumpFillingDetails = ({ raw, idx }) => {
  const nozzle = (ci(raw, "Nozzles") || [])[idx];
  const txn = (ci(raw, "Transactions") || [])[idx];
  const vol = (ci(raw, "Volumes") || [])[idx];
  const amt = (ci(raw, "Amounts") || [])[idx];
  const price = (ci(raw, "Prices") || [])[idx];
  const fuelGradeId = (ci(raw, "FuelGradeIds") || [])[idx];
  const fuelName = (ci(raw, "Names") || [])[idx];

  return (
    <>
      {nozzle != null && (
        <div className="info-row"><label>Nozzle</label><span className="value">{nozzle}</span></div>
      )}
      {fuelGradeId != null && (
        <div className="info-row"><label>Fuel Grade</label><span className="value">{fuelName ? `${fuelName} (#${fuelGradeId})` : `#${fuelGradeId}`}</span></div>
      )}
      {txn != null && (
        <div className="info-row"><label>Transaction</label><span className="value tw-font-mono">{txn}</span></div>
      )}
      {vol != null && (
        <div className="info-row">
          <label>Volume</label>
          <span className="value tw-text-green-600 tw-font-semibold">{Number(vol).toFixed(2)} L</span>
        </div>
      )}
      {amt != null && (
        <div className="info-row">
          <label>Amount</label>
          <span className="value tw-text-blue-600 tw-font-semibold">{Number(amt).toFixed(2)}</span>
        </div>
      )}
      {price != null && (
        <div className="info-row"><label>Price / Unit</label><span className="value">{Number(price).toFixed(2)}</span></div>
      )}
    </>
  );
};

const PumpEotDetails = ({ raw, idx }) => (
  /* EndOfTransaction has same shape as Filling */
  <PumpFillingDetails raw={raw} idx={idx} />
);

/* ════════════════════════════════════════════════════════════════════════
 *  PROBE / TANK STATUS SECTION
 *  Parses Probes → OnlineStatus.Measurements and OfflineStatus
 * ════════════════════════════════════════════════════════════════════════ */
const ProbeStatusSection = ({ probes }) => {
  if (!probes) return null;

  const onlineStatus = ci(probes, "OnlineStatus") || ci(probes, "onlineStatus") || {};
  const offlineStatus = ci(probes, "OfflineStatus") || ci(probes, "offlineStatus") || {};
  const onlineIds = ci(onlineStatus, "Ids") || [];
  const offlineIds = ci(offlineStatus, "Ids") || [];
  const errors = ci(onlineStatus, "Errors") || [];
  const measurements = ci(onlineStatus, "Measurements") || [];

  // Alarm arrays
  const critHighProduct = ci(onlineStatus, "CriticalHighProductAlarms") || [];
  const highProduct = ci(onlineStatus, "HighProductAlarms") || [];
  const lowProduct = ci(onlineStatus, "LowProductAlarms") || [];
  const critLowProduct = ci(onlineStatus, "CriticalLowProductAlarms") || [];
  const highWater = ci(onlineStatus, "HighWaterAlarms") || [];
  const tankLeakage = ci(onlineStatus, "TankLeakageAlarms") || [];

  if (onlineIds.length === 0 && offlineIds.length === 0) return null;

  /* Measurement array layout per sample:
     [0]=ProbeId, [1]=ProductHeight, [2]=WaterHeight, [3]=Temperature,
     [4]=Volume(gross), [5]=WaterVolume, [6]=Ullage, [7]=Volume(net),
     [8]=Density, [9]=TotalCapacity  */

  return (
    <div className="tw-mt-6">
      <h4 className="tw-text-lg tw-font-semibold tw-mb-4">
        <i className="fa-light fa-gauge-max tw-mr-2"></i>Probe / Tank Status
      </h4>
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
        {measurements.map((m, i) => {
          const probeId = m[0];
          const hasError = errors.includes(probeId);
          const alarms = [];
          if (critHighProduct.includes(probeId)) alarms.push("Critical High Product");
          if (highProduct.includes(probeId)) alarms.push("High Product");
          if (lowProduct.includes(probeId)) alarms.push("Low Product");
          if (critLowProduct.includes(probeId)) alarms.push("Critical Low Product");
          if (highWater.includes(probeId)) alarms.push("High Water");
          if (tankLeakage.includes(probeId)) alarms.push("Tank Leakage");

          return (
            <div key={probeId || i} className="info-card">
              <div className="card-header tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex tw-items-center tw-gap-2">
                  <i className="fa-light fa-gauge-max"></i>
                  <h4>Probe {probeId}</h4>
                </div>
                <StatusBadge status={hasError ? "offline" : "online"} small />
              </div>
              <div className="card-body">
                <div className="info-row"><label>Product Height</label><span className="value">{m[1] != null ? `${m[1]} mm` : "–"}</span></div>
                <div className="info-row"><label>Water Height</label><span className="value">{m[2] != null ? `${m[2]} mm` : "–"}</span></div>
                <div className="info-row"><label>Temperature</label><span className="value">{m[3] != null ? `${m[3]}°C` : "–"}</span></div>
                <div className="info-row"><label>Gross Volume</label><span className="value">{m[4] != null ? `${Number(m[4]).toLocaleString()} L` : "–"}</span></div>
                <div className="info-row"><label>Water Volume</label><span className="value">{m[5] != null ? `${m[5]} L` : "–"}</span></div>
                <div className="info-row"><label>Ullage</label><span className="value">{m[6] != null ? `${Number(m[6]).toLocaleString()} L` : "–"}</span></div>
                <div className="info-row"><label>Net Volume</label><span className="value">{m[7] != null ? `${Number(m[7]).toLocaleString()} L` : "–"}</span></div>
                <div className="info-row"><label>Density</label><span className="value">{m[8] != null ? `${m[8]} kg/m³` : "–"}</span></div>
                <div className="info-row"><label>Total Capacity</label><span className="value">{m[9] != null ? `${Number(m[9]).toLocaleString()} L` : "–"}</span></div>
                {alarms.length > 0 && (
                  <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-1">
                    {alarms.map((a) => (
                      <span key={a} className="status-badge error tw-text-xs tw-px-1.5 tw-py-0.5">
                        <i className="fa-light fa-triangle-exclamation tw-mr-1"></i>{a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {offlineIds.map((id) => (
          <div key={`off-${id}`} className="info-card">
            <div className="card-header tw-flex tw-items-center tw-justify-between">
              <div className="tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-gauge-max"></i>
                <h4>Probe {id}</h4>
              </div>
              <StatusBadge status="offline" small />
            </div>
            <div className="card-body">
              <div className="tw-text-center tw-py-2 tw-text-sm tw-text-gray-500">Probe offline</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 *  FUEL GRADES SECTION
 * ════════════════════════════════════════════════════════════════════════ */
const FuelGradesSection = ({ fuelGrades }) => {
  if (!fuelGrades || !Array.isArray(fuelGrades) || fuelGrades.length === 0) return null;

  return (
    <div className="tw-mt-6">
      <h4 className="tw-text-lg tw-font-semibold tw-mb-4">
        <i className="fa-light fa-droplet tw-mr-2"></i>Fuel Grades
      </h4>
      <div className="info-card">
        <div className="card-body tw-p-0">
          <table className="tw-w-full tw-text-sm">
            <thead>
              <tr className="tw-border-b tw-text-left">
                <th className="tw-px-4 tw-py-2 tw-font-medium">ID</th>
                <th className="tw-px-4 tw-py-2 tw-font-medium">Name</th>
                <th className="tw-px-4 tw-py-2 tw-font-medium tw-text-right">Price</th>
                <th className="tw-px-4 tw-py-2 tw-font-medium tw-text-right">Expansion Coeff.</th>
              </tr>
            </thead>
            <tbody>
              {fuelGrades.map((fg, i) => (
                <tr key={ci(fg, "Id") || i} className="tw-border-b last:tw-border-0">
                  <td className="tw-px-4 tw-py-2">{ci(fg, "Id") ?? "–"}</td>
                  <td className="tw-px-4 tw-py-2 tw-font-medium">{ci(fg, "Name") || "–"}</td>
                  <td className="tw-px-4 tw-py-2 tw-text-right">{ci(fg, "Price") != null ? Number(ci(fg, "Price")).toFixed(2) : "–"}</td>
                  <td className="tw-px-4 tw-py-2 tw-text-right">{ci(fg, "ExpansionCoefficient") != null ? ci(fg, "ExpansionCoefficient") : "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 *  READERS SECTION
 * ════════════════════════════════════════════════════════════════════════ */
const ReadersSection = ({ readers }) => {
  if (!readers) return null;

  const onlineStatus = ci(readers, "OnlineStatus") || {};
  const offlineStatus = ci(readers, "OfflineStatus") || {};
  const onlineIds = ci(onlineStatus, "Ids") || [];
  const offlineIds = ci(offlineStatus, "Ids") || [];
  const offlineTags = ci(offlineStatus, "Tags") || [];

  if (onlineIds.length === 0 && offlineIds.length === 0) return null;

  return (
    <div className="tw-mt-6">
      <h4 className="tw-text-lg tw-font-semibold tw-mb-4">
        <i className="fa-light fa-id-card tw-mr-2"></i>Readers
      </h4>
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
        {onlineIds.map((id) => (
          <div key={`on-${id}`} className="info-card">
            <div className="card-header tw-flex tw-items-center tw-justify-between">
              <div className="tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-id-card"></i>
                <h4>Reader {id}</h4>
              </div>
              <StatusBadge status="online" small />
            </div>
            <div className="card-body">
              <div className="tw-text-center tw-py-1 tw-text-sm tw-text-green-600">Connected</div>
            </div>
          </div>
        ))}
        {offlineIds.map((id, i) => {
          const tag = offlineTags[i] || "";
          return (
            <div key={`off-${id}`} className="info-card">
              <div className="card-header tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex tw-items-center tw-gap-2">
                  <i className="fa-light fa-id-card"></i>
                  <h4>Reader {id}</h4>
                </div>
                <StatusBadge status="offline" small />
              </div>
              <div className="card-body">
                {tag ? (
                  <div className="info-row">
                    <label>Last Tag</label>
                    <span className="value tw-font-mono tw-text-xs">{tag}</span>
                  </div>
                ) : (
                  <div className="tw-text-center tw-py-1 tw-text-sm tw-text-gray-500">No tag</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 *  GPS SECTION
 * ════════════════════════════════════════════════════════════════════════ */
const GpsSection = ({ gps }) => {
  if (!gps) return null;
  const status = ci(gps, "Status") || "Unknown";

  return (
    <div className="tw-mt-6">
      <h4 className="tw-text-lg tw-font-semibold tw-mb-4">
        <i className="fa-light fa-location-dot tw-mr-2"></i>GPS
      </h4>
      <div className="info-card" style={{ maxWidth: 320 }}>
        <div className="card-body">
          <div className="info-row">
            <label>Status</label>
            <StatusBadge status={status.toLowerCase() === "absent" ? "absent" : "online"} />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════
 *  PRICE BOARDS SECTION
 * ════════════════════════════════════════════════════════════════════════ */
const PriceBoardsSection = ({ priceBoards }) => {
  if (!priceBoards) return null;

  const onlineStatus = ci(priceBoards, "OnlineStatus") || {};
  const offlineStatus = ci(priceBoards, "OfflineStatus") || {};
  const onlineIds = ci(onlineStatus, "Ids") || [];
  const offlineIds = ci(offlineStatus, "Ids") || [];

  if (onlineIds.length === 0 && offlineIds.length === 0) return null;

  return (
    <div className="tw-mt-6">
      <h4 className="tw-text-lg tw-font-semibold tw-mb-4">
        <i className="fa-light fa-display tw-mr-2"></i>Price Boards
      </h4>
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
        {onlineIds.map((id) => (
          <div key={`on-${id}`} className="info-card">
            <div className="card-header tw-flex tw-items-center tw-justify-between">
              <div className="tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-display"></i>
                <h4>Board {id}</h4>
              </div>
              <StatusBadge status="online" small />
            </div>
          </div>
        ))}
        {offlineIds.map((id) => (
          <div key={`off-${id}`} className="info-card">
            <div className="card-header tw-flex tw-items-center tw-justify-between">
              <div className="tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-display"></i>
                <h4>Board {id}</h4>
              </div>
              <StatusBadge status="offline" small />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * PTSDeviceLiveInfo - Displays live information from WebSocket connection
 * Shows real-time data like battery, CPU temp, tank levels, pump status, etc.
 */
const PTSDeviceLiveInfo = ({ device, liveData, isConnected }) => {
  // Merge base device data with UploadStatusUpdate.status payload (SignalR)
  const liveStatus = liveData?.status || liveData?.Status || null;
  const displayData = {
    ...(device || {}),
    ...(liveData || {}),
    ...(liveStatus || {}),
  };

  const batteryVoltageRaw = displayData?.batteryVoltage;
  const batteryVoltageVolts =
    typeof batteryVoltageRaw === "number"
      ? batteryVoltageRaw > 100
        ? batteryVoltageRaw / 1000
        : batteryVoltageRaw
      : null;

  const formatStartupTime = (seconds) => {
    if (seconds == null) return "N/A";
    const totalSeconds = Number(seconds);
    if (Number.isNaN(totalSeconds)) return "N/A";

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  if (!isConnected) {
    return (
      <div className="pts-device-live-info">
        <div className="tw-text-center tw-py-12">
          <span><i className="fa-light fa-circle-exclamation tw-text-6xl tw-text-gray-400 tw-mb-4"></i></span>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-600 tw-mb-2">
            Device Not Connected
          </h3>
          <p className="tw-text-sm tw-text-gray-500">
            This device is not connected via WebSocket. Live data is not available.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pts-device-live-info">
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-6">
        {/* System Status Card */}
        <div className="info-card">
          <div className="card-header">
            <span><i className="fa-light fa-server"></i></span>
            <h4>System Status</h4>
          </div>
          <div className="card-body">
            <div className="info-row">
              <label>Battery Voltage</label>
              <span className={`value ${(batteryVoltageVolts || 0) < 11 ? "tw-text-red-600" : "tw-text-green-600"
                }`}>
                {batteryVoltageVolts != null ? `${batteryVoltageVolts.toFixed(2)}V` : "N/A"}
              </span>
            </div>
            <div className="info-row">
              <label>CPU Temperature</label>
              <span className={`value ${(displayData.cpuTemperature || 0) > 50 ? "tw-text-red-600" : "tw-text-green-600"
                }`}>
                {displayData.cpuTemperature != null ? `${displayData.cpuTemperature}°C` : "N/A"}
              </span>
            </div>
            <div className="info-row">
              <label>SD Card</label>
              {displayData.sdMounted == null ? (
                <span className="status-badge warning">N/A</span>
              ) : (
                <span className={`status-badge ${displayData.sdMounted ? "success" : "error"}`}>
                  {displayData.sdMounted ? "Mounted" : "Not Mounted"}
                </span>
              )}
            </div>
            <div className="info-row">
              <label>Power Status</label>
              {displayData.ptsPowerDownDetected == null ? (
                <span className="status-badge warning">N/A</span>
              ) : (
                <span className={`status-badge ${displayData.ptsPowerDownDetected ? "error" : "success"
                  }`}>
                  {displayData.ptsPowerDownDetected ? "Power Down Detected" : "Normal"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Connection Info Card */}
        <div className="info-card">
          <div className="card-header">
            <span><i className="fa-light fa-signal-stream"></i></span>
            <h4>Connection Info</h4>
          </div>
          <div className="card-body">
            <div className="info-row">
              <label>Connection Type</label>
              <span className="value">
                {displayData.connectionType || displayData.ConnectionType
                  ? (displayData.connectionType || displayData.ConnectionType)
                  : displayData.webSocketCapable == null
                    ? "N/A"
                    : displayData.webSocketCapable
                      ? "WebSocket"
                      : "HTTP"}
              </span>
            </div>
            <div className="info-row">
              <label>Last Activity</label>
              <span className="value tw-text-sm">
                {displayData.dateTime
                  ? new Date(displayData.dateTime).toLocaleString()
                  : displayData.lastActivity
                    ? new Date(displayData.lastActivity).toLocaleString()
                    : liveData?.receivedAt
                      ? new Date(liveData.receivedAt).toLocaleString()
                      : "N/A"}
              </span>
            </div>
            <div className="info-row">
              <label>Configuration ID</label>
              <span className="value tw-text-sm">{displayData.configurationId || "N/A"}</span>
            </div>
            <div className="info-row">
              <label>Firmware Date</label>
              <span className="value tw-text-sm">
                {displayData.firmwareDateTime
                  ? new Date(displayData.firmwareDateTime).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
            <div className="info-row">
              <label>Startup Time</label>
              <span className="value tw-text-sm">{formatStartupTime(displayData.startupSeconds)}</span>
            </div>
          </div>
        </div>

        {/* Live Updates Indicator */}
        <div className="info-card">
          <div className="card-header">
            <span><i className="fa-light fa-rss"></i></span>
            <h4>Live Updates</h4>
          </div>
          <div className="card-body">
            <div className="tw-text-center tw-py-4">
              <div className="live-indicator">
                <span className="pulse-dot"></span>
                <span className="tw-ml-2 tw-text-sm">Receiving Live Data</span>
              </div>
              {liveData && (
                <p className="tw-text-xs tw-text-gray-500 tw-mt-4">
                  Last update: {liveData.receivedAt || displayData.dateTime
                    ? new Date(liveData.receivedAt || displayData.dateTime).toLocaleTimeString()
                    : "N/A"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Pump Status Section ─── */}
      <PumpStatusSection pumps={displayData.pumps || displayData.Pumps} />

      {/* ─── Probe / Tank Status Section ─── */}
      <ProbeStatusSection probes={displayData.probes || displayData.Probes} />

      {/* ─── Fuel Grades Section ─── */}
      <FuelGradesSection fuelGrades={displayData.fuelGrades || displayData.FuelGrades} />

      {/* ─── Readers Section ─── */}
      <ReadersSection readers={displayData.readers || displayData.Readers} />

      {/* ─── GPS Status ─── */}
      <GpsSection gps={displayData.gps || displayData.Gps} />

      {/* ─── Price Boards Section ─── */}
      <PriceBoardsSection priceBoards={displayData.priceBoards || displayData.PriceBoards} />
    </div>
  );
};

export default PTSDeviceLiveInfo;
