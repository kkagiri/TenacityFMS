/**
 * NoFuelRulesWarning.js
 * Purpose: Display warning when vehicle has no fueling rules assigned
 * Shows options to either assign rules or continue with master tag
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { pumpControlService } from "../../services/pumpControlService";

const NoFuelRulesWarning = ({
  visible,
  vehicle,
  onAssignRules,
  onContinueWithMasterTag,
  onCancel,
  masterTagId = "MASTER",
}) => {
  const [ruleSets, setRuleSets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedRuleSet, setSelectedRuleSet] = useState(null);
  const [showRuleSelection, setShowRuleSelection] = useState(false);

  // Load available rule sets when showing rule selection
  useEffect(() => {
    if (showRuleSelection && ruleSets.length === 0) {
      loadRuleSets();
    }
  }, [showRuleSelection]);

  const loadRuleSets = async () => {
    try {
      setIsLoading(true);
      const response = await pumpControlService.getRuleSets();
      if (response?.data) {
        setRuleSets(response.data);
      }
    } catch (error) {
      console.error("[NoFuelRulesWarning] Failed to load rule sets:", error);
      Alert.alert("Error", "Failed to load rule sets. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignRuleSet = async () => {
    if (!selectedRuleSet || !vehicle?.vehicleId) return;

    try {
      setIsAssigning(true);

      const response = await pumpControlService.assignRuleSetToVehicle(
        selectedRuleSet.id,
        vehicle.vehicleId
      );

      if (response?.isSuccess) {
        Alert.alert(
          "Success",
          `Rule set "${selectedRuleSet.name}" assigned to vehicle successfully.`,
          [
            {
              text: "OK",
              onPress: () => {
                if (onAssignRules) {
                  onAssignRules(selectedRuleSet);
                }
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", response?.message || "Failed to assign rule set");
      }
    } catch (error) {
      console.error("[NoFuelRulesWarning] Failed to assign rule set:", error);
      Alert.alert("Error", `Failed to assign rule set: ${error.message}`);
    } finally {
      setIsAssigning(false);
    }
  };

  const renderRuleSetItem = (ruleSet) => {
    const isSelected = selectedRuleSet?.id === ruleSet.id;

    return (
      <TouchableOpacity
        key={ruleSet.id}
        style={[styles.ruleSetItem, isSelected && styles.ruleSetItemSelected]}
        onPress={() => setSelectedRuleSet(ruleSet)}
        activeOpacity={0.7}
      >
        <View style={styles.ruleSetInfo}>
          <Text
            style={[
              styles.ruleSetName,
              isSelected && styles.ruleSetNameSelected,
            ]}
          >
            {ruleSet.name}
          </Text>
          {ruleSet.description && (
            <Text style={styles.ruleSetDescription}>{ruleSet.description}</Text>
          )}
          <View style={styles.ruleSetDetails}>
            {ruleSet.dailyLimit && (
              <Text style={styles.ruleSetDetail}>
                Daily: {ruleSet.dailyLimit}L
              </Text>
            )}
            {ruleSet.monthlyLimit && (
              <Text style={styles.ruleSetDetail}>
                Monthly: {ruleSet.monthlyLimit}L
              </Text>
            )}
          </View>
        </View>
        <View
          style={[styles.radioButton, isSelected && styles.radioButtonSelected]}
        >
          {isSelected && <View style={styles.radioButtonInner} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.warningIconContainer}>
              <Icon name="exclamation-triangle" size={32} color="#f59e0b" />
            </View>
            <Text style={styles.title}>No Fueling Rules</Text>
            <Text style={styles.subtitle}>
              Vehicle "{vehicle?.vehicleCode || vehicle?.numberPlate}" has no fuel
              rules configured
            </Text>
          </View>

          {!showRuleSelection ? (
            // Initial warning view
            <View style={styles.content}>
              <Text style={styles.messageText}>
                This vehicle doesn't have any fueling rules assigned. You can
                either:
              </Text>

              <View style={styles.optionsContainer}>
                {/* Option 1: Assign Rules */}
                <TouchableOpacity
                  style={styles.optionCard}
                  onPress={() => setShowRuleSelection(true)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.optionIconContainer,
                      { backgroundColor: "#2563eb15" },
                    ]}
                  >
                    <Icon name="clipboard-list" size={20} color="#2563eb" />
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>Assign Fuel Rules</Text>
                    <Text style={styles.optionDescription}>
                      Configure daily/monthly limits for this vehicle
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color="#9ca3af" />
                </TouchableOpacity>

                {/* Option 2: Continue with Master Tag */}
                <TouchableOpacity
                  style={styles.optionCard}
                  onPress={onContinueWithMasterTag}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.optionIconContainer,
                      { backgroundColor: "#10b98115" },
                    ]}
                  >
                    <Icon name="key" size={20} color="#10b981" />
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>
                      Continue with Master Tag
                    </Text>
                    <Text style={styles.optionDescription}>
                      Use master tag "{masterTagId}" for this fueling
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={16} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              <Text style={styles.noteText}>
                <Icon name="info-circle" size={12} color="#6b7280" />{" "}
                Administrator should configure fuel rules for proper tracking
                and limits.
              </Text>
            </View>
          ) : (
            // Rule selection view
            <View style={styles.content}>
              <Text style={styles.sectionTitle}>Select Rule Set</Text>

              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#2563eb" />
                  <Text style={styles.loadingText}>Loading rule sets...</Text>
                </View>
              ) : ruleSets.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Icon name="inbox" size={40} color="#d1d5db" />
                  <Text style={styles.emptyText}>No rule sets available</Text>
                  <Text style={styles.emptySubtext}>
                    Contact administrator to create fuel rule sets
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.ruleSetList}
                  showsVerticalScrollIndicator={false}
                >
                  {ruleSets.map(renderRuleSetItem)}
                </ScrollView>
              )}

              {/* Action buttons for rule selection */}
              <View style={styles.ruleSelectionActions}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setShowRuleSelection(false);
                    setSelectedRuleSet(null);
                  }}
                >
                  <Icon name="arrow-left" size={14} color="#6b7280" />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.assignButton,
                    (!selectedRuleSet || isAssigning) && styles.buttonDisabled,
                  ]}
                  onPress={handleAssignRuleSet}
                  disabled={!selectedRuleSet || isAssigning}
                >
                  {isAssigning ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Icon name="check" size={14} color="white" />
                      <Text style={styles.assignButtonText}>Assign Rules</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Cancel button */}
          {!showRuleSelection && (
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
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
    padding: 20,
  },
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    overflow: "hidden",
  },
  header: {
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  warningIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#fef3c7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  content: {
    padding: 20,
  },
  messageText: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    color: "#6b7280",
  },
  noteText: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6b7280",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#9ca3af",
    marginTop: 4,
    textAlign: "center",
  },
  ruleSetList: {
    maxHeight: 250,
  },
  ruleSetItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  ruleSetItemSelected: {
    backgroundColor: "#eff6ff",
    borderColor: "#2563eb",
  },
  ruleSetInfo: {
    flex: 1,
  },
  ruleSetName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  ruleSetNameSelected: {
    color: "#2563eb",
  },
  ruleSetDescription: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  ruleSetDetails: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  ruleSetDetail: {
    fontSize: 11,
    color: "#9ca3af",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  radioButtonSelected: {
    borderColor: "#2563eb",
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2563eb",
  },
  ruleSelectionActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  backButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  assignButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#2563eb",
    borderRadius: 8,
  },
  assignButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#6b7280",
  },
});

export default NoFuelRulesWarning;
