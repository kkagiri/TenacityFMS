/**
 * File: IssueAssignmentResponseScreen.js
 * Purpose: Mobile response flow for assigned issues (confirm, update vehicle status, extend due date).
 * Dependencies: react, react-native, @react-native-picker/picker, issueTrackerService, CustomDateTimePicker
 * Last Modified: 2026-02-16
 *
 * Key Functions:
 * - loadIssue(): Fetch issue details and prefill current status/date
 * - handleSubmit(): Submit assignment response to backend endpoint
 * - formatDateOnly(): Normalizes selected date to YYYY-MM-DD
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    TextInput,
    Alert,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { Picker } from "@react-native-picker/picker";
import CustomDateTimePicker from "../../components/common/CustomDateTimePicker";
import issueTrackerService from "../../services/issueTrackerService";

const VEHICLE_STATUSES = [
    { value: 0, label: "Working", description: "GPS alerts enabled" },
    { value: 1, label: "Parked Yard", description: "GPS alerts paused" },
    { value: 2, label: "Workshop", description: "GPS alerts paused" },
];

const formatDateOnly = (dateValue) => {
    if (!dateValue) return "";
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const IssueAssignmentResponseScreen = ({ navigation, route }) => {
    const issueId = route?.params?.issueId;

    const [issue, setIssue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [note, setNote] = useState("");
    const [vehicleStatus, setVehicleStatus] = useState(null);
    const [initialVehicleStatus, setInitialVehicleStatus] = useState(null);

    const [selectedDueDate, setSelectedDueDate] = useState("");
    const [showDatePicker, setShowDatePicker] = useState(false);

    const loadIssue = useCallback(async () => {
        if (!issueId) {
            Alert.alert("Invalid Request", "Issue ID was not provided.");
            navigation.goBack();
            return;
        }

        try {
            setLoading(true);
            const data = await issueTrackerService.getIssueById(issueId);
            setIssue(data);

            const currentStatus = data?.vehicleStatusValue;
            if (currentStatus !== undefined && currentStatus !== null) {
                setVehicleStatus(currentStatus);
                setInitialVehicleStatus(currentStatus);
            }

            if (data?.dueDate) {
                setSelectedDueDate(formatDateOnly(data.dueDate));
            }
        } catch (_error) {
            Alert.alert("Error", "Unable to load issue details.");
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    }, [issueId, navigation]);

    useEffect(() => {
        loadIssue();
    }, [loadIssue]);

    const vehicleStatusChanged = useMemo(() => {
        return vehicleStatus !== null && vehicleStatus !== initialVehicleStatus;
    }, [vehicleStatus, initialVehicleStatus]);

    const dueDateChanged = useMemo(() => {
        if (!selectedDueDate) return false;
        const originalDueDate = formatDateOnly(issue?.dueDate);
        if (!originalDueDate) return true;
        return selectedDueDate !== originalDueDate;
    }, [selectedDueDate, issue?.dueDate]);

    const currentStatusLabel = useMemo(() => {
        const match = VEHICLE_STATUSES.find(
            (status) => status.value === initialVehicleStatus
        );
        return match?.label || "Unknown";
    }, [initialVehicleStatus]);

    const handleSubmit = useCallback(async () => {
        if (!issueId) return;

        try {
            setSubmitting(true);
            const payload = {
                action: "confirm",
                note: note?.trim() || null,
                vehicleStatusChange: vehicleStatusChanged ? vehicleStatus : null,
                newDueDate: dueDateChanged ? selectedDueDate : null,
            };

            await issueTrackerService.respondToIssueAssignment(issueId, payload);

            Alert.alert("Success", "Assignment response submitted successfully.", [
                {
                    text: "Open Issue",
                    onPress: () =>
                        navigation.replace("IssueDetail", {
                            issueId: Number(issueId),
                        }),
                },
                {
                    text: "Done",
                    onPress: () => navigation.goBack(),
                    style: "cancel",
                },
            ]);
        } catch (_error) {
            Alert.alert("Error", "Failed to submit assignment response.");
        } finally {
            setSubmitting(false);
        }
    }, [
        issueId,
        note,
        vehicleStatusChanged,
        vehicleStatus,
        dueDateChanged,
        selectedDueDate,
        navigation,
    ]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.centeredText}>Loading assignment...</Text>
            </View>
        );
    }

    if (!issue) {
        return (
            <View style={styles.centered}>
                <Icon name="exclamation-circle" size={40} color="#ef4444" />
                <Text style={styles.centeredTitle}>Issue not found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-left" size={18} color="#ffffff" />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerSubtitle}>Issue #{issue.id}</Text>
                    <Text numberOfLines={1} style={styles.headerTitle}>
                        Assignment Response
                    </Text>
                </View>
                <View style={styles.headerBtnPlaceholder} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
                <View style={styles.card}>
                    <Text style={styles.issueTitle}>{issue.problemTitle || "Untitled Issue"}</Text>
                    <Text style={styles.issueMeta}>Current vehicle status: {currentStatusLabel}</Text>
                    <Text style={styles.issueMeta}>
                        Current due date: {formatDateOnly(issue.dueDate) || "Not set"}
                    </Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Vehicle Status</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={vehicleStatus}
                            onValueChange={(value) => setVehicleStatus(value)}
                            style={styles.picker}
                        >
                            {VEHICLE_STATUSES.map((status) => (
                                <Picker.Item
                                    key={status.value}
                                    label={`${status.label} (${status.description})`}
                                    value={status.value}
                                />
                            ))}
                        </Picker>
                    </View>
                    {vehicleStatusChanged && (
                        <Text style={styles.infoText}>
                            Vehicle status will be updated when you submit.
                        </Text>
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Deadline</Text>
                    <TouchableOpacity
                        style={styles.dateButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Icon name="calendar" size={14} color="#2563eb" />
                        <Text style={styles.dateButtonText}>{selectedDueDate || "Select due date"}</Text>
                    </TouchableOpacity>
                    {dueDateChanged && (
                        <Text style={styles.infoText}>Deadline update will suppress duplicate alerts until the selected date.</Text>
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Note (Optional)</Text>
                    <TextInput
                        style={styles.noteInput}
                        value={note}
                        onChangeText={setNote}
                        placeholder="Add assignment note"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <>
                            <Icon name="paper-plane" size={14} color="#ffffff" />
                            <Text style={styles.submitButtonText}>Submit Response</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>

            <CustomDateTimePicker
                visible={showDatePicker}
                value={selectedDueDate ? new Date(`${selectedDueDate}T00:00:00`) : new Date()}
                onConfirm={(date) => {
                    setSelectedDueDate(formatDateOnly(date));
                    setShowDatePicker(false);
                }}
                onCancel={() => setShowDatePicker(false)}
                showTimePicker={false}
                maximumDate={null}
                themeColor="#2563eb"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f3f4f6",
    },
    header: {
        backgroundColor: "#1f2937",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.15)",
    },
    headerBtnPlaceholder: {
        width: 36,
        height: 36,
    },
    headerCenter: {
        flex: 1,
        alignItems: "center",
        marginHorizontal: 12,
    },
    headerSubtitle: {
        fontSize: 11,
        color: "rgba(255,255,255,0.7)",
        fontWeight: "600",
    },
    headerTitle: {
        fontSize: 16,
        color: "#ffffff",
        fontWeight: "700",
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    card: {
        backgroundColor: "#ffffff",
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    issueTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1f2937",
        marginBottom: 6,
    },
    issueMeta: {
        fontSize: 12,
        color: "#6b7280",
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#374151",
        marginBottom: 8,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 8,
        backgroundColor: "#f9fafb",
        overflow: "hidden",
    },
    picker: {
        height: 50,
    },
    dateButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#eff6ff",
        borderColor: "#bfdbfe",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        gap: 8,
    },
    dateButtonText: {
        fontSize: 14,
        color: "#1f2937",
        fontWeight: "500",
    },
    infoText: {
        marginTop: 8,
        fontSize: 12,
        color: "#2563eb",
    },
    noteInput: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 8,
        padding: 10,
        minHeight: 90,
        fontSize: 14,
        color: "#1f2937",
        backgroundColor: "#f9fafb",
    },
    submitButton: {
        marginTop: 8,
        backgroundColor: "#2563eb",
        borderRadius: 10,
        minHeight: 48,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "700",
    },
    centered: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
    },
    centeredTitle: {
        marginTop: 10,
        fontSize: 18,
        color: "#1f2937",
        fontWeight: "700",
    },
    centeredText: {
        marginTop: 12,
        color: "#6b7280",
        fontSize: 14,
    },
});

export default IssueAssignmentResponseScreen;
