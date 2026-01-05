//Cursor - Mobile device data hook adapted from web frontend
import { useSelector } from "react-redux";
import { useMemo, useRef, useCallback } from "react";
import FuelingUtils from "../utils/FuelingUtils";

export const useDeviceData = (ptsId) => {
  // Get raw device status from Redux
  const deviceStatus = useSelector(
    (state) => state.fueling.deviceStatuses[ptsId]
  );

  const rawUploadStatus = deviceStatus?.uploadStatus;
  const lastUpdated = deviceStatus?.lastUpdated;
  const isLiveDataEnabled = useSelector(
    (state) => state.fueling.isLiveDataEnabled
  );

  // Parse pump status using FuelingUtils
  // FuelingUtils now handles both PascalCase and camelCase
  const devicePumpStatus = useMemo(() => {
    const pumpsData = rawUploadStatus?.Pumps || rawUploadStatus?.pumps;
    if (!pumpsData) {
      // Only log if rawUploadStatus exists but has no pumps
      if (rawUploadStatus) {
        console.log(
          "[useDeviceData] No Pumps in status. Keys:",
          Object.keys(rawUploadStatus)
        );
      }
      return {};
    }

    // FuelingUtils.handlePumpStatus now handles both cases internally
    const pumps = FuelingUtils.handlePumpStatus(rawUploadStatus);
    console.log(
      "[useDeviceData] ✅ Parsed pumps:",
      pumps.length,
      pumps.map((p) => `${p.name}(${p.status})`).join(", ")
    );

    const statusMap = {};

    pumps.forEach((pump) => {
      statusMap[pump.id] = {
        id: pump.id,
        name: pump.name,
        status: pump.status,
        nozzleUp: pump.nozzleUp,
        activeNozzle: pump.activeNozzle,
        currentVolume: pump.currentVolume,
        currentAmount: pump.currentAmount,
        currentTransaction: pump.currentTransaction,
        lastTransaction: pump.lastTransaction,
        lastVolume: pump.lastVolume,
        lastAmount: pump.lastAmount,
        lastPrice: pump.lastPrice,
        volume: pump.volume,
        amount: pump.amount,
        transaction: pump.transaction,
      };
    });

    return statusMap;
  }, [rawUploadStatus]);

  // Derive available pumps for selection
  const pumps = useMemo(() => {
    return Object.values(devicePumpStatus).sort((a, b) => a.id - b.id);
  }, [devicePumpStatus]);

  // Derive active fueling processes
  const activeFuelingProcesses = useMemo(() => {
    return Object.values(devicePumpStatus)
      .filter(
        (pump) =>
          pump.status === "fueling" || pump.status === "endOfTransaction"
      )
      .map((pump) => ({
        pumpId: pump.id,
        status: pump.status,
        nozzle: pump.activeNozzle || pump.nozzle,
        volume: pump.currentVolume || pump.volume || 0,
        amount: pump.currentAmount || pump.amount || 0,
        transaction: pump.currentTransaction || pump.transaction,
      }));
  }, [devicePumpStatus]);

  // Extract fuel grades from status
  const fuelGrades = useMemo(() => {
    if (!rawUploadStatus?.FuelGrades) return [];

    return rawUploadStatus.FuelGrades.map((grade, index) => ({
      id: index + 1,
      name: grade.Name || `Grade ${index + 1}`,
      price: grade.Price || 0,
      nozzle: grade.Nozzle || index + 1,
      fuelType: grade.FuelType || "Unknown",
      color: grade.Color || "#6366f1",
    }));
  }, [rawUploadStatus]);

  // Extract probe/tank data from PTS status
  const probeTanks = useMemo(() => {
    if (!rawUploadStatus?.Probes) return [];

    const probes = rawUploadStatus.Probes;
    if (!probes.Count || !probes.Ids) return [];

    return probes.Ids.map((id, index) => ({
      id: `probe-${id}`,
      probeId: id,
      name: `Tank ${id} - ${probes.ProductNames?.[index] || "Unknown"}`,
      productId: probes.ProductIds?.[index],
      productName: probes.ProductNames?.[index] || "Unknown Product",
      currentVolume: probes.Volumes?.[index] || 0,
      capacity: probes.Capacities?.[index] || 50000,
      height: probes.Heights?.[index] || 0,
      temperature: probes.Temperatures?.[index] || 0,
      water: probes.Waters?.[index] || 0,
      status: probes.Statuses?.[index] || 0,
      statusText:
        ["Normal", "Low", "High", "Alarm"][probes.Statuses?.[index]] ||
        "Normal",
      percentFull: Math.round(
        ((probes.Volumes?.[index] || 0) / (probes.Capacities?.[index] || 1)) *
          100
      ),
    }));
  }, [rawUploadStatus]);

  // ==========================================
  // RFID Tag Detection from Upload Status
  // ==========================================
  // Track previously seen tags to detect new ones
  const previousTagsRef = useRef(new Set());

  // Extract RFID tags from IdleStatus (pump-attached readers) and Readers (standalone readers)
  const detectedTags = useMemo(() => {
    if (!rawUploadStatus) return [];

    const tags = [];
    const now = new Date().toISOString();

    // Get Pumps data (handles both PascalCase and camelCase)
    const pumpsData = rawUploadStatus?.Pumps || rawUploadStatus?.pumps;

    // 1. Extract tags from IdleStatus (pump-attached RFID readers)
    // Format: Pumps.IdleStatus.Tags[] - parallel array with Ids[]
    const idleStatus = pumpsData?.IdleStatus || pumpsData?.idleStatus;
    if (idleStatus) {
      const pumpIds = idleStatus?.Ids || idleStatus?.ids || [];
      const pumpTags = idleStatus?.Tags || idleStatus?.tags || [];

      pumpTags.forEach((tag, index) => {
        if (tag && tag.trim() !== "" && tag !== "000000000000") {
          const pumpId = pumpIds[index];
          tags.push({
            tagId: tag.trim(),
            source: "pump",
            pumpId: pumpId,
            readerId: null,
            detectedAt: now,
            isNew: !previousTagsRef.current.has(tag.trim()),
          });
        }
      });
    }

    // 2. Extract tags from Readers.OnlineStatus (standalone RFID readers)
    // Format: Readers.OnlineStatus.Tags[] with Ids[]
    const readers = rawUploadStatus?.Readers || rawUploadStatus?.readers;
    const onlineReaders = readers?.OnlineStatus || readers?.onlineStatus;
    if (onlineReaders) {
      const readerIds = onlineReaders?.Ids || onlineReaders?.ids || [];
      const readerTags = onlineReaders?.Tags || onlineReaders?.tags || [];

      readerTags.forEach((tag, index) => {
        if (tag && tag.trim() !== "" && tag !== "000000000000") {
          const readerId = readerIds[index];
          // Avoid duplicates from pump tags
          if (!tags.find((t) => t.tagId === tag.trim())) {
            tags.push({
              tagId: tag.trim(),
              source: "reader",
              pumpId: null,
              readerId: readerId,
              detectedAt: now,
              isNew: !previousTagsRef.current.has(tag.trim()),
            });
          }
        }
      });

      // Also check LastTags for recently scanned tags
      const lastTags = onlineReaders?.LastTags || onlineReaders?.lastTags || [];
      lastTags.forEach((tag, index) => {
        if (tag && tag.trim() !== "" && tag !== "000000000000") {
          const readerId = readerIds[index];
          if (!tags.find((t) => t.tagId === tag.trim())) {
            tags.push({
              tagId: tag.trim(),
              source: "reader-last",
              pumpId: null,
              readerId: readerId,
              detectedAt: now,
              isNew: !previousTagsRef.current.has(tag.trim()),
            });
          }
        }
      });
    }

    // 3. Extract tags from Readers.OfflineStatus (offline readers with buffered tags)
    // Format: Readers.OfflineStatus.Tags[] with Ids[]
    const offlineReaders = readers?.OfflineStatus || readers?.offlineStatus;
    if (offlineReaders) {
      const offlineIds = offlineReaders?.Ids || offlineReaders?.ids || [];
      const offlineTags = offlineReaders?.Tags || offlineReaders?.tags || [];

      offlineTags.forEach((tag, index) => {
        if (tag && tag.trim() !== "" && tag !== "000000000000") {
          const readerId = offlineIds[index];
          if (!tags.find((t) => t.tagId === tag.trim())) {
            tags.push({
              tagId: tag.trim(),
              source: "reader-offline",
              pumpId: null,
              readerId: readerId,
              detectedAt: now,
              isNew: !previousTagsRef.current.has(tag.trim()),
            });
          }
        }
      });
    }

    // Update previous tags reference
    tags.forEach((t) => previousTagsRef.current.add(t.tagId));

    // Log detected tags for debugging
    if (tags.length > 0) {
      console.log(
        "[useDeviceData] 🏷️ Detected tags:",
        tags
          .map((t) => `${t.tagId}(${t.source}${t.isNew ? ",NEW" : ""})`)
          .join(", ")
      );
    }

    return tags;
  }, [rawUploadStatus]);

  // Get newly detected tags (tags that appeared in the latest update)
  const newlyDetectedTags = useMemo(() => {
    return detectedTags.filter((t) => t.isNew);
  }, [detectedTags]);

  // Get the most recently detected tag
  const lastDetectedTag = useMemo(() => {
    const newTags = detectedTags.filter((t) => t.isNew);
    return newTags.length > 0 ? newTags[newTags.length - 1] : null;
  }, [detectedTags]);

  // Clear tag detection history (call when starting new scan session)
  const clearTagHistory = useCallback(() => {
    previousTagsRef.current.clear();
    console.log("[useDeviceData] 🧹 Tag detection history cleared");
  }, []);

  // Helper function to get pump details
  const getPumpDetails = (pumpId) => {
    return devicePumpStatus[pumpId] || null;
  };

  // Helper function to get nozzles for a pump
  const getNozzlesForPump = (pumpId) => {
    if (!pumpId || !rawUploadStatus) return [];
    return FuelingUtils.getNozzlesForPump(pumpId, rawUploadStatus, fuelGrades);
  };

  // Helper function to get fueling data for a pump
  const getFuelingData = (pumpId) => {
    if (!pumpId || !rawUploadStatus) return null;
    return FuelingUtils.getFuelingData(pumpId, rawUploadStatus);
  };

  return {
    // Raw data
    rawUploadStatus,
    lastUpdated,
    isLiveDataEnabled,

    // Processed data
    devicePumpStatus,
    pumps,
    activeFuelingProcesses,
    fuelGrades,
    probeTanks, // Tank data from PTS probes

    // RFID Tag detection
    detectedTags, // All currently detected tags
    newlyDetectedTags, // Tags that appeared in latest update
    lastDetectedTag, // Most recently detected new tag
    clearTagHistory, // Function to reset tag detection

    // Helper functions
    getPumpDetails,
    getNozzlesForPump,
    getFuelingData,
  };
};
