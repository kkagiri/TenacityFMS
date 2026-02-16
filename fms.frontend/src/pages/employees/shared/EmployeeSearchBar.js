/**
 * File: EmployeeSearchBar.js
 * Purpose: Provides global quick employee search with suggestion dropdown and detail navigation.
 * Dependencies: react-router-dom, redux actions, employee navigation helper.
 * Last Modified: 2026-02-16
 *
 * Key Components:
 * - EmployeeSearchBar(): Debounced search input that routes to employee details.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  quickSearchEmployees,
  searchEmployees,
} from "../../../redux/actions/employeeActions";
import { getEmployeeDetailsRoute } from "../utils/navigationHelper";
import "./EmployeeSearchBar.scss";

const normalizeEmployeePayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.Data)) return payload.Data;
  return [];
};

const EmployeeSearchBar = ({
  placeholder = "Quick search employees by name, work no, or phone...",
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const timeoutRef = useRef(null);
  const isMountedRef = useRef(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions]);

  const performSearch = useCallback(
    async (term) => {
      if (!term || term.trim().length < 2) {
        if (isMountedRef.current) {
          setSuggestions([]);
          setShowSuggestions(false);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);

      try {
        const quickResult = await quickSearchEmployees(term.trim(), 8);
        let matches = normalizeEmployeePayload(quickResult?.data);

        if (!matches.length) {
          const fallbackResult = await dispatch(
            searchEmployees(term.trim(), { limit: 8, active: true })
          );
          matches = normalizeEmployeePayload(fallbackResult?.data);
        }

        if (!isMountedRef.current) return;

        setSuggestions(matches);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      } catch (error) {
        if (!isMountedRef.current) return;
        setSuggestions([]);
        setShowSuggestions(true);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [dispatch]
  );

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [searchTerm, performSearch]);

  const navigateToEmployee = useCallback(
    (employeeId) => {
      if (!employeeId) return;
      setSearchTerm("");
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
      navigate(getEmployeeDetailsRoute(employeeId));
    },
    [navigate]
  );

  const onInputChange = useCallback((event) => {
    const value = event.target.value || "";
    setSearchTerm(value);

    if (!value) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
      setIsLoading(false);
    }
  }, []);

  const onKeyDown = useCallback(
    (event) => {
      if (!showSuggestions || !suggestions.length) return;

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
      } else if (event.key === "Enter") {
        event.preventDefault();
        const selectedEmployee =
          selectedIndex >= 0 ? suggestions[selectedIndex] : suggestions[0];
        if (selectedEmployee?.id) {
          navigateToEmployee(selectedEmployee.id);
        }
      } else if (event.key === "Escape") {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    },
    [navigateToEmployee, selectedIndex, showSuggestions, suggestions]
  );

  return (
    <div className="employee-search-bar" ref={containerRef}>
      <div className="employee-search-bar__input-wrap">
        <i className="fa-light fa-magnifying-glass employee-search-bar__icon"></i>
        <input
          type="text"
          value={searchTerm}
          placeholder={placeholder}
          className="employee-search-bar__input"
          onChange={onInputChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onKeyDown={onKeyDown}
          autoComplete="off"
        />
        {isLoading && (
          <i className="fa-light fa-loader employee-search-bar__loading"></i>
        )}
      </div>

      {showSuggestions && (
        <div className="employee-search-bar__dropdown">
          {suggestions.length > 0 ? (
            suggestions.map((employee, index) => (
              <button
                type="button"
                key={`${employee.id}-${index}`}
                className={`employee-search-bar__item ${
                  index === selectedIndex ? "employee-search-bar__item--active" : ""
                }`}
                onClick={() => navigateToEmployee(employee.id)}
              >
                <span className="employee-search-bar__item-name">
                  {employee.fullName || `Employee #${employee.id}`}
                </span>
                <span className="employee-search-bar__item-meta">
                  {employee.employeeWorkNo || employee.employeephoneNumber || "No code"}
                </span>
              </button>
            ))
          ) : (
            <div className="employee-search-bar__empty">
              No employees found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeSearchBar;
