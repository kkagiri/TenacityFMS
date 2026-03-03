import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { SelectBox } from 'devextreme-react/select-box';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import axiosInstance from '../../../api/axiosInstance';
import { fetchTanks } from '../../../redux/actions/tankActions';
import { fetchSiteList } from '../../../redux/actions/siteActions';
import { usePermissions } from '../../../hooks/usePermissions';
import SlidePanel from '../../../components/ui/SlidePanel';
import TankDetailPanel from '../../tank/components/TankDetailPanel';
import TankHistoryPanel from '../../tank/components/TankHistoryPanel';
import TankFormPanel from '../../tank/components/TankFormPanel';
import PTSDeviceLinkPanel from '../../tank/components/PTSDeviceLinkPanel';
import { LorryTanker, StationaryTank } from './TankComponents';
import './EnhancedTankStockDashboard.scss';

/* ── Level → fill colour (Critical=red, Low=orange, Normal=blue, Full=green) */
const getLevelColor = (pct) => {
  if (pct < 20) return "#f87171"; // red   — Critical
  if (pct < 50) return "#fb923c"; // orange — Low
  if (pct < 80) return "#60a5fa"; // blue   — Normal
  return "#4ade80";               // green  — Full / High
};

const getStatusBadge = (pct) => {
  if (pct < 20) return { text: "Critical", cls: "fms-badge--red" };
  if (pct < 50) return { text: "Low", cls: "fms-badge--orange" };
  if (pct < 80) return { text: "Normal", cls: "fms-badge--green" };
  return { text: "Full", cls: "fms-badge--blue" };
};

/* ── Fluent stat card ───────────────────────────────────────────── */
const FluentStat = ({ label, value, sub, color = 'blue', icon, delay = 0 }) => {
  const barC = { blue: '#0078D4', orange: '#CA5010', yellow: '#FFB900', green: '#107C10', red: '#D13438', teal: '#008272' };
  const textC = { blue: '#0078D4', orange: '#CA5010', yellow: '#7A5200', green: '#107C10', red: '#D13438', teal: '#008272' };
  return (
    <div className="fms-stat" style={{ animationDelay: `${delay}s` }}>
      <div className="fms-stat__bar" style={{ background: barC[color] }} />
      <div className="fms-stat__label">{label}</div>
      <div className="fms-stat__value" style={{ color: textC[color] }}>{value}</div>
      {sub && <div className="fms-stat__sub">{sub}</div>}
      {icon && <div className="fms-stat__ghost"><i className={icon} /></div>}
    </div>
  );
};

