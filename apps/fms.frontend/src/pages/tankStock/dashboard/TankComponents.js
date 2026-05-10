import { useState, useEffect, useRef } from "react";

const STROKE = "#2a5298";
const SW = 2.2;

// ── Wave animation ────────────────────────────────────────────────
function Wave({ color, w, h }) {
  const [t, setT] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const run = () => { setT(p => p + 0.22); ref.current = requestAnimationFrame(run); };
    ref.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(ref.current);
  }, []);
  const ph = (t / 60) * Math.PI * 2;
  const pts = Array.from({ length: 61 }, (_, i) => {
    const x = (i / 60) * w;
    const y = Math.sin(ph + (i / 60) * Math.PI * 2) * 4
            + Math.sin(ph * 1.6 + (i / 60) * Math.PI * 3.5) * 2.5;
    return `${x},${y}`;
  }).join(" L ");
  return <path d={`M 0,${h} L ${pts} L ${w},${h} Z`} fill={color} opacity="0.9"/>;
}

// ── Smooth level transition ───────────────────────────────────────
function useSmooth(target) {
  const [val, setVal] = useState(target);
  const ref = useRef();
  useEffect(() => {
    const go = () => {
      setVal(p => { const d = target - p; return Math.abs(d) < 0.08 ? target : p + d * 0.08; });
      ref.current = requestAnimationFrame(go);
    };
    ref.current = requestAnimationFrame(go);
    return () => cancelAnimationFrame(ref.current);
  }, [target]);
  return val;
}

// ── Wheel sub-component ───────────────────────────────────────────
function Wheel({ cx, cy, rO = 24, rI = 14 }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={rO} fill="none" stroke={STROKE} strokeWidth={SW + 1}/>
      <circle cx={cx} cy={cy} r={rI} fill="none" stroke={STROKE} strokeWidth={SW - 0.3}/>
      {[0,45,90,135,180,225,270,315].map(a => {
        const rd = (a * Math.PI) / 180;
        return <line key={a}
          x1={cx + Math.cos(rd)*4} y1={cy + Math.sin(rd)*4}
          x2={cx + Math.cos(rd)*rI} y2={cy + Math.sin(rd)*rI}
          stroke={STROKE} strokeWidth={1.0} opacity="0.45"/>;
      })}
      <circle cx={cx} cy={cy} r={4} fill="none" stroke={STROKE} strokeWidth={SW - 0.5}/>
    </g>
  );
}

// ── LorryTanker ───────────────────────────────────────────────────
export function LorryTanker({ level = 70, fuelColor = "#4ade80", clipId = "ltkc" }) {
  const anim  = useSmooth(level);
  const label = anim > 80 ? "FULL" : anim > 55 ? "HIGH" : anim > 35 ? "HALF" : anim > 15 ? "LOW" : "EMPTY";

  const W = 580, H = 200;
  const cabX = 14, cabY = 58, cabW = 118, cabH = 80;
  const tkX  = cabX + cabW - 2, tkY = 38, tkW = W - tkX - 18, tkH = 110, tkR = 54;
  const pad  = SW + 1;
  const iX = tkX+pad, iY = tkY+pad, iW = tkW-pad*2, iH = tkH-pad*2;
  const fuelPx   = (anim / 100) * iH;
  const surfaceY = iY + iH - fuelPx;
  const waveH    = 14;
  const chY = tkY + tkH + 1, chH = 11;
  const wR = 24, wIR = 14, wCY = chY + chH + wR;
  const fwX = cabX + 52, rwX = tkX + tkW * 0.55, rwX2 = tkX + tkW * 0.78;
  const winX = cabX+14, winY = cabY+8, winW = cabW-28, winH = 36;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ display:"block", width:"100%", height:"auto", overflow:"visible" }}>
      <defs>
        <clipPath id={clipId}>
          <rect x={iX} y={iY} width={iW} height={iH} rx={tkR-2} ry={tkR-2}/>
        </clipPath>
      </defs>
      <rect x={cabX+18} y={chY} width={tkX+tkW-cabX-18} height={chH} rx={3}
        fill="none" stroke={STROKE} strokeWidth={SW}/>
      <g clipPath={`url(#${clipId})`}>
        <rect x={iX} y={iY} width={iW} height={iH} fill="#fff"/>
        {anim > 0.3 && <rect x={iX} y={surfaceY} width={iW} height={iH+10} fill={fuelColor}/>}
        {anim > 1 && (
          <g transform={`translate(${iX},${surfaceY - waveH*1.1})`}>
            <svg width={iW} height={waveH*3} viewBox={`0 0 ${iW} ${waveH*3}`} overflow="visible">
              <Wave color={fuelColor} w={iW} h={waveH*1.5}/>
            </svg>
          </g>
        )}
      </g>
      <rect x={tkX} y={tkY} width={tkW} height={tkH} rx={tkR} ry={tkR}
        fill="none" stroke={STROKE} strokeWidth={SW+0.5}/>
      <text x={tkX+tkW*0.50} y={tkY+tkH*0.50} textAnchor="middle"
        fontSize="40" fontWeight="800" fill="#4a5568" fontFamily="'Segoe UI',system-ui">
        {Math.round(anim)}%
      </text>
      <text x={tkX+tkW*0.50} y={tkY+tkH*0.69} textAnchor="middle"
        fontSize="10" fontWeight="700" fill="#4a5568" letterSpacing="4"
        fontFamily="'Segoe UI',system-ui">{label}</text>
      <rect x={cabX} y={cabY} width={cabW} height={cabH} rx={7}
        fill="none" stroke={STROKE} strokeWidth={SW+0.5}/>
      <rect x={winX} y={winY} width={winW} height={winH} rx={5}
        fill="none" stroke={STROKE} strokeWidth={SW}/>
      <line x1={winX+winW/2} y1={winY+4} x2={winX+winW/2} y2={winY+winH-4}
        stroke={STROKE} strokeWidth={1.4} opacity="0.5"/>
      <line x1={cabX+2} y1={winY+winH+8} x2={cabX+cabW-2} y2={winY+winH+8}
        stroke={STROKE} strokeWidth={1.4} opacity="0.3"/>
      {[[fwX,0],[rwX,1],[rwX2,2]].map(([cx,i]) => (
        <g key={i}>
          <path d={`M ${cx-wR-4},${chY+chH+2} A ${wR+4} ${wR+4} 0 0 1 ${cx+wR+4},${chY+chH+2}`}
            fill="none" stroke={STROKE} strokeWidth={SW}/>
          <Wheel cx={cx} cy={wCY} rO={wR} rI={wIR}/>
        </g>
      ))}
    </svg>
  );
}

