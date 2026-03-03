/**
 * File:          TankLocationMap.js
 * Purpose:       Google Maps view for a tank's location.
 *                - Stationary tanks: uses tank.latitude / tank.longitude (static)
 *                - Mobile tankers:   calls /vehicletracking/{linkedVehicleId}/gps-information
 *                  for real-time position (same API used by VehicleGPSInformation.js)
 * Dependencies:  axiosInstance, Google Maps JS API (loaded dynamically)
 * Last Modified: 2026-03-02
 *
 * Props:
 * - tank        (object): Tank entity
 * - liveStatus  (object): UploadStatus (unused — GPS data comes from tracking API)
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axiosInstance from '../../../api/axiosInstance';

/* ── helpers ─────────────────────────────────────────────────────────────── */
const parseCoord = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
};

const fmtSpeed = (v) => (v != null ? `${Number(v).toFixed(1)} km/h` : '—');
const fmtTime  = (v) => {
  if (!v) return '—';
  try { return new Date(v).toLocaleString(); } catch { return v; }
};

/* ── component ───────────────────────────────────────────────────────────── */
const TankLocationMap = ({ tank }) => {
  const isMobile  = tank?.tankType === 'MobileTanker';
  const vehicleId = tank?.linkedVehicleId;

  /* ── map refs ── */
  const mapRef    = useRef(null);
  const mapInst   = useRef(null);
  const markerRef = useRef(null);

  /* ── state ── */
  const [apiKey,     setApiKey]     = useState(null);
  const [keyError,   setKeyError]   = useState(false);
  const [mapLoading, setMapLoading] = useState(false);

  // For mobile tankers — live GPS data from tracking API
  const [gpsData,    setGpsData]    = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError,   setGpsError]   = useState(null);

  /* ── coords: live GPS for mobile, static for stationary ── */
  const lat = isMobile ? parseCoord(gpsData?.latitude)  : parseCoord(tank?.latitude);
  const lng = isMobile ? parseCoord(gpsData?.longitude) : parseCoord(tank?.longitude);
  const hasCoords = lat !== null && lng !== null;

  /* ── 1. fetch Google Maps API key ── */
  useEffect(() => {
    axiosInstance
      .get('/SystemConfiguration/by-key/GoogleMaps.ApiKey')
      .then((res) => {
        const key = res.data?.data?.configurationValue;
        if (key) setApiKey(key);
        else     setKeyError(true);
      })
      .catch(() => setKeyError(true));
  }, []);

  /* ── 2. fetch live GPS for mobile tankers ── */
  const fetchLiveGPS = useCallback(async () => {
    if (!isMobile || !vehicleId) return;
    setGpsLoading(true);
    setGpsError(null);
    try {
      const res = await axiosInstance.get(`/vehicletracking/${vehicleId}/gps-information`);
      if (res.data?.success || res.data?.isSuccess) {
        setGpsData(res.data.data);
      } else {
        setGpsError(res.data?.message || 'GPS data unavailable');
      }
    } catch {
      setGpsError('Could not load live GPS position');
    } finally {
      setGpsLoading(false);
    }
  }, [isMobile, vehicleId]);

  useEffect(() => { fetchLiveGPS(); }, [fetchLiveGPS]);

  /* ── 3. build / update map ── */
  const initMap = useCallback(() => {
    if (!mapRef.current || !window.google?.maps || !hasCoords) return;

    const center = { lat, lng };

    if (!mapInst.current) {
      mapInst.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 15,
        mapTypeId: 'roadmap',
        zoomControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        mapTypeControl: false,
      });
    } else {
      mapInst.current.setCenter(center);
    }

    if (markerRef.current) markerRef.current.setMap(null);

    const fillColor = !isMobile
      ? '#0078d4'
      : gpsData?.isOnline ? '#107c10' : '#a19f9d';

    const markerTitle = isMobile
      ? (gpsData?.vehicleName || tank?.linkedVehicleName || 'Vehicle')
      : (tank?.name || 'Tank');

    markerRef.current = new window.google.maps.Marker({
      position: center,
      map: mapInst.current,
      title: markerTitle,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2.5,
      },
    });

    const subLine = isMobile
      ? `<div style="color:#605e5c;margin-bottom:2px">${gpsData?.isOnline ? '🟢 Online' : '⚫ Offline'} · ${fmtSpeed(gpsData?.speed)}</div>`
      : `<div style="color:#605e5c;margin-bottom:2px">${tank?.siteName || ''}</div>`;

    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="font-family:'Segoe UI',sans-serif;font-size:13px;min-width:170px;padding:4px 2px">
          <div style="font-weight:600;color:#201f1e;margin-bottom:4px">${markerTitle}</div>
          ${subLine}
          <div style="color:#a19f9d;font-size:11px">${lat.toFixed(6)}, ${lng.toFixed(6)}</div>
        </div>`,
    });
    markerRef.current.addListener('click', () =>
      infoWindow.open(mapInst.current, markerRef.current)
    );

    // Validation radius circle for stationary tanks
    if (!isMobile && tank?.locationValidationRadius) {
      new window.google.maps.Circle({
        strokeColor: '#0078d4', strokeOpacity: 0.35, strokeWeight: 1.5,
        fillColor: '#deecf9',   fillOpacity: 0.2,
        map: mapInst.current,   center,
        radius: Number(tank.locationValidationRadius),
      });
    }
  }, [lat, lng, hasCoords, isMobile, gpsData, tank]);

  /* ── 4. load Google Maps script once coords + key are ready ── */
  useEffect(() => {
    if (!apiKey || !hasCoords) return;

    if (window.google?.maps) { setTimeout(initMap, 100); return; }

    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      existing.addEventListener('load', () => setTimeout(initMap, 100));
      return;
    }

    setMapLoading(true);
    const script = document.createElement('script');
    script.src    = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async  = true;
    script.defer  = true;
    script.onload  = () => { setMapLoading(false); setTimeout(initMap, 100); };
    script.onerror = () => { setMapLoading(false); setKeyError(true); };
    document.head.appendChild(script);
  }, [apiKey, hasCoords, initMap]);

  /* ── 5. re-center when live GPS coords change ── */
  useEffect(() => {
    if (mapInst.current && hasCoords) setTimeout(initMap, 50);
  }, [lat, lng]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ══════════════════════════════════════════════════════════
   *  RENDER — mobile tanker: loading GPS
   * ══════════════════════════════════════════════════════════ */
  if (isMobile && gpsLoading && !gpsData) {
    return (
      <div className="tdp-map-empty">
        <i className="fa-light fa-spinner fa-spin" style={{ fontSize: 28 }} />
        <p className="tdp-map-empty__title">Loading live GPS position…</p>
        <p className="tdp-map-empty__hint">Fetching current location from the vehicle tracking system.</p>
      </div>
    );
  }

  /* ── mobile tanker: no vehicle linked ── */
  if (isMobile && !vehicleId) {
    return (
      <div className="tdp-map-empty">
        <i className="fa-light fa-truck-moving" />
        <p className="tdp-map-empty__title">No vehicle linked</p>
        <p className="tdp-map-empty__hint">Link a vehicle to this mobile tanker to see its live GPS position.</p>
      </div>
    );
  }

  /* ── mobile tanker: GPS error, no coords ── */
  if (isMobile && gpsError && !hasCoords) {
    return (
      <div className="tdp-map-empty">
        <i className="fa-light fa-satellite-dish" />
        <p className="tdp-map-empty__title">GPS position unavailable</p>
        <p className="tdp-map-empty__hint">{gpsError}</p>
        {tank?.linkedVehicleName && (
          <div className="tdp-map-vehicle-chip" style={{ marginTop: 10 }}>
            <i className="fa-light fa-truck" />
            {tank.linkedVehicleName}
          </div>
        )}
        <button className="m365-btn m365-btn--ghost" style={{ marginTop: 12 }} onClick={fetchLiveGPS}>
          <i className="fa-light fa-rotate-right" /> &nbsp;Retry
        </button>
      </div>
    );
  }

  /* ── stationary: no coords set ── */
  if (!isMobile && !hasCoords) {
    return (
      <div className="tdp-map-empty">
        <i className="fa-light fa-map-pin" />
        <p className="tdp-map-empty__title">No location set</p>
        <p className="tdp-map-empty__hint">Set latitude and longitude in the Edit panel to display a map.</p>
      </div>
    );
  }

  /* ── API key error fallback ── */
  if (keyError) {
    return (
      <div className="tdp-map-empty">
        <i className="fa-light fa-triangle-exclamation" style={{ color: 'var(--m365-warning)' }} />
        <p className="tdp-map-empty__title">Map unavailable</p>
        <p className="tdp-map-empty__hint">Google Maps API key is not configured.</p>
        {hasCoords && (
          <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank"
             rel="noopener noreferrer" className="tdp-map-footer__link" style={{ marginTop: 8 }}>
            <i className="fa-light fa-arrow-up-right-from-square" />
            &nbsp;Open {lat?.toFixed(5)}, {lng?.toFixed(5)} in Google Maps
          </a>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════
   *  RENDER — map
   * ══════════════════════════════════════════════════════════ */
  return (
    <div className="tdp-map-wrapper">
      {/* loading overlay */}
      {mapLoading && (
        <div className="tdp-map-loader">
          <i className="fa-light fa-spinner fa-spin" />
          <span>Loading map…</span>
        </div>
      )}

      {/* vehicle header for mobile tankers */}
      {isMobile && (
        <div className="tdp-map-vehicle-header">
          <div className="tdp-map-vehicle-chip">
            <i className="fa-light fa-truck" />
            {gpsData?.vehicleName || tank?.linkedVehicleName}
            <span style={{
              color: gpsData?.isOnline ? 'var(--m365-success,#107c10)' : 'var(--m365-text-tertiary,#a19f9d)',
              fontWeight: 400,
            }}>
              {gpsData?.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <button
            className="m365-btn m365-btn--ghost"
            style={{ fontSize: 12, padding: '3px 8px', height: 'auto' }}
            onClick={fetchLiveGPS}
            disabled={gpsLoading}
            title="Refresh GPS position"
          >
            <i className={`fa-light fa-rotate-right${gpsLoading ? ' fa-spin' : ''}`} />
          </button>
        </div>
      )}

      {/* map canvas */}
      <div ref={mapRef} className="tdp-map-canvas" />

      {/* footer */}
      <div className="tdp-map-footer">
        <i className="fa-light fa-map-pin" />
        <span className="tdp-map-footer__coords">
          {lat?.toFixed(6)}, {lng?.toFixed(6)}
          {isMobile && gpsData?.speed != null && <> &nbsp;·&nbsp; {fmtSpeed(gpsData.speed)}</>}
          {isMobile && gpsData?.lastUpdated  && <> &nbsp;·&nbsp; {fmtTime(gpsData.lastUpdated)}</>}
        </span>
        <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank"
           rel="noopener noreferrer" className="tdp-map-footer__link">
          <i className="fa-light fa-arrow-up-right-from-square" /> &nbsp;Open in Maps
        </a>
      </div>
    </div>
  );
};

export default TankLocationMap;