/* ── Google Maps tab for mobile tankers ────────────────────────── */
const TankerMapTab = ({ mobileTanks }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const [mapApiKey, setMapApiKey] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(false);

  useEffect(() => {
    axiosInstance.get('/SystemConfiguration/by-key/GoogleMaps.ApiKey')
      .then((res) => {
        if (res.data?.data?.configurationValue) setMapApiKey(res.data.data.configurationValue);
      })
      .catch(() => notify('Could not load map configuration', 'warning', 3000));
  }, []);

  useEffect(() => {
    if (!mapApiKey) return;
    if (window.google?.maps) { setIsMapLoaded(true); return; }
    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) { existing.addEventListener('load', () => setIsMapLoaded(true)); return; }
    setIsMapLoading(true);
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapApiKey}&libraries=places`;
    script.async = true; script.defer = true;
    script.onload = () => { setIsMapLoaded(true); setIsMapLoading(false); };
    script.onerror = () => { setIsMapLoading(false); notify('Failed to load Google Maps', 'error', 3000); };
    document.head.appendChild(script);
  }, [mapApiKey]);

  useEffect(() => {
    if (!isMapLoaded || !mapContainerRef.current || mapRef.current) return;
    mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
      center: { lat: -1.2921, lng: 36.8219 }, zoom: 10,
      mapTypeId: 'roadmap', streetViewControl: false,
    });
    infoWindowRef.current = new window.google.maps.InfoWindow();
  }, [isMapLoaded]);

  useEffect(() => {
    if (!mapRef.current || !window.google) return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    const positioned = mobileTanks.filter((t) => t.latitude && t.longitude);
    if (positioned.length === 0) return;
    const bounds = new window.google.maps.LatLngBounds();
    positioned.forEach((tank) => {
      const fillPct = tank.tankVolume > 0 ? ((tank.currentStock || 0) / tank.tankVolume) * 100 : 0;
      const dotColor = fillPct < 20 ? 'red' : fillPct < 50 ? 'yellow' : 'green';
      const marker = new window.google.maps.Marker({
        position: { lat: tank.latitude, lng: tank.longitude },
        map: mapRef.current, title: tank.name,
        icon: { url: `http://maps.google.com/mapfiles/ms/icons/${dotColor}-dot.png`, scaledSize: new window.google.maps.Size(32, 32) },
      });
      marker.addListener('click', () => {
        infoWindowRef.current.setContent(`
          <div style="padding:8px;min-width:180px;font-family:'Segoe UI',sans-serif">
            <strong style="font-size:13px">${tank.name}</strong>
            <p style="margin:4px 0;font-size:12px;color:#605E5C">${tank.siteName || 'No Site'} · ${tank.fuelGradeName || '—'}</p>
            <p style="margin:4px 0;font-size:12px"><strong>${fillPct.toFixed(1)}%</strong> · ${(tank.currentStock || 0).toLocaleString()} L / ${(tank.tankVolume || 0).toLocaleString()} L</p>
          </div>`);
        infoWindowRef.current.open(mapRef.current, marker);
      });
      markersRef.current.push(marker);
      bounds.extend({ lat: tank.latitude, lng: tank.longitude });
    });
    if (positioned.length > 1) mapRef.current.fitBounds(bounds, { padding: 60 });
    else mapRef.current.panTo({ lat: positioned[0].latitude, lng: positioned[0].longitude });
  }, [mobileTanks, isMapLoaded]);

  if (!mapApiKey || isMapLoading) {
    return (<div className="fms-map-loading"><LoadIndicator visible={true} /><span>Loading map…</span></div>);
  }
  return (
    <div className="fms-map-wrap">
      <div ref={mapContainerRef} className="fms-map-container" />
      {mobileTanks.filter((t) => !t.latitude).length > 0 && (
        <div className="fms-map-notice">
          <i className="fa-light fa-circle-info" />
          {mobileTanks.filter((t) => !t.latitude).length} tanker(s) have no GPS position recorded.
        </div>
      )}
    </div>
  );
};

/* ── Single tank card (clickable → opens TankDetailPanel) ───────── */
const TankCard = ({ tank, onSelectTank, onViewTransactions }) => {
  const fillPct = tank.tankVolume > 0 ? ((tank.currentStock || 0) / tank.tankVolume) * 100 : 0;
  const fuelColor = getLevelColor(fillPct);
  const status = getStatusBadge(fillPct);
  const isMobile = tank.tankType === 'MobileTanker';
  const clipId = `tank-clip-${tank.id}`;

  return (
    <div className="fms-tank-card" onClick={() => onSelectTank(tank)} role="button" tabIndex={0}>
      <div className="fms-tank-card__hd">
        <span className="fms-tank-card__name">
          <i className={`fa-light ${isMobile ? 'fa-truck-moving' : 'fa-gas-pump'}`} />
          {tank.name}
        </span>
        <span className={`fms-badge ${status.cls}`}>{status.text}</span>
      </div>
      <div className="fms-tank-card__meta">
        {tank.siteName || 'No Site'} · {tank.fuelGradeName || '—'}
        {tank.ptsId && <span className="fms-tank-card__pts"><i className="fa-light fa-satellite-dish" /> PTS</span>}
      </div>
      <div className="fms-tank-card__visual">
        {isMobile
          ? <LorryTanker level={fillPct} fuelColor={fuelColor} clipId={clipId} />
          : <StationaryTank level={fillPct} fuelColor={fuelColor} clipId={clipId} />}
      </div>
      <div className="fms-tank-card__ft">
        <span>{(tank.currentStock || 0).toLocaleString()} L / {(tank.tankVolume || 0).toLocaleString()} L</span>
        <span className="fms-tank-card__pct" style={{ color: fillPct < 20 ? '#D13438' : fillPct < 50 ? '#CA5010' : '#107C10' }}>
          {fillPct.toFixed(1)}%
        </span>
      </div>
      <div className="fms-tank-card__actions">
        <button className="fms-link-btn fms-link-btn--sm" onClick={(e) => { e.stopPropagation(); onSelectTank(tank); }}>
          <i className="fa-light fa-eye" /> View details
        </button>
        <button className="fms-link-btn fms-link-btn--sm" onClick={(e) => { e.stopPropagation(); onViewTransactions(tank); }}>
          <i className="fa-light fa-arrow-right-arrow-left" /> Transactions
        </button>
      </div>
    </div>
  );
};