// ── StationaryTank ────────────────────────────────────────────────
export function StationaryTank({ level = 45, fuelColor = "#f87171", clipId = "stkc" }) {
  const anim  = useSmooth(level);
  const label = anim > 80 ? "FULL" : anim > 55 ? "HIGH" : anim > 35 ? "HALF" : anim > 15 ? "LOW" : "EMPTY";

  const W = 480, H = 220;
  const tX = 20, tY = 20, tW = W-40, tH = 130, tR = 62;
  const pad  = SW + 1;
  const iX = tX+pad, iY = tY+pad, iW = tW-pad*2, iH = tH-pad*2;
  const fuelPx   = (anim / 100) * iH;
  const surfaceY = iY + iH - fuelPx;
  const waveH    = 14;
  const legBaseY = tY + tH, legH = 46, footH = 10, footW = 50, legW = 22;
  const leg1X = tX + tW * 0.22, leg2X = tX + tW * 0.78;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ display:"block", width:"100%", height:"auto", overflow:"visible" }}>
      <defs>
        <clipPath id={clipId}>
          <rect x={iX} y={iY} width={iW} height={iH} rx={tR-2} ry={tR-2}/>
        </clipPath>
      </defs>
      {[leg1X, leg2X].map((lx, i) => (
        <g key={i}>
          <rect x={lx-legW/2-2} y={tY+12} width={legW+4} height={tH-24}
            fill="none" stroke={STROKE} strokeWidth={SW+0.5} rx={3}/>
          <rect x={lx-legW/2-2} y={legBaseY} width={legW*0.45} height={legH}
            fill="none" stroke={STROKE} strokeWidth={SW} rx={2}/>
          <rect x={lx+legW*0.08} y={legBaseY} width={legW*0.45} height={legH}
            fill="none" stroke={STROKE} strokeWidth={SW} rx={2}/>
          <rect x={lx-footW/2} y={legBaseY+legH} width={footW} height={footH}
            fill="none" stroke={STROKE} strokeWidth={SW} rx={3}/>
        </g>
      ))}
      <g clipPath={`url(#${clipId})`}>
        <rect x={iX} y={iY} width={iW} height={iH} fill="#fff"/>
        {anim > 0.3 && <rect x={iX} y={surfaceY} width={iW} height={iH+10} fill={fuelColor}/>}
        {anim > 1 && (
          <g transform={`translate(${iX},${surfaceY - waveH*1.1})`}>
            <svg width={iW} height={waveH*3} viewBox={`0 0 ${iW} ${waveH*3}`} overflow="visible">
              <Wave color={fuelColor} w={iW} h={waveH*1.5}/>
            </svg>
          </g>
        )}
      </g>
      <rect x={tX} y={tY} width={tW} height={tH} rx={tR} ry={tR}
        fill="none" stroke={STROKE} strokeWidth={SW+0.5}/>
      <text x={tX+tW*0.50} y={tY+tH*0.48} textAnchor="middle"
        fontSize="38" fontWeight="800" fill="#4a5568" fontFamily="'Segoe UI',system-ui">
        {Math.round(anim)}%
      </text>
      <text x={tX+tW*0.50} y={tY+tH*0.67} textAnchor="middle"
        fontSize="10" fontWeight="700" fill="#4a5568" letterSpacing="4"
        fontFamily="'Segoe UI',system-ui">{label}</text>
      <rect x={tX+tW*0.5-18} y={tY-12} width={36} height={14} rx={4}
        fill="none" stroke={STROKE} strokeWidth={SW}/>
      <rect x={tX+tW*0.5-10} y={tY-23} width={20} height={13} rx={3}
        fill="none" stroke={STROKE} strokeWidth={SW}/>
    </svg>
  );
}