/**
 * File: HeaderStockFilters.js
 * Purpose: Command-bar style filter panel for tank stock pages — segment pills, custom
 *          date-range picker with two-month calendar, and custom multi-select dropdowns.
 * Dependencies: react, react-redux, StockFilterContext, redux actions.
 * Last Modified: 2026-03-05
 *
 * Key Functions/Components:
 * - HeaderStockFilters: Full filter bar with date pills, calendar, site/tank/user selects.
 * - CalendarDropdown: Two-month inline calendar range picker.
 * - MultiSelectDropdown: Searchable checkbox list with optional site grouping.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchSiteList } from "../../../../redux/actions/siteActions";
import { fetchTanks } from "../../../../redux/actions/tankActions";
import { fetchUsersForFilter } from "../../../../redux/actions/userActions";
import { useStockFilters } from "../context/StockFilterContext";
import notify from "devextreme/ui/notify";
import PropTypes from "prop-types";
import "./HeaderStockFilters.scss";

// ── CONSTANTS ─────────────────────────────────────────────────────────────────

const QUICK_DATE_RANGES = [
  { key: "today",     label: "Today"    },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7",     label: "Last 7D"  },
  { key: "last30",    label: "Last 30D" },
];

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];

// ── HELPERS ───────────────────────────────────────────────────────────────────

const toDateKey = (d) => {
  const v = new Date(d);
  return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,"0")}-${String(v.getDate()).padStart(2,"0")}`;
};
const toStartOfDay = (d) => { const v = new Date(d); v.setHours(0,0,0,0);       return v; };
const toEndOfDay   = (d) => { const v = new Date(d); v.setHours(23,59,59,999);  return v; };
const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });
};

// ── CHECK ICON ────────────────────────────────────────────────────────────────

const CheckIcon = () => (
  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ── CALENDAR MONTH ────────────────────────────────────────────────────────────

const CalendarMonth = ({
  viewDate, fromDate, toDate,
  onPickDay, onNav,
  showLeftNav, showRightNav,
  showFooter, pickStep, onCancel, onConfirm,
}) => {
  const today   = new Date(); today.setHours(0,0,0,0);
  const year    = viewDate.getFullYear();
  const month   = viewDate.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const from = fromDate ? (() => { const v = new Date(fromDate); v.setHours(0,0,0,0); return v; })() : null;
  const to   = toDate   ? (() => { const v = new Date(toDate);   v.setHours(0,0,0,0); return v; })() : null;

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }

  const dayClass = (t) => {
    if (!t) return "hsf-cal-day hsf-cal-empty";
    t = new Date(t); t.setHours(0,0,0,0);
    let cls = "hsf-cal-day";
    if (t.getTime() === today.getTime()) cls += " today";
    if (from && to && t.getTime() === from.getTime() && t.getTime() === to.getTime()) cls += " selected";
    else if (from && t.getTime() === from.getTime()) cls += " range-start";
    else if (to   && t.getTime() === to.getTime())   cls += " range-end";
    else if (from && to && t > from && t < to)       cls += " in-range";
    return cls;
  };

  return (
    <div className="hsf-cal-month">
      <div className="hsf-cal-month-header">
        {showLeftNav
          ? <button className="hsf-cal-nav" onClick={() => onNav(-1)} type="button">
              <i className="fa-light fa-chevron-left" />
            </button>
          : <div style={{ width: 24 }} />}
        <span className="hsf-cal-month-name">{MONTH_NAMES[month]} {year}</span>
        {showRightNav
          ? <button className="hsf-cal-nav" onClick={() => onNav(1)} type="button">
              <i className="fa-light fa-chevron-right" />
            </button>
          : <div style={{ width: 24 }} />}
      </div>
      <div className="hsf-cal-grid">
        {DAY_NAMES.map(d => <div key={d} className="hsf-cal-dow">{d}</div>)}
        {cells.map((t, i) => (
          <div
            key={i}
            className={dayClass(t)}
            onClick={t ? () => onPickDay(t.getFullYear(), t.getMonth(), t.getDate()) : undefined}
          >
            {t ? t.getDate() : null}
          </div>
        ))}
      </div>
      {showFooter && (
        <div className="hsf-cal-footer">
          <span className="hsf-cal-step-hint">
            {pickStep === 0
              ? <>Pick <em>start</em> date</>
              : <>Pick <em>end</em> date</>}
          </span>
          <button className="hsf-btn hsf-btn-reset" style={{ fontSize: 11, padding: "4px 10px" }} onClick={onCancel} type="button">
            Cancel
          </button>
          <button className="hsf-btn hsf-btn-apply" style={{ fontSize: 11, padding: "4px 12px" }} onClick={onConfirm} type="button">
            Apply
          </button>
        </div>
      )}
    </div>
  );
};

// ── MULTI-SELECT DROPDOWN ─────────────────────────────────────────────────────

const MultiSelectDropdown = ({
  items,           // [{ id, label, siteId? }]
  selectedIds,
  onToggle,
  onClear,
  searchValue,
  onSearchChange,
  placeholder,
  groupBySite,     // boolean
  sites,           // only needed when groupBySite=true
}) => {
  const filtered = items.filter(
    (i) => !searchValue || i.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  const renderItem = (item) => {
    const isSel = selectedIds.includes(item.id);
    return (
      <div
        key={item.id}
        className={`hsf-dropdown-item${isSel ? " selected" : ""}`}
        onClick={() => onToggle(item.id)}
      >
        <span className="hsf-check">{isSel && <CheckIcon />}</span>
        <span className="hsf-item-label">{item.label}</span>
      </div>
    );
  };

  let body;
  if (groupBySite && sites && sites.length > 0) {
    const siteIds = [...new Set(filtered.map(i => i.siteId))];
    body = siteIds.map((sid, gi) => {
      const site    = sites.find(s => s.id === sid);
      const siteName = site?.name || `Site ${sid}`;
      const group   = filtered.filter(i => i.siteId === sid);
      if (group.length === 0) return null;
      return (
        <React.Fragment key={sid}>
          {gi > 0 && <div className="hsf-dropdown-divider" />}
          {siteIds.length > 1 && (
            <div className="hsf-dropdown-group-label">{siteName}</div>
          )}
          {group.map(renderItem)}
        </React.Fragment>
      );
    });
  } else {
    body = filtered.map(renderItem);
  }

  return (
    <>
      <div className="hsf-dropdown-search">
        <i className="fa-light fa-magnifying-glass" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          autoFocus
        />
      </div>
      <div className="hsf-dropdown-list">
        {filtered.length === 0
          ? <div className="hsf-dropdown-empty">No results</div>
          : body}
      </div>
      <div className="hsf-dropdown-footer">
        <span className="hsf-dropdown-footer-count">{selectedIds.length} selected</span>
        {selectedIds.length > 0 && (
          <span className="hsf-dropdown-footer-clear" onClick={onClear}>Clear all</span>
        )}
      </div>
    </>
  );
};

// ── SELECT BUTTON ─────────────────────────────────────────────────────────────

const SelectButton = ({ icon, placeholder, selectedItems, count, isOpen, onClick, children }) => (
  <div className={`hsf-select-btn${isOpen ? " open" : ""}`} onClick={onClick}>
    <i className={`hsf-select-icon fa-light ${icon}`} />
    <span className={`hsf-select-text${selectedItems === null ? " placeholder" : ""}`}>
      {selectedItems ?? placeholder}
    </span>
    {count > 1 && <span className="hsf-select-count">{count}</span>}
    <i className="hsf-select-caret fa-light fa-chevron-down" />
    {children}
  </div>
);

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────

const HeaderStockFilters = ({ showUserFilter = false, onApplyFilters }) => {
  const dispatch = useDispatch();
  const {
    startDate, endDate,
    selectedSiteIds, selectedTankIds, selectedUserIds,
    setStartDate, setEndDate,
    setSelectedSiteIds, setSelectedTankIds, setSelectedUserIds,
    resetFilters,
  } = useStockFilters();

  const sites  = useSelector((state) => state.site?.sites  || []);
  const tanks  = useSelector((state) => state.tank?.tanks  || []);
  const users  = useSelector((state) => state.user?.usersForFilter || []);

  // ── dropdown visibility ──
  const [calOpen,  setCalOpen]  = useState(false);
  const [siteOpen, setSiteOpen] = useState(false);
  const [tankOpen, setTankOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  // ── calendar state ──
  const [calViewLeft,  setCalViewLeft]  = useState(() => {
    const d = startDate ? new Date(startDate) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [pickStep, setPickStep] = useState(0); // 0=pick start, 1=pick end

  // ── search state ──
  const [siteSearch, setSiteSearch] = useState("");
  const [tankSearch, setTankSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const overlayRef = useRef(null);

  // ── derived data ──────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchSiteList());
    dispatch(fetchTanks());
    if (showUserFilter) dispatch(fetchUsersForFilter());
  }, [dispatch, showUserFilter]);

  const filteredTanks = useMemo(() => {
    if (!selectedSiteIds || selectedSiteIds.length === 0) return tanks;
    return tanks.filter((t) => selectedSiteIds.includes(t.siteId));
  }, [tanks, selectedSiteIds]);

  // Invalidate tank selection when site changes
  useEffect(() => {
    if (!selectedSiteIds || !selectedTankIds) return;
    if (selectedSiteIds.length > 0 && selectedTankIds.length > 0) {
      const valid = selectedTankIds.filter((id) => filteredTanks.some((t) => t.id === id));
      if (valid.length !== selectedTankIds.length) setSelectedTankIds(valid);
    }
  }, [selectedSiteIds, selectedTankIds, filteredTanks, setSelectedTankIds]);

  // ── items arrays for dropdowns ──
  const siteItems = useMemo(() => sites.map((s) => ({ id: s.id, label: s.name })), [sites]);
  const tankItems = useMemo(() =>
    filteredTanks.map((t) => ({ id: t.id, label: t.name, siteId: t.siteId })), [filteredTanks]);
  const userItems = useMemo(() => users.map((u) => ({ id: u.id, label: u.name || u.username || u.email || String(u.id) })), [users]);

  const calViewRight = useMemo(
    () => new Date(calViewLeft.getFullYear(), calViewLeft.getMonth() + 1, 1),
    [calViewLeft]
  );

  // ── active quick range ──
  const activeQuick = useMemo(() => {
    if (!startDate || !endDate) return "";
    const todayKey     = toDateKey(new Date());
    const startKey     = toDateKey(startDate);
    const endKey       = toDateKey(endDate);
    const yest         = new Date(); yest.setDate(yest.getDate() - 1);
    const yestKey      = toDateKey(yest);
    const l7           = new Date(); l7.setDate(l7.getDate() - 6);
    const l30          = new Date(); l30.setDate(l30.getDate() - 29);
    if (startKey === todayKey  && endKey === todayKey)  return "today";
    if (startKey === yestKey   && endKey === yestKey)   return "yesterday";
    if (startKey === toDateKey(l7)  && endKey === todayKey) return "last7";
    if (startKey === toDateKey(l30) && endKey === todayKey) return "last30";
    return "";
  }, [startDate, endDate]);

  // ── select button labels ──
  const siteLabel = useMemo(() => {
    if (!selectedSiteIds || selectedSiteIds.length === 0) return null;
    if (selectedSiteIds.length === 1) return sites.find(s => s.id === selectedSiteIds[0])?.name ?? null;
    return "Sites";
  }, [selectedSiteIds, sites]);

  const tankLabel = useMemo(() => {
    if (!selectedTankIds || selectedTankIds.length === 0) return null;
    if (selectedTankIds.length === 1) return filteredTanks.find(t => t.id === selectedTankIds[0])?.name ?? null;
    return "Tanks";
  }, [selectedTankIds, filteredTanks]);

  const userLabel = useMemo(() => {
    if (!selectedUserIds || selectedUserIds.length === 0) return null;
    if (selectedUserIds.length === 1) return users.find(u => u.id === selectedUserIds[0])?.name ?? null;
    return "Users";
  }, [selectedUserIds, users]);

  // ── handlers ──────────────────────────────────────────────────────────────

  const closeAll = useCallback(() => {
    setCalOpen(false);
    setSiteOpen(false);
    setTankOpen(false);
    setUserOpen(false);
  }, []);

  const handleQuickDate = useCallback((key) => {
    const base = new Date(); let s = new Date(base), e = new Date(base);
    if (key === "yesterday") { s.setDate(s.getDate()-1); e.setDate(e.getDate()-1); }
    else if (key === "last7")  { s.setDate(s.getDate()-6); }
    else if (key === "last30") { s.setDate(s.getDate()-29); }
    setStartDate(toStartOfDay(s));
    setEndDate(toEndOfDay(e));
  }, [setStartDate, setEndDate]);

  const handlePickDay = useCallback((y, m, d) => {
    const clicked = new Date(y, m, d); clicked.setHours(0,0,0,0);
    if (pickStep === 0) {
      setStartDate(toStartOfDay(clicked));
      setEndDate(toEndOfDay(clicked));
      setPickStep(1);
    } else {
      if (clicked < startDate) {
        setEndDate(toEndOfDay(new Date(startDate)));
        setStartDate(toStartOfDay(clicked));
      } else {
        setEndDate(toEndOfDay(clicked));
      }
      setPickStep(0);
    }
  }, [pickStep, startDate, setStartDate, setEndDate]);

  const handleCalNav = useCallback((dir) => {
    setCalViewLeft(prev => new Date(prev.getFullYear(), prev.getMonth() + dir, 1));
  }, []);

  const toggleCal = useCallback((e) => {
    e.stopPropagation();
    if (!calOpen) {
      closeAll();
      const base = startDate ? new Date(startDate) : new Date();
      setCalViewLeft(new Date(base.getFullYear(), base.getMonth(), 1));
      setPickStep(0);
    }
    setCalOpen(prev => !prev);
  }, [calOpen, startDate, closeAll]);

  const toggleSite = useCallback((e) => {
    e.stopPropagation();
    if (!siteOpen) { closeAll(); setSiteSearch(""); }
    setSiteOpen(prev => !prev);
  }, [siteOpen, closeAll]);

  const toggleTank = useCallback((e) => {
    e.stopPropagation();
    if (!tankOpen) { closeAll(); setTankSearch(""); }
    setTankOpen(prev => !prev);
  }, [tankOpen, closeAll]);

  const toggleUser = useCallback((e) => {
    e.stopPropagation();
    if (!userOpen) { closeAll(); setUserSearch(""); }
    setUserOpen(prev => !prev);
  }, [userOpen, closeAll]);

  const handleSiteToggle = useCallback((id) => {
    const next = selectedSiteIds.includes(id)
      ? selectedSiteIds.filter(x => x !== id)
      : [...selectedSiteIds, id];
    setSelectedSiteIds(next);
    // clear tanks outside new site selection
    if (next.length > 0) {
      const valid = selectedTankIds.filter(tid => tanks.some(t => t.id === tid && next.includes(t.siteId)));
      setSelectedTankIds(valid);
    }
  }, [selectedSiteIds, selectedTankIds, tanks, setSelectedSiteIds, setSelectedTankIds]);

  const handleTankToggle = useCallback((id) => {
    setSelectedTankIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, [setSelectedTankIds]);

  const handleUserToggle = useCallback((id) => {
    setSelectedUserIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, [setSelectedUserIds]);

  const handleApply = useCallback(() => {
    if (!startDate || !endDate) {
      notify({ message: "Please select both start and end dates", type: "warning", displayTime: 3000 });
      return;
    }
    if (startDate > endDate) {
      notify({ message: "Start date cannot be greater than end date.", type: "warning", displayTime: 3000 });
      return;
    }
    closeAll();
    if (onApplyFilters) onApplyFilters();
  }, [startDate, endDate, closeAll, onApplyFilters]);

  const handleReset = useCallback(() => {
    resetFilters();
    closeAll();
    if (onApplyFilters) onApplyFilters();
  }, [resetFilters, closeAll, onApplyFilters]);

  const anyOpen = calOpen || siteOpen || tankOpen || userOpen;

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="header-stock-filters">
      {/* Overlay closes all dropdowns on outside click */}
      {anyOpen && (
        <div className="hsf-overlay" ref={overlayRef} onClick={closeAll} />
      )}

      <div className="hsf-filter-bar" onClick={(e) => e.stopPropagation()}>

        {/* ── Quick date pills ── */}
        <div className="hsf-seg-pills">
          {QUICK_DATE_RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              className={`hsf-seg-pill${activeQuick === r.key ? " active" : ""}`}
              onClick={() => handleQuickDate(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="hsf-bar-divider" />

        {/* ── Date range button + calendar ── */}
        <div className={`hsf-date-range-btn${calOpen ? " open" : ""}`} onClick={toggleCal}>
          <i className="fa-light fa-calendar hsf-date-icon" />
          <span className="hsf-date-val">{fmtDate(startDate)}</span>
          <span className="hsf-date-sep">→</span>
          <span className="hsf-date-val">{fmtDate(endDate)}</span>
          <i className="fa-light fa-chevron-down hsf-select-caret" />

          {/* Calendar dropdown */}
          {calOpen && (
            <div className="hsf-cal-dropdown" onClick={(e) => e.stopPropagation()}>
              <div className="hsf-cal-months-row">
                <CalendarMonth
                  viewDate={calViewLeft}
                  fromDate={startDate} toDate={endDate}
                  pickStep={pickStep}
                  onPickDay={handlePickDay}
                  onNav={handleCalNav}
                  showLeftNav showRightNav={false}
                  showFooter={false}
                />
                <div className="hsf-cal-separator" />
                <CalendarMonth
                  viewDate={calViewRight}
                  fromDate={startDate} toDate={endDate}
                  pickStep={pickStep}
                  onPickDay={handlePickDay}
                  onNav={handleCalNav}
                  showLeftNav={false} showRightNav
                  showFooter
                  onCancel={closeAll}
                  onConfirm={() => { setCalOpen(false); }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="hsf-bar-divider" />

        {/* ── Site multi-select ── */}
        <SelectButton
          icon="fa-location-dot"
          placeholder="All Sites"
          selectedItems={siteLabel}
          count={selectedSiteIds?.length ?? 0}
          isOpen={siteOpen}
          onClick={toggleSite}
        >
          {siteOpen && (
            <div className="hsf-dropdown-menu open" onClick={(e) => e.stopPropagation()}>
              <MultiSelectDropdown
                items={siteItems}
                selectedIds={selectedSiteIds ?? []}
                onToggle={handleSiteToggle}
                onClear={() => { setSelectedSiteIds([]); setSelectedTankIds([]); }}
                searchValue={siteSearch}
                onSearchChange={setSiteSearch}
                placeholder="Search sites…"
              />
            </div>
          )}
        </SelectButton>

        {/* ── Tank multi-select ── */}
        <SelectButton
          icon="fa-database"
          placeholder="All Tanks"
          selectedItems={tankLabel}
          count={selectedTankIds?.length ?? 0}
          isOpen={tankOpen}
          onClick={toggleTank}
        >
          {tankOpen && (
            <div className="hsf-dropdown-menu open" onClick={(e) => e.stopPropagation()}>
              <MultiSelectDropdown
                items={tankItems}
                selectedIds={selectedTankIds ?? []}
                onToggle={handleTankToggle}
                onClear={() => setSelectedTankIds([])}
                searchValue={tankSearch}
                onSearchChange={setTankSearch}
                placeholder="Search tanks…"
                groupBySite={selectedSiteIds?.length !== 1}
                sites={sites}
              />
            </div>
          )}
        </SelectButton>

        {/* ── User multi-select (optional) ── */}
        {showUserFilter && (
          <SelectButton
            icon="fa-user"
            placeholder="All Users"
            selectedItems={userLabel}
            count={selectedUserIds?.length ?? 0}
            isOpen={userOpen}
            onClick={toggleUser}
          >
            {userOpen && (
              <div className="hsf-dropdown-menu open" onClick={(e) => e.stopPropagation()}>
                <MultiSelectDropdown
                  items={userItems}
                  selectedIds={selectedUserIds ?? []}
                  onToggle={handleUserToggle}
                  onClear={() => setSelectedUserIds([])}
                  searchValue={userSearch}
                  onSearchChange={setUserSearch}
                  placeholder="Search users…"
                />
              </div>
            )}
          </SelectButton>
        )}

        <div className="hsf-bar-spacer" />

        {/* ── Reset ── */}
        <button className="hsf-btn hsf-btn-reset" type="button" onClick={handleReset}>
          <i className="fa-light fa-rotate-left" />
          Reset
        </button>

        {/* ── Apply ── */}
        <button className="hsf-btn hsf-btn-apply" type="button" onClick={handleApply}>
          <i className="fa-light fa-filter" />
          Apply
        </button>

      </div>
    </div>
  );
};

HeaderStockFilters.propTypes = {
  showUserFilter: PropTypes.bool,
  onApplyFilters: PropTypes.func,
};

export default HeaderStockFilters;