/* ── Collapsible group block ───────────────────────────────────── */
const CollapsibleGroup = ({ icon, label, count, summary, criticalCount, children }) => {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="fms-site-group">
      <div className="fms-site-group__hd" onClick={() => setCollapsed((c) => !c)}>
        <div className="fms-site-group__left">
          <i className={`fa-light ${collapsed ? 'fa-chevron-right' : 'fa-chevron-down'} fms-site-group__chevron`} />
          <i className={`fa-light ${icon} fms-site-group__icon`} />
          <span className="fms-site-group__name">{label}</span>
          <span className="fms-site-group__count">{count} tank{count !== 1 ? 's' : ''}</span>
          {criticalCount > 0 && <span className="fms-badge fms-badge--red">{criticalCount} critical</span>}
        </div>
        <div className="fms-site-group__right">{summary}</div>
      </div>
      {!collapsed && <div className="fms-site-group__body">{children}</div>}
    </div>
  );
};

/* ── Group summary helper ─────────────────────────────────────── */
const GroupSummary = ({ tanks }) => {
  const cap = tanks.reduce((s, t) => s + (t.tankVolume || 0), 0);
  const stock = tanks.reduce((s, t) => s + (t.currentStock || 0), 0);
  const pct = cap > 0 ? (stock / cap) * 100 : 0;
  return (
    <>
      <span className="fms-site-group__pct" style={{ color: pct < 20 ? '#D13438' : pct < 50 ? '#CA5010' : '#107C10' }}>
        {pct.toFixed(1)}%
      </span>
      <span className="fms-site-group__vol">{stock.toLocaleString()} / {cap.toLocaleString()} L</span>
    </>
  );
};

const critCount = (tanks) =>
  tanks.filter((t) => t.tankVolume > 0 && ((t.currentStock || 0) / t.tankVolume) * 100 < 20).length;

