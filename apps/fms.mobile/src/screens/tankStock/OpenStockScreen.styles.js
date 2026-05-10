/**
 * File: OpenStockScreen.styles.js
 * Purpose: Styles for OpenStockScreen UI elements
 * Dependencies: react-native
 * Last Modified: 2026-02-07
 *
 * Key Functions/Components:
 * - styles: StyleSheet definitions for OpenStockScreen
 */
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8fafc",
    },
    header: {
        alignItems: "center",
        padding: 24,
        marginBottom: 16,
    },
    headerIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#1f2937",
    },
    headerSubtitle: {
        fontSize: 14,
        color: "#6b7280",
        marginTop: 4,
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 8,
    },
    selectButton: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    dateInfo: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    dateText: {
        marginLeft: 12,
        flex: 1,
    },
    dateValue: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1f2937",
    },
    selectedTankInfo: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    selectedTankText: {
        marginLeft: 12,
        flex: 1,
    },
    selectedTankName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1f2937",
    },
    selectedTankProduct: {
        fontSize: 13,
        color: "#6b7280",
        marginTop: 2,
    },
    placeholderContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    placeholderText: {
        fontSize: 15,
        color: "#9ca3af",
        marginLeft: 12,
    },
    tankDetailsCard: {
        backgroundColor: "white",
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    tankDetailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 6,
    },
    tankDetailLabel: {
        fontSize: 14,
        color: "#6b7280",
    },
    tankDetailValue: {
        fontSize: 14,
        fontWeight: "500",
        color: "#1f2937",
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    inputContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "white",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        paddingHorizontal: 16,
    },
    textInput: {
        flex: 1,
        fontSize: 18,
        fontWeight: "600",
        color: "#1f2937",
        paddingVertical: 16,
    },
    inputUnit: {
        fontSize: 16,
        color: "#6b7280",
        marginLeft: 8,
    },
    sensorButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        marginTop: 12,
        backgroundColor: "white",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    buttonDisabled: {
        opacity: 0.5,
    },
    sensorButtonText: {
        fontSize: 15,
        fontWeight: "600",
        marginLeft: 8,
    },
    actionSection: {
        padding: 16,
        paddingTop: 24,
    },
    saveButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "white",
        marginLeft: 8,
    },
    cancelButton: {
        alignItems: "center",
        paddingVertical: 14,
    },
    cancelButtonText: {
        fontSize: 15,
        color: "#6b7280",
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContainer: {
        backgroundColor: "white",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: "70%",
        minHeight: "40%",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1f2937",
    },
    modalCloseButton: {
        padding: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: "#6b7280",
    },
    tankItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
    },
    tankItemSelected: {
        backgroundColor: "#f0fdf4",
    },
    tankItemIcon: {
        width: 44,
        height: 44,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    tankItemInfo: {
        flex: 1,
        marginLeft: 12,
    },
    tankItemName: {
        fontSize: 16,
        fontWeight: "500",
        color: "#1f2937",
    },
    tankItemDetails: {
        fontSize: 13,
        color: "#6b7280",
        marginTop: 2,
    },
    separator: {
        height: 1,
        backgroundColor: "#f3f4f6",
        marginHorizontal: 16,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 40,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        color: "#9ca3af",
        textAlign: "center",
    },
});

export default styles;
