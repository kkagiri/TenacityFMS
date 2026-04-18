/**
 * File: MultiVehicleSearchableSelector.js
 * Purpose: Provide portal-based multi-vehicle search and selection for forms that need reliable remote lookups.
 * Dependencies: React, ReactDOM, vehicleSearchActions, axiosInstance
 * Last Modified: 2026-04-18
 *
 * Key Functions:
 * - performSearch(): queries backend vehicle search and normalizes dropdown results
 * - handleVehicleSelect(): appends a vehicle to the selected tag list and emits ids
 * - handleRemoveVehicle(): removes a selected vehicle while preserving the remaining selections
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { quickSearchVehicles } from "../../redux/actions/vehicleSearchActions";
import axiosInstance from "../../api/axiosInstance";
import "./SearchableSelector.css";

const normalizeVehicleIds = (value) => {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) =>
            typeof item === "object" && item !== null ? item.vehicleId ?? item.VehicleId : item
        )
        .filter((item) => item !== undefined && item !== null && item !== "");
};

const normalizeVehiclePayload = (payload) => {
    if (!payload) return null;
    if (payload.vehicleId || payload.VehicleId) return payload;

    const wrapped = payload.data || payload.Data || payload.vehicleDto || payload.VehicleDto;
    if (wrapped?.vehicleId || wrapped?.VehicleId) return wrapped;

    return null;
};

const toVehicleDisplay = (vehicle) => {
    if (!vehicle) return "";

    const code =
        vehicle.hyoungNo ||
        vehicle.HyoungNo ||
        vehicle.numberPlate ||
        vehicle.NumberPlate ||
        `#${vehicle.vehicleId || vehicle.VehicleId}`;
    const name = vehicle.vehicleName || vehicle.VehicleName || "";

    return name ? `${code} - ${name}` : code;
};

const normalizeVehicleOption = (payload) => {
    const vehicle = normalizeVehiclePayload(payload);
    if (!vehicle) return null;

    const vehicleId = vehicle.vehicleId ?? vehicle.VehicleId;
    if (vehicleId === undefined || vehicleId === null || vehicleId === "") {
        return null;
    }

    return {
        vehicleId,
        hyoungNo: vehicle.hyoungNo ?? vehicle.HyoungNo ?? "",
        numberPlate: vehicle.numberPlate ?? vehicle.NumberPlate ?? "",
        vehicleName: vehicle.vehicleName ?? vehicle.VehicleName ?? "",
        siteName: vehicle.siteName ?? vehicle.SiteName ?? "",
        displayName: toVehicleDisplay(vehicle),
    };
};

const mergeVehicleOptions = (...collections) => {
    const merged = [];
    const seen = new Set();

    collections.forEach((collection) => {
        (Array.isArray(collection) ? collection : []).forEach((item) => {
            const normalized = normalizeVehicleOption(item);
            if (!normalized) {
                return;
            }

            const key = String(normalized.vehicleId);
            if (seen.has(key)) {
                return;
            }

            seen.add(key);
            merged.push(normalized);
        });
    });

    return merged;
};

const orderVehicleOptions = (ids, vehicles) => {
    const byId = new Map(
        (Array.isArray(vehicles) ? vehicles : []).map((vehicle) => [String(vehicle.vehicleId), vehicle])
    );

    return ids.map((id) => byId.get(String(id))).filter(Boolean);
};

const arraysEqual = (left, right) => {
    if (left === right) return true;
    if (!Array.isArray(left) || !Array.isArray(right)) return false;
    if (left.length !== right.length) return false;

    for (let index = 0; index < left.length; index += 1) {
        if (String(left[index]) !== String(right[index])) {
            return false;
        }
    }

    return true;
};

const MultiVehicleSearchableSelector = ({
    value,
    onValueChanged,
    placeholder = "Search and add vehicles...",
    disabled = false,
    isValid = true,
    validationError = null,
    width = "100%",
}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [vehicles, setVehicles] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedVehicles, setSelectedVehicles] = useState([]);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

    const searchTimeoutRef = useRef(null);
    const containerRef = useRef(null);
    const dropdownRef = useRef(null);
    const selectedVehiclesRef = useRef([]);

    const selectedIds = useMemo(() => normalizeVehicleIds(value), [value]);
    const selectedIdSet = useMemo(
        () => new Set(selectedIds.map((item) => String(item))),
        [selectedIds]
    );

    const emitChange = useCallback(
        (nextVehicles) => {
            onValueChanged?.({ value: nextVehicles.map((vehicle) => vehicle.vehicleId) });
        },
        [onValueChanged]
    );

    const updateDropdownPosition = useCallback(() => {
        if (!containerRef.current) {
            return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        setDropdownPos({
            top: rect.bottom + 2,
            left: rect.left,
            width: rect.width,
        });
    }, []);

    const performSearch = useCallback(
        async (term) => {
            if (!term || term.trim().length < 2) {
                setVehicles([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setShowDropdown(true);

            try {
                const result = await quickSearchVehicles(term.trim(), 50);
                const normalized = mergeVehicleOptions(Array.isArray(result?.data) ? result.data : []);

                setVehicles(
                    normalized.filter((vehicle) => !selectedIdSet.has(String(vehicle.vehicleId)))
                );
            } catch (error) {
                console.error("Error searching vehicles:", error);
                setVehicles([]);
            } finally {
                setIsLoading(false);
            }
        },
        [selectedIdSet]
    );

    const handleSearchTermChange = useCallback(
        (inputValue) => {
            setSearchTerm(inputValue);
            setShowDropdown(true);

            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }

            if (!inputValue || inputValue.trim().length < 2) {
                setIsLoading(false);
                setVehicles([]);
                return;
            }

            setIsLoading(true);
            searchTimeoutRef.current = setTimeout(() => {
                performSearch(inputValue);
            }, 200);
        },
        [performSearch]
    );

    const handleVehicleSelect = useCallback(
        (vehicle) => {
            if (!vehicle || selectedIdSet.has(String(vehicle.vehicleId))) {
                return;
            }

            const nextSelected = [...selectedVehiclesRef.current, vehicle];
            setSelectedVehicles(nextSelected);
            emitChange(nextSelected);
            setSearchTerm("");
            setVehicles([]);
            setShowDropdown(false);
            setIsLoading(false);
        },
        [emitChange, selectedIdSet]
    );

    const handleRemoveVehicle = useCallback(
        (vehicleId) => {
            const nextSelected = selectedVehiclesRef.current.filter(
                (vehicle) => String(vehicle.vehicleId) !== String(vehicleId)
            );

            setSelectedVehicles(nextSelected);
            emitChange(nextSelected);
        },
        [emitChange]
    );

    const handleClearSearch = useCallback(
        (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
                searchTimeoutRef.current = null;
            }

            setSearchTerm("");
            setVehicles([]);
            setIsLoading(false);
            setShowDropdown(false);
        },
        []
    );

    const handleInputFocus = useCallback(() => {
        setShowDropdown(true);
        updateDropdownPosition();

        if (searchTerm.trim().length >= 2 && vehicles.length === 0 && !isLoading) {
            performSearch(searchTerm);
        }
    }, [isLoading, performSearch, searchTerm, updateDropdownPosition, vehicles.length]);

    const handleKeyDown = useCallback(
        (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                if (vehicles.length > 0) {
                    handleVehicleSelect(vehicles[0]);
                }
            }
        },
        [handleVehicleSelect, vehicles]
    );

    useEffect(() => {
        selectedVehiclesRef.current = selectedVehicles;
    }, [selectedVehicles]);

    useEffect(() => {
        const nextIds = normalizeVehicleIds(value);

        if (nextIds.length === 0) {
            setSelectedVehicles([]);
            return;
        }

        const current = selectedVehiclesRef.current;
        const orderedCurrent = orderVehicleOptions(nextIds, current);
        const currentIds = orderedCurrent.map((vehicle) => vehicle.vehicleId);

        if (!arraysEqual(currentIds, nextIds)) {
            setSelectedVehicles(orderedCurrent);
        }

        const missingIds = nextIds.filter(
            (id) => !current.some((vehicle) => String(vehicle.vehicleId) === String(id))
        );

        if (missingIds.length === 0) {
            return;
        }

        let cancelled = false;

        const hydrateSelectedVehicles = async () => {
            try {
                const responses = await Promise.all(
                    missingIds.map((vehicleId) => axiosInstance.get(`/vehicle/${vehicleId}`))
                );

                if (cancelled) {
                    return;
                }

                const hydrated = responses
                    .map((response) => normalizeVehicleOption(response?.data))
                    .filter(Boolean);

                const merged = orderVehicleOptions(
                    nextIds,
                    mergeVehicleOptions(selectedVehiclesRef.current, hydrated)
                );

                setSelectedVehicles(merged);
            } catch (error) {
                console.warn("Unable to hydrate selected vehicles:", error);
            }
        };

        hydrateSelectedVehicles();

        return () => {
            cancelled = true;
        };
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const inContainer = containerRef.current && containerRef.current.contains(event.target);
            const inDropdown = dropdownRef.current && dropdownRef.current.contains(event.target);

            if (!inContainer && !inDropdown) {
                setShowDropdown(false);
            }
        };

        if (showDropdown) {
            document.addEventListener("mousedown", handleClickOutside);
            updateDropdownPosition();
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showDropdown, updateDropdownPosition]);

    useEffect(() => {
        if (!showDropdown) {
            return undefined;
        }

        const handleReposition = () => updateDropdownPosition();
        window.addEventListener("scroll", handleReposition, true);
        window.addEventListener("resize", handleReposition);

        return () => {
            window.removeEventListener("scroll", handleReposition, true);
            window.removeEventListener("resize", handleReposition);
        };
    }, [showDropdown, updateDropdownPosition]);

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="searchable-selector searchable-selector--multi"
            style={{ width, position: "relative" }}
        >
            {selectedVehicles.length > 0 && (
                <div className="searchable-selector__selection">
                    {selectedVehicles.map((vehicle) => (
                        <span key={vehicle.vehicleId} className="searchable-selector__chip">
                            <span className="searchable-selector__chip-label">{vehicle.displayName}</span>
                            {!disabled && (
                                <button
                                    type="button"
                                    className="searchable-selector__chip-remove"
                                    onClick={() => handleRemoveVehicle(vehicle.vehicleId)}
                                    aria-label={`Remove ${vehicle.displayName}`}
                                >
                                    <i className="fa-light fa-xmark" />
                                </button>
                            )}
                        </span>
                    ))}
                </div>
            )}

            <div
                className={`dx-texteditor dx-editor-outlined dx-texteditor-empty dx-dropdowneditor dx-selectbox dx-widget ${!isValid ? "dx-invalid" : ""}`}
                style={{ border: "1px solid #ddd", borderRadius: "4px" }}
            >
                <div className="dx-texteditor-container">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(event) => handleSearchTermChange(event.target.value)}
                        onFocus={handleInputFocus}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={disabled}
                        className="dx-texteditor-input"
                        autoComplete="off"
                        style={{
                            backgroundColor: disabled ? "#f8f9fa" : "white",
                            paddingRight: "40px",
                            border: "none",
                            outline: "none",
                            pointerEvents: "auto",
                            cursor: disabled ? "not-allowed" : "text",
                            zIndex: 1,
                        }}
                    />
                    <div className="dx-texteditor-buttons-container">
                        {searchTerm && (
                            <div
                                className="dx-button dx-button-normal dx-button-mode-text dx-widget"
                                style={{
                                    backgroundColor: "transparent",
                                    marginRight: "4px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                                onClick={handleClearSearch}
                                title="Clear search"
                            >
                                <div className="dx-button-content">
                                    <i className="fa-light fa-times" style={{ color: "#666", fontSize: "14px" }} />
                                </div>
                            </div>
                        )}

                        {isLoading ? (
                            <div className="dx-button dx-button-normal dx-button-mode-text dx-widget" style={{ backgroundColor: "transparent" }}>
                                <div className="dx-button-content">
                                    <div className="dx-loadindicator dx-widget dx-loadindicator-16">
                                        <div className="dx-loadindicator-wrapper">
                                            <div className="dx-loadindicator-content">
                                                <div className="dx-loadindicator-icon" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="dx-button dx-button-normal dx-button-mode-text dx-widget" style={{ backgroundColor: "transparent" }}>
                                <div className="dx-button-content">
                                    <i
                                        className="dx-icon dx-icon-spindown"
                                        style={{
                                            color: "#666",
                                            fontSize: "12px",
                                            transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)",
                                            transition: "transform 0.2s ease",
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {!isValid && validationError && (
                <div className="dx-invalid-message">
                    <div className="dx-invalid-message-content">{validationError.message}</div>
                </div>
            )}

            {showDropdown &&
                ReactDOM.createPortal(
                    <div
                        ref={dropdownRef}
                        className="searchable-selector searchable-selector__dropdown"
                        style={{
                            position: "fixed",
                            zIndex: 110003,
                            top: dropdownPos.top,
                            left: dropdownPos.left,
                            width: dropdownPos.width,
                        }}
                        onMouseDown={(event) => event.preventDefault()}
                    >
                        <div className="searchable-selector__dropdown-content">
                            {selectedVehicles.length > 0 && (
                                <div className="searchable-selector__dropdown-meta">
                                    {selectedVehicles.length} vehicle{selectedVehicles.length === 1 ? "" : "s"} selected
                                </div>
                            )}
                            <div className="searchable-selector__dropdown-scroll">
                                <div className="dx-list dx-widget">
                                    {vehicles.length > 0 ? (
                                        vehicles.map((vehicle, index) => (
                                            <div
                                                key={vehicle.vehicleId}
                                                className="dx-list-item"
                                                onClick={() => handleVehicleSelect(vehicle)}
                                                onMouseEnter={(event) => event.currentTarget.classList.add("dx-state-hover")}
                                                onMouseLeave={(event) => event.currentTarget.classList.remove("dx-state-hover")}
                                                style={{
                                                    cursor: "pointer",
                                                    borderBottom: index !== vehicles.length - 1 ? "1px solid #e6e6e6" : "none",
                                                }}
                                            >
                                                <div className="dx-list-item-content" style={{ padding: "12px 16px", minHeight: "50px" }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <div style={{ flex: 1 }}>
                                                            <div className="searchable-selector__result-title">
                                                                <span style={{ fontWeight: 600, color: "#337ab7" }}>{vehicle.hyoungNo}</span>
                                                                <span style={{ color: "#666" }}>{vehicle.vehicleName || vehicle.numberPlate}</span>
                                                            </div>
                                                        </div>
                                                        <div style={{ fontSize: "12px", color: "#999", textAlign: "right", marginLeft: "16px" }}>
                                                            {vehicle.siteName}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="dx-list-item">
                                            <div className="dx-list-item-content searchable-selector__empty-state">
                                                {isLoading ? (
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                                                        <div className="dx-loadindicator dx-widget dx-loadindicator-16">
                                                            <div className="dx-loadindicator-wrapper">
                                                                <div className="dx-loadindicator-content">
                                                                    <div className="dx-loadindicator-icon" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <span>Searching vehicles...</span>
                                                    </div>
                                                ) : searchTerm.trim().length < 2 ? (
                                                    "Type at least 2 characters to search vehicles"
                                                ) : (
                                                    "No vehicles found matching your search"
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
};

export default MultiVehicleSearchableSelector;