/* ══ Main Dashboard ═════════════════════════════════════════════════ */
const EnhancedTankStockDashboard = () => {
  const dispatch = useDispatch();
  const { hasPermission } = usePermissions();
  const canEdit    = hasPermission('_Edit_Tank');
  const canHistory = hasPermission('_Read_TankVolumeHistory');

  const { tanks, loading: tanksLoading } = useSelector((s) => s.tank);
  const { sites } = useSelector((s) => s.site);
  const connectionStatuses = useSelector((s) => s.deviceConnections?.connectionStatuses || {});
  const uploadStatusByDevice = useSelector((s) => s.realtimeStatus?.uploadStatusByDevice || {});

  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [activeTab, setActiveTab] = useState('levels');
  const [groupBy, setGroupBy] = useState('site');
  const [sortBy, setSortBy] = useState('capacity');   // 'capacity' | 'balance'
  const [sortDir, setSortDir] = useState('desc');        // 'asc' | 'desc'
  const [siteSort, setSiteSort] = useState('capacity');   // 'capacity' | 'balance' | 'name'
  const [siteSortDir, setSiteSortDir] = useState('desc');        // 'asc' | 'desc'
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTank, setSelectedTank] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [ptsLinkOpen, setPtsLinkOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchTanks());
    dispatch(fetchSiteList());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([dispatch(fetchTanks()), dispatch(fetchSiteList())]);
    setRefreshing(false);
  }, [dispatch]);

  const handleViewTransactions = useCallback((tank) => {
    setSelectedTank(tank);
    setHistoryOpen(true);
  }, []);

  const handleEditTank = useCallback(() => {
    if (!selectedTank || !canEdit) return;
    setEditOpen(true);
  }, [selectedTank, canEdit]);

  const handleLinkPTS = useCallback(() => {
    if (!selectedTank || !canEdit) return;
    setPtsLinkOpen(true);
  }, [selectedTank, canEdit]);

  const filteredTanks = useMemo(() => {
    if (!Array.isArray(tanks)) return [];
    if (!selectedSiteId) return tanks;
    return tanks.filter((t) => t.siteId === selectedSiteId);
  }, [tanks, selectedSiteId]);

  const metrics = useMemo(() => {
    const list = filteredTanks;
    const totalCap = list.reduce((s, t) => s + (t.tankVolume || 0), 0);
    const totalStock = list.reduce((s, t) => s + (t.currentStock || 0), 0);
    const critical = list.filter((t) => t.tankVolume > 0 && ((t.currentStock || 0) / t.tankVolume) * 100 < 20).length;
    const mobile = list.filter((t) => t.tankType === 'MobileTanker').length;
    const stationary = list.length - mobile;
    return { totalCapacity: totalCap, totalStock, critical, mobile, stationary, total: list.length };
  }, [filteredTanks]);

  const overallPct = metrics.totalCapacity > 0 ? (metrics.totalStock / metrics.totalCapacity) * 100 : 0;

  const sortTanks = useCallback((list, by, dir) => {
    const sorted = [...list];
    const mul = dir === 'asc' ? 1 : -1;
    if (by === 'balance') sorted.sort((a, b) => mul * ((a.currentStock || 0) - (b.currentStock || 0)));
    else sorted.sort((a, b) => mul * ((a.tankVolume || 0) - (b.tankVolume || 0)));
    return sorted;
  }, []);

  const siteGroups = useMemo(() => {
    const groups = {};
    filteredTanks.forEach((tank) => {
      const key = tank.siteId ?? 'unassigned';
      const name = tank.siteName ?? 'Unassigned';
      if (!groups[key]) groups[key] = { name, tanks: [] };
      groups[key].tanks.push(tank);
    });

    // sort tanks within each site group
    Object.values(groups).forEach((g) => { g.tanks = sortTanks(g.tanks, sortBy, sortDir); });

    const entries = Object.entries(groups);

    // sort the site groups themselves
    const siteMul = siteSortDir === 'asc' ? 1 : -1;
    if (siteSort === 'capacity') {
      entries.sort(([, a], [, b]) => {
        const capA = a.tanks.reduce((s, t) => s + (t.tankVolume || 0), 0);
        const capB = b.tanks.reduce((s, t) => s + (t.tankVolume || 0), 0);
        return siteMul * (capA - capB);
      });
    } else if (siteSort === 'balance') {
      entries.sort(([, a], [, b]) => {
        const balA = a.tanks.reduce((s, t) => s + (t.currentStock || 0), 0);
        const balB = b.tanks.reduce((s, t) => s + (t.currentStock || 0), 0);
        return siteMul * (balA - balB);
      });
    } else {
      entries.sort(([, a], [, b]) => siteMul * a.name.localeCompare(b.name));
    }

    return entries;
  }, [filteredTanks, sortBy, sortDir, siteSort, siteSortDir, sortTanks]);

  const typeGroups = useMemo(() => {
    const stationary = filteredTanks.filter((t) => t.tankType !== 'MobileTanker');
    const mobile = filteredTanks.filter((t) => t.tankType === 'MobileTanker');
    const groups = [];
    if (stationary.length > 0) groups.push({ key: 'stationary', label: 'Stationary Tanks', icon: 'fa-gas-pump', tanks: sortTanks(stationary, sortBy, sortDir) });
    if (mobile.length > 0) groups.push({ key: 'mobile', label: 'Mobile Tankers', icon: 'fa-truck-moving', tanks: sortTanks(mobile, sortBy, sortDir) });
    return groups;
  }, [filteredTanks, sortBy, sortDir, sortTanks]);

  const mobileTanks = useMemo(() => filteredTanks.filter((t) => t.tankType === 'MobileTanker'), [filteredTanks]);

  const siteOptions = useMemo(() => {
    if (!Array.isArray(sites)) return [];
    const active = sites.filter((s) => s.isActive !== false);
    return [{ id: null, name: 'All Sites' }, ...active];
  }, [sites]);

  const selectedLiveStatus = selectedTank?.ptsId ? uploadStatusByDevice[selectedTank.ptsId] : null;
  const selectedConnection = selectedTank?.ptsId ? connectionStatuses[selectedTank.ptsId] : null;

  if (tanksLoading && !Array.isArray(tanks)) {
    return (
      <div className="fms-dashboard-loading">
        <LoadIndicator visible={true} />
        <span>Loading tank data…</span>
      </div>
    );
  }

  const renderTankGrid = (tankList) => (
    <div className="fms-tank-grid">
      {tankList.map((t) => (
        <TankCard key={t.id} tank={t} onSelectTank={setSelectedTank} onViewTransactions={handleViewTransactions} />
      ))}
    </div>
  );

  return (
    <div className="fms-tank-dashboard">

      {/* ── Page Header ── */}
      <div className="fms-page-hd">
        <div>
          <h1>Tank Stock Dashboard</h1>
          <p>Real-time fuel tank level monitoring across all sites.</p>
        </div>
        <div className="fms-btn-grp">
          <div className="fms-filter-inline">
            <SelectBox
              dataSource={siteOptions} displayExpr="name" valueExpr="id"
              value={selectedSiteId} onValueChanged={(e) => setSelectedSiteId(e.value)}
              placeholder="All Sites" showClearButton={false} width={180} height={28}
            />
          </div>
          <button className="fms-btn fms-btn--primary" onClick={handleRefresh} disabled={refreshing}>
            <i className={`fa-light fa-rotate-right ${refreshing ? 'fms-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="fms-stat-grid fms-g4">
        <FluentStat label="Total Tanks" value={metrics.total}
          sub={`${metrics.mobile} mobile · ${metrics.stationary} stationary`}
          color="blue" icon="fa-light fa-database" delay={0} />
        <FluentStat label="Total Stock" value={`${metrics.totalStock.toLocaleString()} L`}
          sub={`of ${metrics.totalCapacity.toLocaleString()} L capacity`}
          color="teal" icon="fa-light fa-droplet" delay={0.04} />
        <FluentStat label="Fill Level" value={`${overallPct.toFixed(1)}%`}
          sub={overallPct < 30 ? 'Below target' : overallPct < 60 ? 'Moderate' : 'Healthy'}
          color={overallPct < 30 ? 'orange' : overallPct < 60 ? 'yellow' : 'green'}
          icon="fa-light fa-gauge-high" delay={0.08} />
        <FluentStat label="Critical (<20%)" value={metrics.critical}
          sub={metrics.critical > 0 ? 'Requires attention' : 'All tanks healthy'}
          color={metrics.critical > 0 ? 'red' : 'green'}
          icon="fa-light fa-triangle-exclamation" delay={0.12} />
      </div>

      {/* ── Tab Bar ── */}
      <div className="fms-tab-bar">
        <div className="fms-tab-btn-group">
          <button className={`fms-tab-btn ${activeTab === 'levels' ? 'fms-tab-btn--active' : ''}`} onClick={() => setActiveTab('levels')}>
            <i className="fa-light fa-chart-column" /> Tank Levels
            <span className="fms-tab-btn__cnt">{filteredTanks.length}</span>
          </button>
          <button className={`fms-tab-btn ${activeTab === 'map' ? 'fms-tab-btn--active' : ''}`} onClick={() => setActiveTab('map')}>
            <i className="fa-light fa-map" /> Map View
            <span className="fms-tab-btn__cnt">{mobileTanks.length}</span>
          </button>
        </div>
      </div>

      {/* ── Tab: Tank Levels ── */}
      {activeTab === 'levels' && (
        <div className="fms-card">

          {/* ── Filter bar ── */}
          <div className="fms-filter-bar">
            <div className="fms-filter-bar__cell">
              <label className="fms-filter-bar__lbl">Group by</label>
              <div className="fms-seg">
                <button className={`fms-seg__btn ${groupBy === 'site' ? 'fms-seg__btn--on' : ''}`}
                  onClick={() => setGroupBy('site')}>By Site</button>
                <button className={`fms-seg__btn ${groupBy === 'type' ? 'fms-seg__btn--on' : ''}`}
                  onClick={() => setGroupBy('type')}>By Type</button>
              </div>
            </div>

            <div className="fms-filter-bar__div" />

            <div className="fms-filter-bar__cell">
              <label className="fms-filter-bar__lbl">Sort tanks</label>
              <div className="fms-seg">
                <button
                  className={`fms-seg__btn ${sortBy === 'capacity' ? 'fms-seg__btn--on' : ''}`}
                  onClick={() => {
                    if (sortBy === 'capacity') setSortDir((d) => d === 'desc' ? 'asc' : 'desc');
                    else { setSortBy('capacity'); setSortDir('desc'); }
                  }}>
                  Capacity
                  {sortBy === 'capacity' && (
                    <i className={`fa-light ${sortDir === 'desc' ? 'fa-arrow-down' : 'fa-arrow-up'}`} />
                  )}
                </button>
                <button
                  className={`fms-seg__btn ${sortBy === 'balance' ? 'fms-seg__btn--on' : ''}`}
                  onClick={() => {
                    if (sortBy === 'balance') setSortDir((d) => d === 'desc' ? 'asc' : 'desc');
                    else { setSortBy('balance'); setSortDir('desc'); }
                  }}>
                  Balance
                  {sortBy === 'balance' && (
                    <i className={`fa-light ${sortDir === 'desc' ? 'fa-arrow-down' : 'fa-arrow-up'}`} />
                  )}
                </button>
              </div>
            </div>

            {groupBy === 'site' && (
              <>
                <div className="fms-filter-bar__div" />
                <div className="fms-filter-bar__cell">
                  <label className="fms-filter-bar__lbl">Sort sites</label>
                  <div className="fms-seg">
                    <button
                      className={`fms-seg__btn ${siteSort === 'capacity' ? 'fms-seg__btn--on' : ''}`}
                      onClick={() => {
                        if (siteSort === 'capacity') setSiteSortDir((d) => d === 'desc' ? 'asc' : 'desc');
                        else { setSiteSort('capacity'); setSiteSortDir('desc'); }
                      }}>
                      Capacity
                      {siteSort === 'capacity' && (
                        <i className={`fa-light ${siteSortDir === 'desc' ? 'fa-arrow-down' : 'fa-arrow-up'}`} />
                      )}
                    </button>
                    <button
                      className={`fms-seg__btn ${siteSort === 'balance' ? 'fms-seg__btn--on' : ''}`}
                      onClick={() => {
                        if (siteSort === 'balance') setSiteSortDir((d) => d === 'desc' ? 'asc' : 'desc');
                        else { setSiteSort('balance'); setSiteSortDir('desc'); }
                      }}>
                      Balance
                      {siteSort === 'balance' && (
                        <i className={`fa-light ${siteSortDir === 'desc' ? 'fa-arrow-down' : 'fa-arrow-up'}`} />
                      )}
                    </button>
                    <button
                      className={`fms-seg__btn ${siteSort === 'name' ? 'fms-seg__btn--on' : ''}`}
                      onClick={() => {
                        if (siteSort === 'name') setSiteSortDir((d) => d === 'desc' ? 'asc' : 'desc');
                        else { setSiteSort('name'); setSiteSortDir('asc'); }
                      }}>
                      A – Z
                      {siteSort === 'name' && (
                        <i className={`fa-light ${siteSortDir === 'asc' ? 'fa-arrow-down-a-z' : 'fa-arrow-up-z-a'}`} />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="fms-filter-bar__spacer" />
            <span className="fms-filter-bar__count">{filteredTanks.length} tank{filteredTanks.length !== 1 ? 's' : ''}</span>
          </div>

          {/* ── Card header ── */}
          <div className="fms-card__hd">
            <span className="fms-card__title">
              {groupBy === 'site' ? 'Tanks by Site' : 'Tanks by Type'}
            </span>
          </div>
          <div className="fms-card__body fms-card__body--flush">
            {filteredTanks.length === 0 ? (
              <div className="fms-empty-state">
                <i className="fa-light fa-gas-pump" />
                <span>{selectedSiteId ? 'No tanks at the selected site.' : 'No tanks configured yet.'}</span>
              </div>
            ) : groupBy === 'site' ? (
              siteGroups.map(([key, group]) => (
                <CollapsibleGroup key={key} icon="fa-location-dot" label={group.name}
                  count={group.tanks.length} criticalCount={critCount(group.tanks)}
                  summary={<GroupSummary tanks={group.tanks} />}>
                  {renderTankGrid(group.tanks)}
                </CollapsibleGroup>
              ))
            ) : (
              typeGroups.map((group) => (
                <CollapsibleGroup key={group.key} icon={group.icon} label={group.label}
                  count={group.tanks.length} criticalCount={critCount(group.tanks)}
                  summary={<GroupSummary tanks={group.tanks} />}>
                  {renderTankGrid(group.tanks)}
                </CollapsibleGroup>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Tab: Map View ── */}
      {activeTab === 'map' && (
        <div className="fms-card">
          <div className="fms-card__hd">
            <span className="fms-card__title"><i className="fa-light fa-map" /> Mobile Tanker Locations</span>
            <span className="fms-card__count">{mobileTanks.length} tanker{mobileTanks.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="fms-card__body fms-card__body--map">
            {mobileTanks.length === 0 ? (
              <div className="fms-empty-state">
                <i className="fa-light fa-truck-moving" />
                <span>No mobile tankers found in the current filter.</span>
              </div>
            ) : (
              <TankerMapTab mobileTanks={mobileTanks} />
            )}
          </div>
        </div>
      )}

      {/* ── Tank Detail Panel (shared SlidePanel — edge-to-edge) ── */}
      <SlidePanel
        open={!!selectedTank}
        onClose={() => setSelectedTank(null)}
        title={selectedTank?.name || 'Tank Details'}
        width={1000}
        headerActions={
          selectedTank && (
            <>
              {canHistory && (
                <button className="m365-action-link" onClick={() => handleViewTransactions(selectedTank)}>
                  <i className="fa-light fa-arrow-right-arrow-left" />
                  <span>View transactions</span>
                </button>
              )}
              {canEdit && (
                <button className="m365-action-link" onClick={handleEditTank}>
                  <i className="fa-light fa-pen-to-square" />
                  <span>Edit tank</span>
                </button>
              )}
              {canEdit && selectedTank.ptsId !== undefined && (
                <button className="m365-action-link" onClick={handleLinkPTS}>
                  <i className="fa-light fa-link" />
                  <span>Link PTS</span>
                </button>
              )}
            </>
          )
        }
      >
        {selectedTank && (
          <TankDetailPanel
            tank={selectedTank}
            liveStatus={selectedLiveStatus}
            connectionStatus={selectedConnection}
            onEdit={handleEditTank}
            onHistory={() => handleViewTransactions(selectedTank)}
            onLinkPTS={handleLinkPTS}
          />
        )}
      </SlidePanel>

      {/* ── Tank History Panel ── */}
      <SlidePanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title={selectedTank ? `Transactions — ${selectedTank.name}` : 'Transactions'}
        width={1100}
      >
        {historyOpen && selectedTank && (
          <TankHistoryPanel tankId={selectedTank.id} />
        )}
      </SlidePanel>

      {/* ── Edit Tank Panel ── */}
      <SlidePanel
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={selectedTank ? `Edit — ${selectedTank.name}` : 'Edit Tank'}
        width={720}
      >
        {editOpen && selectedTank && (
          <TankFormPanel
            mode="edit"
            tank={selectedTank}
            onSubmit={() => { setEditOpen(false); dispatch(fetchTanks()); }}
            onClose={() => setEditOpen(false)}
          />
        )}
      </SlidePanel>

      {/* ── PTS Link Panel ── */}
      <SlidePanel
        open={ptsLinkOpen}
        onClose={() => setPtsLinkOpen(false)}
        title={selectedTank ? `Link PTS — ${selectedTank.name}` : 'Link PTS Device'}
        width={900}
      >
        {ptsLinkOpen && selectedTank && (
          <PTSDeviceLinkPanel
            tank={selectedTank}
            onLinked={() => { setPtsLinkOpen(false); dispatch(fetchTanks()); }}
            onClose={() => setPtsLinkOpen(false)}
          />
        )}
      </SlidePanel>

      {/* ── Updating overlay ── */}
      {refreshing && (
        <div className="fms-updating-overlay">
          <div className="fms-updating-overlay__box">
            <LoadIndicator visible={true} />
            <span>Updating…</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTankStockDashboard;
