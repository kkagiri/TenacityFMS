/**
 * File: SiteOverviewScreen.js
 * Purpose: Displays site/tank stock overview with transaction insights and latest update source details.
 * Dependencies: react, react-redux, react-navigation, react-native-vector-icons, apiService
 * Last Modified: 2026-02-16
 *
 * Key Functions:
 * - fetchTodayTransactions(): Retrieves today's transaction totals by site.
 * - fetchLatestLedgerUpdates(): Retrieves latest ledger update per tank/site as fallback metadata.
 * - getTankLastUpdateInfo(): Resolves tank last-updated/source using tank data first, then ledger.
 */
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Icon from "react-native-vector-icons/FontAwesome5";
import { useNavigation } from "@react-navigation/native";
import { fetchSiteList } from "../../redux/slices/siteSlice";
import { fetchTanks } from "../../redux/slices/tankSlice";
import apiService from "../../services/apiService";

const VOLUME_CHANGE_REASON_MAP = {
  0: "Opening Stock",
  1: "Closing Stock",
  2: "Delivery",
  3: "Transfer In",
  4: "Transfer Out",
  5: "Adjustment",
  6: "Dispensing",
  7: "Auto Dispensing",
  8: "Reconciliation",
  9: "Auto Reconciliation",
};

const formatLocalDateForApi = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateValue = (dateValue) => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;

  const raw = String(dateValue).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,7})?)?$/.test(raw)) {
    return new Date(`${raw}Z`);
  }

  return new Date(raw);
};

