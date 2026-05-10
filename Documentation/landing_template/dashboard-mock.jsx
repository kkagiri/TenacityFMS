/* global React, Icon */
// A real-feeling fleet ops dashboard mock for the hero — pure CSS/SVG.

function Sparkline({
  data,
  color = "var(--primary)",
  width = 80,
  height = 24,
}) {
  const max = Math.max(...data),
    min = Math.min(...data);
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / (max - min || 1)) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MapMock() {
  // Fake map: roads + truck pins + geofence
  return (
    <svg
      viewBox="0 0 400 260"
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        borderRadius: "var(--r-3)",
      }}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path
            d="M 20 0 L 0 0 0 20"
            fill="none"
            stroke="#E6ECF2"
            strokeWidth="0.5"
          />
        </pattern>
        <radialGradient id="bg" cx="60%" cy="40%" r="80%">
          <stop offset="0%" stopColor="#F4F8FC" />
          <stop offset="100%" stopColor="#EAEFF5" />
        </radialGradient>
      </defs>
      <rect width="400" height="260" fill="url(#bg)" />
      <rect width="400" height="260" fill="url(#grid)" />
      {/* roads */}
      <path
        d="M0 180 C 80 170, 160 200, 240 160 S 360 100, 400 110"
        stroke="#D4DDE7"
        strokeWidth="14"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M0 180 C 80 170, 160 200, 240 160 S 360 100, 400 110"
        stroke="#FFFFFF"
        strokeWidth="2"
        fill="none"
        strokeDasharray="4 6"
        strokeLinecap="round"
      />
      <path
        d="M70 0 C 90 60, 50 120, 100 180 S 140 260, 130 260"
        stroke="#D4DDE7"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M70 0 C 90 60, 50 120, 100 180 S 140 260, 130 260"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        fill="none"
        strokeDasharray="3 5"
      />
      <path
        d="M260 0 C 240 50, 280 90, 270 130 S 320 240, 360 260"
        stroke="#D4DDE7"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />
      {/* geofence */}
      <path
        d="M195 50 C 250 40, 305 70, 305 120 C 305 160, 240 175, 200 165 C 165 155, 160 90, 195 50 Z"
        fill="rgba(0,120,212,0.08)"
        stroke="var(--primary)"
        strokeWidth="1.2"
        strokeDasharray="3 4"
      />
      <text
        x="220"
        y="100"
        fill="var(--primary-pressed)"
        fontSize="9"
        fontWeight="600"
      >
        DEPOT · WEST
      </text>
      {/* truck pins */}
      <Pin x={92} y={170} label="T-04" />
      <Pin x={245} y={155} label="T-09" active />
      <Pin x={310} y={120} label="T-12" />
      <Pin x={130} y={70} label="T-21" idle />
      {/* compass */}
      <g transform="translate(355,30)">
        <circle r="14" fill="#fff" stroke="var(--border)" />
        <path d="M0 -8 L 3 0 L 0 8 L -3 0 Z" fill="var(--text-2)" />
        <text
          y="3"
          textAnchor="middle"
          fontSize="7"
          fontWeight="600"
          fill="var(--text)"
        >
          N
        </text>
      </g>
    </svg>
  );
}
function Pin({ x, y, label, active, idle }) {
  const color = idle
    ? "var(--text-3)"
    : active
      ? "var(--primary)"
      : "var(--success)";
  return (
    <g transform={`translate(${x},${y})`}>
      {active && (
        <circle r="14" fill="var(--primary)" opacity="0.18">
          <animate
            attributeName="r"
            values="10;18;10"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.25;0;0.25"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}
      <circle r="9" fill="#fff" stroke={color} strokeWidth="1.5" />
      <circle r="3.5" fill={color} />
      <rect
        x="10"
        y="-7"
        width="26"
        height="14"
        rx="3"
        fill="#fff"
        stroke="var(--border)"
      />
      <text
        x="23"
        y="3"
        textAnchor="middle"
        fontSize="8"
        fontWeight="600"
        fill="var(--text)"
      >
        {label}
      </text>
    </g>
  );
}

function DashboardMock({ variant = "ops" }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "var(--r-4)",
        boxShadow: "var(--el-4)",
        border: "1px solid var(--border)",
        overflow: "hidden",
        width: "100%",
      }}
    >
      {/* window chrome */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface-2)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#FF5F57",
            }}
          />
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#FEBC2E",
            }}
          />
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#28C840",
            }}
          />
        </div>
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 12,
            color: "var(--text-3)",
          }}
        >
          app.tenacityfms.com / fleet / live
        </div>
        <Icon name="settings" size={14} style={{ color: "var(--text-3)" }} />
      </div>
      {/* app header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 4,
              background: "var(--primary)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            T
          </div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Live Operations</div>
          <span className="badge badge-success" style={{ fontSize: 10 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "currentColor",
                animation: "pulseDot 1.4s infinite",
              }}
            />
            LIVE
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div style={{ fontSize: 11, color: "var(--text-3)" }}>
            Updated 2s ago
          </div>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: "var(--surface-3)",
            }}
          />
        </div>
      </div>
      {/* body */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "180px 1fr 200px",
          height: 340,
        }}
      >
        {/* sidebar */}
        <div
          style={{
            borderRight: "1px solid var(--border)",
            padding: 10,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            background: "#FCFBFA",
          }}
        >
          {[
            ["pulse", "Live ops", true],
            ["truck", "Vehicles"],
            ["fuel", "Fuel audit"],
            ["tank", "Tank stock"],
            ["bell", "Alarms"],
            ["chart", "Reports"],
            ["workflow", "Workflows"],
            ["settings", "Admin"],
          ].map(([icon, label, active]) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 8px",
                borderRadius: 4,
                background: active ? "var(--primary-tint)" : "transparent",
                color: active ? "var(--primary-pressed)" : "var(--text-2)",
                fontSize: 12,
                fontWeight: active ? 600 : 500,
              }}
            >
              <Icon name={icon} size={14} /> {label}
            </div>
          ))}
        </div>
        {/* main */}
        <div
          style={{
            padding: 12,
            display: "grid",
            gridTemplateRows: "auto 1fr",
            gap: 10,
          }}
        >
          {/* KPI strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
            }}
          >
            {[
              {
                l: "Active vehicles",
                v: "187",
                d: "+12",
                up: true,
                spark: [4, 5, 4, 6, 7, 6, 8, 9],
              },
              {
                l: "Fuel on hand",
                v: "84.2k",
                u: "L",
                d: "-2.1%",
                up: false,
                spark: [9, 8, 8, 7, 6, 6, 5, 5],
              },
              {
                l: "Open alarms",
                v: "9",
                d: "-3",
                up: true,
                spark: [12, 11, 11, 10, 9, 9, 9, 9],
              },
              {
                l: "Avg L/100km",
                v: "31.4",
                d: "-0.6",
                up: true,
                spark: [33, 32, 32, 31, 31, 32, 31, 31],
              },
            ].map((k) => (
              <div
                key={k.l}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "8px 10px",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  {k.l}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    marginTop: 2,
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      fontFeatureSettings: "'tnum'",
                    }}
                  >
                    {k.v}
                    <span
                      style={{
                        fontSize: 10,
                        color: "var(--text-3)",
                        marginLeft: 2,
                      }}
                    >
                      {k.u}
                    </span>
                  </div>
                  <Sparkline
                    data={k.spark}
                    color={k.up ? "var(--success)" : "var(--danger)"}
                    width={48}
                    height={16}
                  />
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: k.up ? "var(--success)" : "var(--danger)",
                    fontWeight: 600,
                    marginTop: 2,
                  }}
                >
                  {k.d}
                </div>
              </div>
            ))}
          </div>
          {/* map */}
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 6,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <MapMock />
            <div
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                display: "flex",
                gap: 4,
              }}
            >
              {["All", "Active", "Idle", "Alarm"].map((t, i) => (
                <span
                  key={t}
                  style={{
                    fontSize: 10,
                    padding: "3px 7px",
                    background: i === 0 ? "var(--primary)" : "#fff",
                    color: i === 0 ? "#fff" : "var(--text-2)",
                    borderRadius: 3,
                    border:
                      "1px solid " +
                      (i === 0 ? "var(--primary)" : "var(--border)"),
                    fontWeight: 600,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
        {/* right rail: recent events */}
        <div
          style={{
            borderLeft: "1px solid var(--border)",
            padding: 10,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontSize: 11,
            background: "#FCFBFA",
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "var(--text-3)",
              textTransform: "uppercase",
              fontWeight: 600,
              letterSpacing: "0.06em",
            }}
          >
            Event feed
          </div>
          {[
            {
              t: "Geofence exit",
              v: "T-09 left Depot West",
              c: "var(--primary)",
              time: "2s",
            },
            {
              t: "Tank refill",
              v: "Site B · Tank 3 +12,400 L",
              c: "var(--success)",
              time: "1m",
            },
            {
              t: "Harsh braking",
              v: "T-21 · A2 Highway",
              c: "var(--warning)",
              time: "4m",
            },
            {
              t: "Anomaly",
              v: "Pump 4 dispense > expected",
              c: "var(--danger)",
              time: "9m",
            },
            {
              t: "Driver login",
              v: "M. Ndlovu · T-12",
              c: "var(--text-3)",
              time: "12m",
            },
            {
              t: "Geofence enter",
              v: "T-04 Site A",
              c: "var(--primary)",
              time: "18m",
            },
          ].map((e, i) => (
            <div
              key={i}
              style={{ display: "flex", gap: 8, alignItems: "flex-start" }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: e.c,
                  marginTop: 6,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, color: "var(--text)" }}>
                  {e.t}
                </div>
                <div
                  style={{
                    color: "var(--text-2)",
                    fontSize: 10,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {e.v}
                </div>
              </div>
              <div style={{ color: "var(--text-3)", fontSize: 10 }}>
                {e.time}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.DashboardMock = DashboardMock;
window.Sparkline = Sparkline;
