import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";

/**
 * CustomDateTimePicker - A reusable custom date and time picker component
 * Similar to the one used in TransactionHistoryScreen
 *
 * @param {boolean} visible - Whether the picker is visible
 * @param {Date} value - The current date/time value
 * @param {function} onConfirm - Callback when date/time is confirmed (receives Date object)
 * @param {function} onCancel - Callback when picker is cancelled
 * @param {string} themeColor - Theme color for the picker (default: #2563eb)
 * @param {boolean} showTimePicker - Whether to show time picker after date (default: true)
 * @param {Date} maximumDate - Maximum selectable date (default: new Date())
 * @param {Date} minimumDate - Minimum selectable date (default: null)
 */
const CustomDateTimePicker = ({
  visible,
  value = new Date(),
  onConfirm,
  onCancel,
  themeColor = "#2563eb",
  showTimePicker = true,
  maximumDate = new Date(),
  minimumDate = null,
}) => {
  // State for date picker
  const [mode, setMode] = useState("date"); // "date" or "time"
  const [pickerYear, setPickerYear] = useState(value.getFullYear());
  const [pickerMonth, setPickerMonth] = useState(value.getMonth() + 1);
  const [pickerDay, setPickerDay] = useState(value.getDate());
  const [pickerHour, setPickerHour] = useState(value.getHours());
  const [pickerMinute, setPickerMinute] = useState(value.getMinutes());

  // Refs for scroll views to auto-scroll to selected values
  const hourScrollRef = useRef(null);
  const minuteScrollRef = useRef(null);

  // Reset picker values when modal becomes visible
  useEffect(() => {
    if (visible) {
      const initialDate = value || new Date();
      setPickerYear(initialDate.getFullYear());
      setPickerMonth(initialDate.getMonth() + 1);
      setPickerDay(initialDate.getDate());
      setPickerHour(initialDate.getHours());
      setPickerMinute(initialDate.getMinutes());
      setMode("date");
    }
  }, [visible, value]);

  // Auto-scroll to selected hour/minute when time picker shows
  useEffect(() => {
    if (mode === "time" && visible) {
      setTimeout(() => {
        hourScrollRef.current?.scrollTo({ y: pickerHour * 42, animated: true });
        minuteScrollRef.current?.scrollTo({ y: pickerMinute * 42, animated: true });
      }, 100);
    }
  }, [mode, visible, pickerHour, pickerMinute]);

  // Get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  // Get the first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month - 1, 1).getDay();
  };

  // Navigate calendar months
  const navigateMonth = (direction) => {
    let newMonth = pickerMonth + direction;
    let newYear = pickerYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    // Don't allow dates beyond maximumDate
    if (maximumDate) {
      const maxYear = maximumDate.getFullYear();
      const maxMonth = maximumDate.getMonth() + 1;
      if (newYear > maxYear || (newYear === maxYear && newMonth > maxMonth)) {
        return;
      }
    }

    // Don't allow dates before minimumDate
    if (minimumDate) {
      const minYear = minimumDate.getFullYear();
      const minMonth = minimumDate.getMonth() + 1;
      if (newYear < minYear || (newYear === minYear && newMonth < minMonth)) {
        return;
      }
    }

    setPickerYear(newYear);
    setPickerMonth(newMonth);

    // Reset day if it exceeds new month's days
    const daysInNewMonth = getDaysInMonth(newYear, newMonth);
    if (pickerDay > daysInNewMonth) {
      setPickerDay(daysInNewMonth);
    }
  };

  // Check if a day is selectable
  const isDaySelectable = (day) => {
    if (day <= 0) return false;

    const dateToCheck = new Date(pickerYear, pickerMonth - 1, day);
    dateToCheck.setHours(0, 0, 0, 0);

    if (maximumDate) {
      const maxDate = new Date(maximumDate);
      maxDate.setHours(0, 0, 0, 0);
      if (dateToCheck > maxDate) return false;
    }

    if (minimumDate) {
      const minDate = new Date(minimumDate);
      minDate.setHours(0, 0, 0, 0);
      if (dateToCheck < minDate) return false;
    }

    return true;
  };

  // Select a day from calendar
  const selectDay = (day) => {
    if (!isDaySelectable(day)) return;
    setPickerDay(day);
  };

  // Build calendar grid
  const calendarGrid = useMemo(() => {
    const daysInMonth = getDaysInMonth(pickerYear, pickerMonth);
    const firstDay = getFirstDayOfMonth(pickerYear, pickerMonth);
    const today = new Date();
    const grid = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      grid.push({ day: 0, disabled: true });
    }

    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
      const isSelectable = isDaySelectable(d);
      const isToday =
        d === today.getDate() &&
        pickerMonth === today.getMonth() + 1 &&
        pickerYear === today.getFullYear();
      grid.push({ day: d, disabled: !isSelectable, isToday });
    }

    return grid;
  }, [pickerYear, pickerMonth, maximumDate, minimumDate]);

  // Hour and minute options
  const hourOptions = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minuteOptions = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  // Handle confirm
  const handleConfirm = () => {
    const newDate = new Date(pickerYear, pickerMonth - 1, pickerDay, pickerHour, pickerMinute);
    onConfirm?.(newDate);
  };

  // Handle next to time picker
  const handleNextToTime = () => {
    if (showTimePicker) {
      setMode("time");
    } else {
      handleConfirm();
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setMode("date");
    onCancel?.();
  };

  // Handle back to date picker
  const handleBackToDate = () => {
    setMode("date");
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {mode === "date" ? "Select Date" : "Select Time"}
            </Text>
            <TouchableOpacity onPress={handleCancel}>
              <Icon name="times" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {mode === "date" ? (
            <>
              {/* Quick select buttons */}
              <View style={styles.quickSelectRow}>
                <TouchableOpacity
                  style={styles.quickSelectButton}
                  onPress={() => {
                    const now = new Date();
                    setPickerYear(now.getFullYear());
                    setPickerMonth(now.getMonth() + 1);
                    setPickerDay(now.getDate());
                  }}
                >
                  <Text style={styles.quickSelectText}>Today</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickSelectButton}
                  onPress={() => {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    setPickerYear(yesterday.getFullYear());
                    setPickerMonth(yesterday.getMonth() + 1);
                    setPickerDay(yesterday.getDate());
                  }}
                >
                  <Text style={styles.quickSelectText}>Yesterday</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickSelectButton}
                  onPress={() => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    setPickerYear(weekAgo.getFullYear());
                    setPickerMonth(weekAgo.getMonth() + 1);
                    setPickerDay(weekAgo.getDate());
                  }}
                >
                  <Text style={styles.quickSelectText}>7 Days Ago</Text>
                </TouchableOpacity>
              </View>

              {/* Calendar navigation */}
              <View style={styles.navigation}>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => navigateMonth(-1)}
                >
                  <Icon name="chevron-left" size={18} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.monthYear}>
                  {new Date(pickerYear, pickerMonth - 1).toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => navigateMonth(1)}
                >
                  <Icon name="chevron-right" size={18} color="#374151" />
                </TouchableOpacity>
              </View>

              {/* Weekday headers */}
              <View style={styles.weekRow}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <Text key={day} style={styles.weekDay}>
                    {day}
                  </Text>
                ))}
              </View>

              {/* Calendar grid */}
              <View style={styles.grid}>
                {calendarGrid.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayCell,
                      item.day === pickerDay && !item.disabled && { backgroundColor: themeColor },
                      item.isToday && { borderWidth: 2, borderColor: themeColor },
                      item.disabled && styles.dayCellDisabled,
                    ]}
                    onPress={() => selectDay(item.day)}
                    disabled={item.disabled || item.day === 0}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        item.day === pickerDay && !item.disabled && styles.dayTextSelected,
                        item.isToday && item.day !== pickerDay && { color: themeColor, fontWeight: "700" },
                        item.disabled && styles.dayTextDisabled,
                      ]}
                    >
                      {item.day > 0 ? item.day : ""}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Date preview */}
              <View style={[styles.preview, { backgroundColor: themeColor + "15", borderColor: themeColor + "40" }]}>
                <Icon name="calendar-check" size={18} color={themeColor} />
                <Text style={[styles.previewText, { color: themeColor }]}>
                  {new Date(pickerYear, pickerMonth - 1, pickerDay).toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>

              {/* Action buttons */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: themeColor }]}
                  onPress={handleNextToTime}
                >
                  <Text style={styles.confirmButtonText}>
                    {showTimePicker ? "Next: Time" : "Confirm"}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              {/* Time Picker */}
              <View style={styles.timePickerContainer}>
                <Text style={styles.timePickerLabel}>Select Time</Text>

                <View style={styles.timePickerRow}>
                  {/* Hour picker */}
                  <View style={styles.timePickerColumn}>
                    <Text style={styles.timePickerColumnLabel}>Hour</Text>
                    <ScrollView
                      ref={hourScrollRef}
                      style={styles.timePickerScroll}
                      showsVerticalScrollIndicator={false}
                    >
                      {hourOptions.map((hour) => (
                        <TouchableOpacity
                          key={hour}
                          style={[
                            styles.timePickerItem,
                            pickerHour === hour && { backgroundColor: themeColor },
                          ]}
                          onPress={() => setPickerHour(hour)}
                        >
                          <Text
                            style={[
                              styles.timePickerItemText,
                              pickerHour === hour && styles.timePickerItemTextSelected,
                            ]}
                          >
                            {String(hour).padStart(2, "0")}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <Text style={styles.timePickerSeparator}>:</Text>

                  {/* Minute picker */}
                  <View style={styles.timePickerColumn}>
                    <Text style={styles.timePickerColumnLabel}>Minute</Text>
                    <ScrollView
                      ref={minuteScrollRef}
                      style={styles.timePickerScroll}
                      showsVerticalScrollIndicator={false}
                    >
                      {minuteOptions.map((minute) => (
                        <TouchableOpacity
                          key={minute}
                          style={[
                            styles.timePickerItem,
                            pickerMinute === minute && { backgroundColor: themeColor },
                          ]}
                          onPress={() => setPickerMinute(minute)}
                        >
                          <Text
                            style={[
                              styles.timePickerItemText,
                              pickerMinute === minute && styles.timePickerItemTextSelected,
                            ]}
                          >
                            {String(minute).padStart(2, "0")}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {/* Time preview */}
                <View style={[styles.preview, { backgroundColor: themeColor + "15", borderColor: themeColor + "40" }]}>
                  <Icon name="clock" size={18} color={themeColor} />
                  <Text style={[styles.timePreviewText, { color: themeColor }]}>
                    {String(pickerHour).padStart(2, "0")}:{String(pickerMinute).padStart(2, "0")}
                  </Text>
                </View>
              </View>

              {/* Action buttons */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleBackToDate}
                >
                  <Text style={styles.cancelButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: themeColor }]}
                  onPress={handleConfirm}
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    width: "92%",
    maxWidth: 380,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  quickSelectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  quickSelectButton: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  quickSelectText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  monthYear: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  weekDay: {
    width: 40,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  dayCellDisabled: {
    opacity: 0.3,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
  },
  dayTextSelected: {
    color: "white",
    fontWeight: "700",
  },
  dayTextDisabled: {
    color: "#9ca3af",
  },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  previewText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // Time picker styles
  timePickerContainer: {
    paddingVertical: 16,
  },
  timePickerLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    textAlign: "center",
    marginBottom: 16,
  },
  timePickerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  timePickerColumn: {
    width: 80,
    alignItems: "center",
  },
  timePickerColumnLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 8,
  },
  timePickerScroll: {
    height: 180,
  },
  timePickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 2,
  },
  timePickerItemText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#374151",
    textAlign: "center",
  },
  timePickerItemTextSelected: {
    color: "white",
    fontWeight: "700",
  },
  timePickerSeparator: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#374151",
    marginHorizontal: 16,
  },
  timePreviewText: {
    fontSize: 24,
    fontWeight: "700",
    marginLeft: 12,
  },
});

export default CustomDateTimePicker;