const formatLastUpdated = (dateValue) => {
  const date = parseDateValue(dateValue);
  if (!date || Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const resolveLedgerSource = (tx) => {
  if (!tx) return null;

  const explicitSource =
    tx.physicalStockSource ||
    tx.PhysicalStockSource ||
    tx.stockSource ||
    tx.StockSource ||
    tx.source ||
    tx.Source;

  if (explicitSource) return explicitSource;

  const reasonId =
    tx.volumeChangeReason ?? tx.changeReason ?? tx.reason ?? tx.Reason;

  return VOLUME_CHANGE_REASON_MAP[reasonId] || "Tank Volume History";
};

const SiteOverviewScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  // Redux state
  const { sites, isLoading: sitesLoading } = useSelector((state) => state.site);
  const { tanks, isLoading: tanksLoading } = useSelector((state) => state.tank);

  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSite, setExpandedSite] = useState(null);
  const [todayTransactions, setTodayTransactions] = useState({});
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [latestTxByTank, setLatestTxByTank] = useState({});
  const [latestTxBySite, setLatestTxBySite] = useState({});

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    dispatch(fetchSiteList());
    dispatch(fetchTanks());
    await Promise.all([fetchTodayTransactions(), fetchLatestLedgerUpdates()]);
  };

  const fetchTodayTransactions = async () => {
    try {
      setLoadingTransactions(true);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Use TankVolumeHistory API (same source as Transaction Hub)
      const response = await apiService.getTankVolumeHistory({
        startDate: formatLocalDateForApi(today),
        endDate: formatLocalDateForApi(tomorrow),
        take: 1000,
      });

      // Response is an array of transactions
      const transactions = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      // Group transactions by site (TankVolumeHistoryDTO includes siteId)
      const txBySite = {};
      transactions.forEach((tx) => {
        // Use siteId from response (camelCase from JSON serialization)
        const siteId = tx.siteId || 0;

        if (!txBySite[siteId]) {
          txBySite[siteId] = { count: 0, volume: 0 };
        }
        txBySite[siteId].count += 1;
        txBySite[siteId].volume += Math.abs(tx.volumeChange || 0);
      });
      setTodayTransactions(txBySite);
    } catch (error) {
      console.error("Failed to fetch today's transactions:", error);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const fetchLatestLedgerUpdates = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const response = await apiService.getTankVolumeHistory({
        startDate: formatLocalDateForApi(startDate),
        endDate: formatLocalDateForApi(endDate),
        take: 3000,
        includeVehicleNames: false,
      });

      const transactions = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : [];

      const byTank = {};
      const bySite = {};

      transactions.forEach((tx) => {
        const tankId = tx.tankId || tx.TankId;
        const siteId = tx.siteId || tx.SiteId;
        const timestamp = tx.timestamp || tx.Timestamp || tx.recordedAt;
        const date = parseDateValue(timestamp);

        if (!date || Number.isNaN(date.getTime())) return;

        if (tankId) {
          const current = byTank[tankId];
          const currentDate = parseDateValue(
            current?.timestamp || current?.Timestamp || current?.recordedAt
          );

          if (!currentDate || date > currentDate) {
            byTank[tankId] = tx;
          }
        }

        if (siteId) {
          const current = bySite[siteId];
          const currentDate = parseDateValue(
            current?.timestamp || current?.Timestamp || current?.recordedAt
          );

          if (!currentDate || date > currentDate) {
            bySite[siteId] = tx;
          }
        }
      });

      setLatestTxByTank(byTank);
      setLatestTxBySite(bySite);
    } catch (error) {
      console.error("Failed to fetch latest ledger updates:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Calculate site statistics
  const getSiteStats = useCallback(
    (siteId) => {
      const siteTanks = tanks.filter((t) => t.siteId === siteId);
      const totalCapacity = siteTanks.reduce(
        (sum, t) => sum + (t.tankVolume || t.capacity || 0),
        0
      );
      // Use physicalStockValue (actual physical fuel level) for display
      const totalStock = siteTanks.reduce(
        (sum, t) => sum + (t.physicalStockValue ?? t.currentVolume ?? 0),
        0
      );
      const percentFull =
        totalCapacity > 0 ? Math.round((totalStock / totalCapacity) * 100) : 0;
      const txData = todayTransactions[siteId] || { count: 0, volume: 0 };

      return {
        tankCount: siteTanks.length,
        totalCapacity,
        totalStock,
        percentFull,
        transactionCount: txData.count,
        transactionVolume: txData.volume,
        tanks: siteTanks,
      };
    },
    [tanks, todayTransactions]
  );

  // Filter sites to only show active sites with at least one tank
  const filteredSites = useMemo(() => {
    return sites.filter((site) => {
      // Check if site is active (default to true if property doesn't exist)
      const isActive = site.isActive !== false && site.active !== false;
      // Check if site has at least one tank
      const hasTanks = tanks.some((tank) => tank.siteId === site.id);
      return isActive && hasTanks;
    });
  }, [sites, tanks]);

  // Calculate overall totals (based on filtered sites only)
  const overallStats = useMemo(() => {
    // Get tanks only from filtered sites
    const filteredSiteIds = new Set(filteredSites.map((s) => s.id));
    const filteredTanks = tanks.filter((t) => filteredSiteIds.has(t.siteId));

    const totalCapacity = filteredTanks.reduce(
      (sum, t) => sum + (t.tankVolume || t.capacity || 0),
      0
    );
    // Use physicalStockValue (actual physical fuel level) for display
    const totalStock = filteredTanks.reduce(
      (sum, t) => sum + (t.physicalStockValue ?? t.currentVolume ?? 0),
      0
    );
    const percentFull =
      totalCapacity > 0 ? Math.round((totalStock / totalCapacity) * 100) : 0;
    const totalTx = Object.values(todayTransactions)
      .filter((_, siteId) => filteredSiteIds.has(Number(siteId)))
      .reduce((sum, tx) => sum + tx.count, 0);
    const totalVolume = Object.values(todayTransactions)
      .filter((_, siteId) => filteredSiteIds.has(Number(siteId)))
      .reduce((sum, tx) => sum + tx.volume, 0);

    return {
      siteCount: filteredSites.length,
      tankCount: filteredTanks.length,
      totalCapacity,
      totalStock,
      percentFull,
      transactionCount: totalTx,
      transactionVolume: totalVolume,
    };
  }, [filteredSites, tanks, todayTransactions]);

  // Get fill color based on percentage
  const getFillColor = (percent) => {
    if (percent < 20) return "#ef4444";
    if (percent < 50) return "#f59e0b";
    return "#10b981";
  };

  const formatVolume = (volume) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M L`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K L`;
    }
    return `${Math.round(volume).toLocaleString()} L`;
  };

  const getTankLastUpdateInfo = useCallback(
    (tank) => {
      const tankUpdatedAt =
        tank.lastPhysicalStockUpdate || tank.lastStockUpdate || null;
      const tankSource =
        tank.physicalStockSource || tank.stockSource || tank.source || null;

      if (tankUpdatedAt || tankSource) {
        return {
          updatedAt: tankUpdatedAt,
          source: tankSource || "Tank",
        };
      }

      const ledgerTx = latestTxByTank[tank.id];
      if (!ledgerTx) return { updatedAt: null, source: null };

      return {
        updatedAt:
          ledgerTx.timestamp || ledgerTx.Timestamp || ledgerTx.recordedAt || null,
        source: resolveLedgerSource(ledgerTx),
      };
    },
    [latestTxByTank]
  );

  const getSiteLastUpdateInfo = useCallback(
    (siteId, siteTanks) => {
      let latestDate = null;
      let latestSource = null;

      siteTanks.forEach((tank) => {
        const info = getTankLastUpdateInfo(tank);
        const date = parseDateValue(info.updatedAt);
        if (!date || Number.isNaN(date.getTime())) return;

        if (!latestDate || date > latestDate) {
          latestDate = date;
          latestSource = info.source;
        }
      });

      if (latestDate) {
        return { updatedAt: latestDate, source: latestSource || "Tank" };
      }

      const siteLedgerTx = latestTxBySite[siteId];
      if (!siteLedgerTx) return { updatedAt: null, source: null };

      return {
        updatedAt:
          siteLedgerTx.timestamp ||
          siteLedgerTx.Timestamp ||
          siteLedgerTx.recordedAt ||
          null,
        source: resolveLedgerSource(siteLedgerTx),
      };
    },
    [getTankLastUpdateInfo, latestTxBySite]
  );

  const renderTankItem = (tank) => {
    // Use physicalStockValue (actual physical fuel level) for display
    const physicalStock = tank.physicalStockValue ?? tank.currentVolume ?? 0;
    const capacity = tank.tankVolume || tank.capacity || 0;
    const percent =
      capacity > 0 ? Math.round((physicalStock / capacity) * 100) : 0;
    const productName = tank.fuelGradeName || tank.productName || "Unknown";
    const updateInfo = getTankLastUpdateInfo(tank);

    return (
      <View key={tank.id} style={styles.tankItem}>
        <View style={styles.tankIcon}>
          <Icon name="database" size={16} color="#6366f1" />
        </View>
        <View style={styles.tankDetails}>
          <View style={styles.tankHeader}>
            <Text style={styles.tankName}>{tank.name}</Text>
            <View style={styles.productBadge}>
              <Text style={styles.productText}>{productName}</Text>
            </View>
          </View>
          <View style={styles.tankStockRow}>
            <Text style={styles.tankStock}>
              {formatVolume(physicalStock)} / {formatVolume(capacity)}
            </Text>
            <Text
              style={[styles.tankPercent, { color: getFillColor(percent) }]}
            >
              {percent}%
            </Text>
          </View>
          <View style={styles.tankBar}>
            <View
              style={[
                styles.tankFill,
                {
                  width: `${percent}%`,
                  backgroundColor: getFillColor(percent),
                },
              ]}
            />
          </View>
          <Text style={styles.tankUpdateText}>
            Last Updated: {formatLastUpdated(updateInfo.updatedAt)}
            {updateInfo.source ? ` • ${updateInfo.source}` : ""}
          </Text>
        </View>
      </View>
    );
  };

  const renderSiteCard = ({ item: site }) => {
    const stats = getSiteStats(site.id);
    const isExpanded = expandedSite === site.id;
    const siteUpdateInfo = getSiteLastUpdateInfo(site.id, stats.tanks);

    return (
      <View style={styles.siteCard}>
        <TouchableOpacity
          style={styles.siteHeader}
          onPress={() => setExpandedSite(isExpanded ? null : site.id)}
          activeOpacity={0.7}
        >
          <View style={styles.siteInfo}>
            <View style={styles.siteIconContainer}>
              <Icon name="map-marker-alt" size={18} color="#2563eb" />
            </View>
            <View style={styles.siteTextContainer}>
              <Text style={styles.siteName}>{site.name}</Text>
              <Text style={styles.siteSubtext}>
                {stats.tankCount} tanks • {formatVolume(stats.totalStock)}{" "}
                stored
              </Text>
              <Text style={styles.siteUpdateText}>
                Last Updated: {formatLastUpdated(siteUpdateInfo.updatedAt)}
                {siteUpdateInfo.source ? ` • ${siteUpdateInfo.source}` : ""}
              </Text>
            </View>
          </View>
          <Icon
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={14}
            color="#9ca3af"
          />
        </TouchableOpacity>

        {/* Site Stats Row */}
        <View style={styles.siteStatsRow}>
          <View style={styles.siteStat}>
            <View style={[styles.siteStatIcon, { backgroundColor: "#dcfce7" }]}>
              <Icon name="gas-pump" size={12} color="#22c55e" />
            </View>
            <View>
              <Text style={styles.siteStatValue}>
                {formatVolume(stats.totalStock)}
              </Text>
              <Text style={styles.siteStatLabel}>Current Stock</Text>
            </View>
          </View>

          <View style={styles.siteStat}>
            <View style={[styles.siteStatIcon, { backgroundColor: "#e0e7ff" }]}>
              <Icon name="percentage" size={12} color="#6366f1" />
            </View>
            <View>
              <Text
                style={[
                  styles.siteStatValue,
                  { color: getFillColor(stats.percentFull) },
                ]}
              >
                {stats.percentFull}%
              </Text>
              <Text style={styles.siteStatLabel}>Capacity</Text>
            </View>
          </View>

          <View style={styles.siteStat}>
            <View style={[styles.siteStatIcon, { backgroundColor: "#fef3c7" }]}>
              <Icon name="exchange-alt" size={12} color="#f59e0b" />
            </View>
            <View>
              <Text style={styles.siteStatValue}>{stats.transactionCount}</Text>
              <Text style={styles.siteStatLabel}>Today</Text>
            </View>
          </View>
        </View>

        {/* Capacity Bar */}
        <View style={styles.capacityBarContainer}>
          <View style={styles.capacityBar}>
            <View
              style={[
                styles.capacityFill,
                {
                  width: `${stats.percentFull}%`,
                  backgroundColor: getFillColor(stats.percentFull),
                },
              ]}
            />
          </View>
          <Text style={styles.capacityText}>
            {formatVolume(stats.totalCapacity)} total capacity
          </Text>
        </View>

        {/* Expanded Tank List */}
        {isExpanded && (
          <View style={styles.tankList}>
            <Text style={styles.tankListTitle}>Tanks</Text>
            {stats.tanks.length > 0 ? (
              stats.tanks.map(renderTankItem)
            ) : (
              <Text style={styles.noTanksText}>
                No tanks configured for this site
              </Text>
            )}

            {/* View Transaction Hub Button */}
            <TouchableOpacity
              style={styles.viewTransactionsBtn}
              onPress={() =>
                navigation.navigate("TankTransactionHub", { siteId: site.id })
              }
            >
              <Icon name="history" size={14} color="#2563eb" />
              <Text style={styles.viewTransactionsText}>
                View Transaction Hub
              </Text>
              <Icon name="chevron-right" size={12} color="#2563eb" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const isLoading = sitesLoading || tanksLoading;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={18} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Site Overview</Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
          {refreshing || isLoading ? (
            <ActivityIndicator size="small" color="#6366f1" />
          ) : (
            <Icon name="sync" size={16} color="#6366f1" />
          )}
        </TouchableOpacity>
      </View>

      {/* Overall Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Overall Fuel Status</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryStat}>
            <Icon name="gas-pump" size={24} color="#22c55e" />
            <Text style={styles.summaryValue}>
              {formatVolume(overallStats.totalStock)}
            </Text>
            <Text style={styles.summaryLabel}>Available</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStat}>
            <Icon
              name="tachometer-alt"
              size={24}
              color={getFillColor(overallStats.percentFull)}
            />
            <Text
              style={[
                styles.summaryValue,
                { color: getFillColor(overallStats.percentFull) },
              ]}
            >
              {overallStats.percentFull}%
            </Text>
            <Text style={styles.summaryLabel}>Capacity</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStat}>
            <Icon name="exchange-alt" size={24} color="#f59e0b" />
            <Text style={styles.summaryValue}>
              {overallStats.transactionCount}
            </Text>
            <Text style={styles.summaryLabel}>Today's Tx</Text>
          </View>
        </View>
      </View>

      {/* Sites List */}
      {isLoading && filteredSites.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading sites...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSites}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderSiteCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="map-marker-alt" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>
                No active sites with tanks found
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  refreshBtn: {
    padding: 8,
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
    textAlign: "center",
  },
  summaryStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  summaryStat: {
    alignItems: "center",
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 50,
    backgroundColor: "#e5e7eb",
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  siteCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  siteHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  siteInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  siteIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  siteTextContainer: {
    flex: 1,
  },
  siteName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  siteSubtext: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  siteUpdateText: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
  },
  siteStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  siteStat: {
    flexDirection: "row",
    alignItems: "center",
  },
  siteStatIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  siteStatValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  siteStatLabel: {
    fontSize: 11,
    color: "#9ca3af",
  },
  capacityBarContainer: {
    marginTop: 12,
  },
  capacityBar: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    overflow: "hidden",
  },
  capacityFill: {
    height: "100%",
    borderRadius: 3,
  },
  capacityText: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
    textAlign: "right",
  },
  tankList: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  tankListTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  tankItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
  },
  tankIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  tankDetails: {
    flex: 1,
  },
  tankHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tankName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
  },
  productBadge: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  productText: {
    fontSize: 10,
    color: "#6b7280",
    fontWeight: "500",
  },
  tankStockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  tankStock: {
    fontSize: 12,
    color: "#6b7280",
  },
  tankPercent: {
    fontSize: 12,
    fontWeight: "600",
  },
  tankBar: {
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
    marginTop: 6,
    overflow: "hidden",
  },
  tankFill: {
    height: "100%",
    borderRadius: 2,
  },
  tankUpdateText: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 6,
  },
  noTanksText: {
    fontSize: 13,
    color: "#9ca3af",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 16,
  },
  viewTransactionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  viewTransactionsText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2563eb",
    marginHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 12,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: "#9ca3af",
    marginTop: 12,
  },
});

export default SiteOverviewScreen;
