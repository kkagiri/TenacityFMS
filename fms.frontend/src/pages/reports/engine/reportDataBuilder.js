/**
 * File: reportDataBuilder.js
 * Purpose: Normalize source API responses into template-ready JSReport payloads.
 * Dependencies: None
 * Last Modified: 2026-02-12
 *
 * Key Functions:
 * - buildJsReportPayload(): Builds a unified payload for JSReport templates.
 */

const numberOrZero = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

const roundTo = (value, digits = 2) => {
    const n = numberOrZero(value);
    const factor = 10 ** digits;
    return Math.round(n * factor) / factor;
};

const formatNumber = (value, digits = 2) => {
    return numberOrZero(value).toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    });
};

const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatDateTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
};

const formatTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleTimeString();
};

const parseDateAssumeUtc = (value) => {
    if (!value) return null;

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    const raw = String(value).trim();
    if (!raw) return null;

    // Backend dates are stored in UTC; if timezone is missing, force UTC parsing.
    const hasTimezone = /(?:[zZ]|[+\-]\d{2}:?\d{2})$/.test(raw);
    const normalized = hasTimezone
        ? raw
        : `${raw.replace(' ', 'T').replace(/\//g, '-')}${raw.includes('T') || raw.includes(' ') ? 'Z' : 'T00:00:00Z'}`;

    const parsed = new Date(normalized);
    if (!Number.isNaN(parsed.getTime())) {
        return parsed;
    }

    const fallback = new Date(raw);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const formatUtcDateTimeToLocal = (value) => {
    const date = parseDateAssumeUtc(value);
    if (!date) return value ? String(value) : '-';
    return date.toLocaleString();
};

const calculateFuelAverage = (fuelAmount, distanceOrHours, isKmPerLiter) => {
    if (fuelAmount > 0 && distanceOrHours > 0) {
        const calculated = isKmPerLiter
            ? distanceOrHours / fuelAmount
            : fuelAmount / distanceOrHours;
        return roundTo(calculated, 2);
    }

    return 0;
};

const formatDuration = (totalSeconds) => {
    const seconds = Math.max(0, Math.floor(numberOrZero(totalSeconds)));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
};

const sumBy = (items, selector) => {
    return items.reduce((sum, item) => sum + numberOrZero(selector(item)), 0);
};

const averageBy = (items, selector) => {
    if (!items.length) return 0;
    return sumBy(items, selector) / items.length;
};

const getValue = (obj, keys) => {
    if (!obj || typeof obj !== 'object') {
        return null;
    }

    const entries = Object.entries(obj);
    for (const key of keys) {
        let value = obj?.[key];
        if (value === undefined) {
            const match = entries.find(([prop]) => String(prop).toLowerCase() === String(key).toLowerCase());
            value = match?.[1];
        }
        if (value !== undefined && value !== null && value !== '') {
            return value;
        }
    }
    return null;
};

const normalizeText = (value, fallback = '-') => {
    if (value === null || value === undefined) return fallback;
    const cleaned = String(value).replace(/\s+/g, ' ').trim();
    return cleaned || fallback;
};

const findRecordCollection = (input) => {
    if (Array.isArray(input)) {
        return { records: input, container: null };
    }

    if (!input || typeof input !== 'object') {
        return null;
    }

    const directKeys = ['records', 'items', 'transactions', 'data', 'Records', 'Items', 'Transactions', 'Data'];
    for (const key of directKeys) {
        if (Array.isArray(input[key])) {
            return { records: input[key], container: input };
        }
    }

    if (input.data && typeof input.data === 'object') {
        const nested = findRecordCollection(input.data);
        if (nested) {
            return nested;
        }
    }

    if (input.Data && typeof input.Data === 'object') {
        const nested = findRecordCollection(input.Data);
        if (nested) {
            return nested;
        }
    }

    return null;
};

const unwrapApiRecords = (apiResponse) => {
    const found = findRecordCollection(apiResponse);
    if (found) {
        return found;
    }

    if (!apiResponse || typeof apiResponse !== 'object') {
        return { records: [], container: null };
    }

    return { records: [apiResponse], container: apiResponse };
};

const buildDateAliases = (queryParams, container) => {
    const startValue =
        queryParams?.startDate ??
        queryParams?.dateFrom ??
        container?.startDate ??
        container?.dateFrom;

    const endValue =
        queryParams?.endDate ??
        queryParams?.dateTo ??
        container?.endDate ??
        container?.dateTo;

    const aliases = {};
    const normalizedStart = formatDate(startValue);
    const normalizedEnd = formatDate(endValue);

    if (normalizedStart) {
        aliases.startDate = normalizedStart;
        aliases.dateFrom = normalizedStart;
    }

    if (normalizedEnd) {
        aliases.endDate = normalizedEnd;
        aliases.dateTo = normalizedEnd;
    }

    return aliases;
};

const mapDefaultRecords = (rawRecords) => {
    return rawRecords.map((record, index) => ({
        rowNumber: index + 1,
        ...record,
    }));
};

const mapFuelRefill = (rawRecords) => {
    const mapped = rawRecords.map((record, index) => {
        const volumeValue = numberOrZero(getValue(record, ['manualFuelrefillAmount', 'volume', 'totalFuelAmount']));
        const previousReading = numberOrZero(getValue(record, ['previousMeterReading']));
        const currentReading = numberOrZero(getValue(record, ['currentMeterReading']));
        const distanceOrHours = currentReading - previousReading;
        const isKmPerLiter = Boolean(getValue(record, ['isKmPerLiter', 'averageKmL']));
        const averageValue = calculateFuelAverage(volumeValue, distanceOrHours, isKmPerLiter);
        const fuelAverageUnit = isKmPerLiter ? 'Km/L' : 'L/Hr';
        const vehicleId = getValue(record, ['vehicleId']);
        const siteId = getValue(record, ['siteId']);
        const resolvedSiteName =
            getValue(record, ['siteName']) ||
            record?.site?.name ||
            record?.siteNavigation?.name;

        return {
            rowNumber: index + 1,
            dateTime: formatUtcDateTimeToLocal(getValue(record, ['dateTime', 'date', 'createdOn', 'dateCreated'])),
            vehicleName: normalizeText(getValue(record, ['vehicleName', 'hyoungNo', 'vehicleInfo']) || (vehicleId ? `Vehicle #${vehicleId}` : '-')),
            siteName: normalizeText(resolvedSiteName || (siteId ? `Site #${siteId}` : '-')),
            volume: formatNumber(volumeValue),
            fuelAverage: formatNumber(averageValue),
            fuelAverageUnit,
        };
    });

    const totalVolume = sumBy(rawRecords, (r) => getValue(r, ['manualFuelrefillAmount', 'volume', 'totalFuelAmount']));
    const totalDistanceOrHours = sumBy(
        rawRecords,
        (r) => numberOrZero(getValue(r, ['currentMeterReading'])) - numberOrZero(getValue(r, ['previousMeterReading'])));
    const kmPerLiterCount = rawRecords.filter((r) => Boolean(getValue(r, ['isKmPerLiter', 'averageKmL']))).length;
    const hourBasedCount = rawRecords.length - kmPerLiterCount;
    const mixedUnitMode = kmPerLiterCount > 0 && hourBasedCount > 0;
    const summaryIsKmPerLiter = kmPerLiterCount >= hourBasedCount;
    const summaryFuelAverage = mixedUnitMode
        ? averageBy(rawRecords, (r) => {
            const fuel = numberOrZero(getValue(r, ['manualFuelrefillAmount', 'volume', 'totalFuelAmount']));
            const diff = numberOrZero(getValue(r, ['currentMeterReading'])) - numberOrZero(getValue(r, ['previousMeterReading']));
            const isKm = Boolean(getValue(r, ['isKmPerLiter', 'averageKmL']));
            return calculateFuelAverage(fuel, diff, isKm);
        })
        : calculateFuelAverage(totalVolume, totalDistanceOrHours, summaryIsKmPerLiter);
    const summaryFuelAverageUnit = mixedUnitMode
        ? 'Km/L or L/Hr'
        : (summaryIsKmPerLiter ? 'Km/L' : 'L/Hr');
    const uniqueVehicles = new Set(rawRecords.map((r) => getValue(r, ['vehicleId', 'vehicleName', 'hyoungNo'])).filter(Boolean)).size;

    return {
        records: mapped,
        summary: {
            totalRecords: mapped.length,
            totalRefills: mapped.length,
            totalVolume: formatNumber(totalVolume),
            fuelAverage: formatNumber(summaryFuelAverage),
            fuelAverageUnit: summaryFuelAverageUnit,
            uniqueVehicles,
        },
    };
};

const mapVehicleConsumption = (rawRecords) => {
    const mapped = rawRecords.map((record, index) => {
        const volumeValue = numberOrZero(getValue(record, ['totalFuelAmount', 'volume', 'totalVolume']));
        const distanceValue = numberOrZero(getValue(record, ['distanceOrEngineHours', 'distance', 'totalDistance']));
        const consumptionValue = numberOrZero(getValue(record, ['consumption', 'avgConsumption']));
        const costValue = numberOrZero(getValue(record, ['cost', 'totalCost']));

        return {
            rowNumber: index + 1,
            vehicleName: getValue(record, ['vehicleName', 'hyoungNo', 'vehicleInfo']) || '-',
            numberPlate: getValue(record, ['numberPlate', 'hyoungNo']) || '-',
            vehicleType: getValue(record, ['vehicleType']) || '-',
            siteName: getValue(record, ['workingSiteName', 'siteName']) || '-',
            refillCount: numberOrZero(getValue(record, ['refillCount'])),
            volume: formatNumber(volumeValue),
            totalVolume: formatNumber(volumeValue),
            distance: formatNumber(distanceValue),
            totalDistance: formatNumber(distanceValue),
            consumption: formatNumber(consumptionValue),
            cost: formatNumber(costValue),
        };
    });

    const totalVolume = sumBy(rawRecords, (r) => getValue(r, ['totalFuelAmount', 'volume', 'totalVolume']));
    const totalDistance = sumBy(rawRecords, (r) => getValue(r, ['distanceOrEngineHours', 'distance', 'totalDistance']));
    const totalCost = sumBy(rawRecords, (r) => getValue(r, ['cost', 'totalCost']));
    const avgConsumption = averageBy(rawRecords, (r) => getValue(r, ['consumption', 'avgConsumption']));

    return {
        records: mapped,
        summary: {
            totalRecords: mapped.length,
            totalVehicles: mapped.length,
            totalVolume: formatNumber(totalVolume),
            totalFuel: formatNumber(totalVolume),
            totalDistance: formatNumber(totalDistance),
            totalCost: formatNumber(totalCost),
            avgConsumption: formatNumber(avgConsumption),
        },
    };
};

const mapDelivery = (rawRecords) => {
    const mapped = rawRecords.map((record, index) => {
        const volumeValue = numberOrZero(getValue(record, ['manualDeliveryAmount', 'volume', 'totalVolume']));
        const pricePerLiter = numberOrZero(getValue(record, ['pricePerLiter', 'price']));
        const explicitCost = numberOrZero(getValue(record, ['cost', 'totalCost']));
        const costValue = explicitCost > 0 ? explicitCost : volumeValue * pricePerLiter;
        const supplierId = getValue(record, ['supplierId']);
        const tankId = getValue(record, ['tankId']);

        return {
            rowNumber: index + 1,
            deliveryDate: formatDate(getValue(record, ['deliveryDate', 'date', 'dateTime'])),
            supplierName: getValue(record, ['supplierName']) || (supplierId ? `Supplier #${supplierId}` : '-'),
            tankName: getValue(record, ['tankName']) || (tankId ? `Tank #${tankId}` : '-'),
            fuelGradeName: getValue(record, ['fuelGradeName', 'product']) || '-',
            volume: formatNumber(volumeValue),
            cost: formatNumber(costValue),
            siteName: getValue(record, ['siteName', 'site']) || '-',
        };
    });

    const totalVolume = sumBy(rawRecords, (r) => getValue(r, ['manualDeliveryAmount', 'volume', 'totalVolume']));
    const totalCost = sumBy(rawRecords, (r) => {
        const volumeValue = numberOrZero(getValue(r, ['manualDeliveryAmount', 'volume', 'totalVolume']));
        const explicitCost = numberOrZero(getValue(r, ['cost', 'totalCost']));
        if (explicitCost > 0) return explicitCost;
        const pricePerLiter = numberOrZero(getValue(r, ['pricePerLiter', 'price']));
        return volumeValue * pricePerLiter;
    });
    const uniqueTanks = new Set(rawRecords.map((r) => getValue(r, ['tankId', 'tankName'])).filter(Boolean)).size;

    return {
        records: mapped,
        summary: {
            totalRecords: mapped.length,
            totalDeliveries: mapped.length,
            totalVolume: formatNumber(totalVolume),
            totalCost: formatNumber(totalCost),
            uniqueTanks,
        },
    };
};

const mapDeviceOffline = (rawRecords) => {
    const flattened = [];
    const now = Date.now();

    rawRecords.forEach((record) => {
        const deviceName = getValue(record, ['deviceName', 'deviceId']) || '-';
        const siteName = getValue(record, ['siteName']) || '-';
        const periods = Array.isArray(record?.periods) ? record.periods : [];

        if (!periods.length) {
            flattened.push({
                deviceName,
                siteName,
                offlineAt: formatDateTime(getValue(record, ['date'])),
                onlineAt: '-',
                duration: formatDuration(getValue(record, ['totalOfflineSeconds'])),
                isOnline: false,
            });
            return;
        }

        periods.forEach((period) => {
            const startAt = getValue(period, ['startAt']);
            const endAt = getValue(period, ['endAt']);
            const durationSeconds = numberOrZero(getValue(period, ['durationSeconds']));
            const resolvedDuration =
                durationSeconds > 0
                    ? durationSeconds
                    : Math.max(0, (new Date(endAt).getTime() - new Date(startAt).getTime()) / 1000);

            flattened.push({
                deviceName,
                siteName,
                offlineAt: formatDateTime(startAt),
                onlineAt: endAt ? formatDateTime(endAt) : '-',
                duration: formatDuration(resolvedDuration),
                isOnline: Boolean(endAt) && new Date(endAt).getTime() < now,
            });
        });
    });

    const mapped = flattened.map((row, index) => ({
        rowNumber: index + 1,
        ...row,
    }));

    const totalEvents = sumBy(rawRecords, (r) => getValue(r, ['offlineCount'])) || mapped.length;
    const totalOfflineSeconds = sumBy(rawRecords, (r) => getValue(r, ['totalOfflineSeconds']));
    const affectedDevices = new Set(rawRecords.map((r) => getValue(r, ['deviceId', 'deviceName'])).filter(Boolean)).size;

    return {
        records: mapped,
        summary: {
            totalRecords: mapped.length,
            totalEvents,
            totalDowntime: formatDuration(totalOfflineSeconds),
            affectedDevices,
            avgDuration: formatDuration(totalEvents > 0 ? totalOfflineSeconds / totalEvents : 0),
        },
    };
};

const mapPtsDevice = (rawRecords) => {
    const mapped = rawRecords.map((record, index) => {
        const status = String(getValue(record, ['connectionStatus', 'status']) || '');
        const isOnline =
            getValue(record, ['isOnline']) === true ||
            /connected|online|active/i.test(status);
        const siteName = getValue(record, ['siteName']) || record?.siteNavigation?.name || record?.site?.name || '-';

        return {
            rowNumber: index + 1,
            deviceName: getValue(record, ['ptsName', 'deviceName', 'ptsid']) || '-',
            siteName,
            ipAddress: getValue(record, ['ipAddress', 'ip', 'deviceIp']) || '-',
            isOnline,
            lastSeenAt: formatDateTime(getValue(record, ['lastSeenAt', 'lastSeen', 'dateModified', 'dateCreated'])),
            uptimePercent: numberOrZero(getValue(record, ['uptimePercent'])),
            firmwareVersion: getValue(record, ['firmwareVersion', 'version']) || '-',
        };
    });

    const totalDevices = mapped.length;
    const onlineCount = mapped.filter((x) => x.isOnline).length;
    const offlineCount = totalDevices - onlineCount;
    const uptimePercent = totalDevices > 0 ? (onlineCount / totalDevices) * 100 : 0;

    return {
        records: mapped,
        summary: {
            totalRecords: mapped.length,
            totalDevices,
            onlineCount,
            offlineCount,
            uptimePercent: formatNumber(uptimePercent, 1),
        },
    };
};

const TANK_CHANGE_REASON_MAP = {
    0: 'OpeningStock',
    1: 'ClosingStock',
    2: 'Delivery',
    3: 'TransferIn',
    4: 'TransferOut',
    5: 'Adjustment',
    6: 'Manual Dispensing',
    7: 'AutomatedDispensing',
    8: 'Reconciliation',
    9: 'AutomatedReconciliation',
    10: 'InTankDelivery',
};

const resolveTankTransactionType = (record) => {
    const explicit = getValue(record, ['changeReasonDisplay', 'transactionType', 'eventType']);
    if (explicit) {
        return normalizeText(explicit, 'Unknown');
    }

    const raw = getValue(record, ['changeReason']);
    if (raw === null || raw === undefined) {
        return 'Unknown';
    }

    if (typeof raw === 'number') {
        return TANK_CHANGE_REASON_MAP[raw] || `Reason-${raw}`;
    }

    const numeric = Number(raw);
    if (Number.isFinite(numeric) && TANK_CHANGE_REASON_MAP[numeric]) {
        return TANK_CHANGE_REASON_MAP[numeric];
    }

    return normalizeText(raw, 'Unknown');
};

const isTankEventMatch = (eventType, patterns) => {
    const value = String(eventType || '').toLowerCase();
    return patterns.some((p) => value.includes(p));
};

/**
 * Maps a VolumeChangeReasonEnum string name to the CSS class used in the template.
 * Template classes: type-dispense | type-refill | type-transfer | type-adjust
 */
const getChangeReasonClass = (transactionType) => {
    const t = String(transactionType || '').toLowerCase();
    if (t.includes('dispensing') || t === 'dispensed') return 'type-dispense';
    if (t.includes('delivery') || t.includes('intankdelivery')) return 'type-refill';
    if (t.includes('transfer')) return 'type-transfer';
    return 'type-adjust'; // OpeningStock, ClosingStock, Adjustment, Reconciliation, etc.
};

/**
 * Transforms raw TankVolumeHistoryDTO[] records into the shape expected by
 * the 'tank-volume-history-report' jsReport Handlebars template.
 *
 * Template expectations (must match backend BuildTankVolumeHistoryPayload):
 *   summary.totalTransactions, summary.totalDispensed, summary.totalTransfer,
 *   summary.totalDelivery, summary.netBalanceChange, summary.grandClosingBalance
 *   siteGroups[]  ({{#each siteGroups}} → siteName, tanks[], transactionGroups[])
 *     tanks[] per site: tankName, fuelType, openingBalance, closingBalance,
 *       expectedClosing, expectedMatch,
 *       dispensing.{total,count}, delivery.{total,count}, transfer.{total,count}
 *     transactionGroups[] per site: groupName, fuelType, openingBalance,
 *       closingBalance, groupNet, rows[]
 *       each row: rowNumber, siteName, tankName, vehiclePlate,
 *         timestamp.{date,time}, changeReasonClass, changeReasonLabel,
 *         volumeChange, balanceAfter, operatorName, notes, isPositive
 */
/**
 * Builds daily consumption totals for the last N days from dispensing rows.
 * Returns array of { label: 'Mon', value: 123.45 } sorted oldest→newest.
 */
const buildDailyConsumptionTrend = (dispensingRows, numDays = 2) => {
    if (!dispensingRows || dispensingRows.length === 0) return [];

    // Group dispensing by date
    const dailyMap = {};
    dispensingRows.forEach((r) => {
        const raw = r.timestamp?.raw;
        if (!raw) return;
        const dateKey = new Date(raw).toISOString().slice(0, 10);
        dailyMap[dateKey] = (dailyMap[dateKey] || 0) + Math.abs(r._volumeChangeRaw);
    });

    // Sort dates ascending, take last N
    const sortedDates = Object.keys(dailyMap).sort().slice(-numDays);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const dayEntries = sortedDates.map((dateStr) => {
        const d = new Date(dateStr + 'T00:00:00Z');
        return {
            label: dayNames[d.getUTCDay()],
            date: dateStr,
            value: Math.round(dailyMap[dateStr] * 100) / 100,
            formatted: formatNumber(dailyMap[dateStr]),
        };
    });

    // Add barHeight % – tallest bar = 100%, rest proportional (min 15%)
    const maxVal = Math.max(...dayEntries.map((d) => d.value), 1);
    dayEntries.forEach((d) => {
        d.barHeight = Math.max(Math.round((d.value / maxVal) * 100), 15);
    });

    return dayEntries;
};

const buildFiveDaySparkTrend = (rows, valueSelector) => {
    if (!rows || rows.length === 0) {
        return {
            direction: 'neutral',
            isUp: false,
            isDown: false,
            points: '2,8 7,8 12,8 17,8 22,8',
        };
    }

    const dailyMap = {};
    rows.forEach((row) => {
        const raw = row.timestamp?.raw;
        if (!raw) return;
        const dateKey = new Date(raw).toISOString().slice(0, 10);
        dailyMap[dateKey] = (dailyMap[dateKey] || 0) + (valueSelector(row) || 0);
    });

    const sortedKeys = Object.keys(dailyMap).sort();
    const latestKey = sortedKeys[sortedKeys.length - 1];
    const latestDate = new Date(`${latestKey}T00:00:00Z`);

    const points = [];
    for (let offset = 4; offset >= 0; offset -= 1) {
        const d = new Date(latestDate);
        d.setUTCDate(d.getUTCDate() - offset);
        const key = d.toISOString().slice(0, 10);
        points.push({ dateKey: key, value: dailyMap[key] || 0 });
    }

    if (points.length === 0) {
        return {
            direction: 'neutral',
            isUp: false,
            isDown: false,
            points: '2,8 7,8 12,8 17,8 22,8',
        };
    }

    const last = points[points.length - 1].value;
    const previous = points[points.length - 2].value;
    const direction = last > previous ? 'rise' : last < previous ? 'fall' : 'neutral';

    const values = points.map((p) => p.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const toY = (value) => {
        if (maxVal === minVal) return 8;
        const normalized = (value - minVal) / (maxVal - minVal);
        return Math.round(14 - (normalized * 10));
    };

    const xPoints = [2, 7, 12, 17, 22];
    const polylinePoints = points
        .map((point, index) => `${xPoints[index]},${toY(point.value)}`)
        .join(' ');

    return {
        direction,
        isUp: direction === 'rise',
        isDown: direction === 'fall',
        points: polylinePoints,
    };
};

const buildLast2DispensingDays = (dispensingRows, allTankRows, maxPreviousDays = 3) => {
    if (!allTankRows || allTankRows.length === 0) return [];

    const dailyMap = {};
    dispensingRows.forEach((row) => {
        const raw = row.timestamp?.raw;
        if (!raw) return;
        const dateKey = new Date(raw).toISOString().slice(0, 10);
        dailyMap[dateKey] = (dailyMap[dateKey] || 0) + Math.abs(row._volumeChangeRaw || 0);
    });

    const validDates = allTankRows
        .map((row) => row.timestamp?.raw)
        .filter(Boolean)
        .map((raw) => new Date(raw));
    if (validDates.length === 0) return [];

    const anchorDate = new Date(Math.max(...validDates.map((d) => d.getTime())));
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const used = new Set();

    const targets = [2, 1].map((daysBack) => {
        const d = new Date(anchorDate);
        d.setUTCDate(d.getUTCDate() - daysBack);
        return d;
    });

    const result = [];
    targets.forEach((targetDate) => {
        let selectedKey = null;
        for (let offset = 0; offset <= maxPreviousDays; offset += 1) {
            const candidate = new Date(targetDate);
            candidate.setUTCDate(candidate.getUTCDate() - offset);
            const key = candidate.toISOString().slice(0, 10);
            if (dailyMap[key] !== undefined && !used.has(key)) {
                selectedKey = key;
                used.add(key);
                break;
            }
        }

        if (!selectedKey) return;
        const selectedDate = new Date(`${selectedKey}T00:00:00Z`);
        result.push({
            date: selectedKey,
            label: dayNames[selectedDate.getUTCDay()],
            value: Math.round((dailyMap[selectedKey] || 0) * 100) / 100,
            formatted: formatNumber(dailyMap[selectedKey] || 0),
        });
    });

    return result;
};

const mapTankVolumeHistory = (rawRecords, container) => {
    // ── 1. Map each DTO record to a normalised row object ──────────────────────
    let globalRowNumber = 1;
    const allRows = rawRecords.map((record) => {
        const transactionType = resolveTankTransactionType(record);
        const ts = getValue(record, ['timestamp', 'periodStart', 'dateTime']);
        const volumeChangeRaw = numberOrZero(getValue(record, ['volumeChange', 'totalVolume', 'volume']));
        const newVolumeRaw = numberOrZero(getValue(record, ['newVolume', 'totalVolume']));
        const tankId = getValue(record, ['tankId']) || 'unknown';
        const tankName = normalizeText(
            getValue(record, ['tankName']) || (tankId !== 'unknown' ? `Tank #${tankId}` : '-'),
        );
        const changeReasonDisplay = normalizeText(getValue(record, ['changeReasonDisplay']), '');

        return {
            // Internal grouping keys (not rendered directly by template)
            _tankId: tankId,
            _volumeChangeRaw: volumeChangeRaw,
            _newVolumeRaw: newVolumeRaw,
            // Template row fields
            rowNumber: globalRowNumber++,
            tankName,
            siteName: normalizeText(getValue(record, ['siteName', 'site']), '-'),
            vehiclePlate: normalizeText(getValue(record, ['vehicleName', 'vehicleHyoungNo']), ''),
            operatorName: normalizeText(getValue(record, ['recordedByUserName', 'recordedBy']), '-'),
            timestamp: {
                date: formatDate(ts),
                time: formatTime(parseDateAssumeUtc(ts) || ts),
                raw: ts,
            },
            changeReasonClass: getChangeReasonClass(transactionType),
            changeReasonLabel: changeReasonDisplay || transactionType,
            transactionType,
            volumeChange: formatNumber(volumeChangeRaw),
            balanceAfter: formatNumber(newVolumeRaw),
            notes: normalizeText(getValue(record, ['referenceType']), ''),
            isPositive: volumeChangeRaw >= 0,
            // Type flags used for group sub-totals
            isDelivery: isTankEventMatch(transactionType, ['delivery', 'intankdelivery']),
            isDispensing: isTankEventMatch(transactionType, ['dispensing']),
            isTransfer: isTankEventMatch(transactionType, ['transfer']),
        };
    });

    // ── 2. Group rows by tank, then by site ────────────────────────────────────
    // First group by tankId → tankName + rows
    const tankGroupMap = new Map();
    allRows.forEach((row) => {
        const key = row._tankId !== 'unknown' ? row._tankId : row.tankName;
        if (!tankGroupMap.has(key)) {
            tankGroupMap.set(key, { tankName: row.tankName, siteName: row.siteName, rows: [] });
        }
        tankGroupMap.get(key).rows.push(row);
    });

    // Build per-tank data objects (tankEntry + txGroup), keyed by site
    const siteMap = new Map(); // siteName → { tanks: [], transactionGroups: [] }
    let grandClosingBalanceRaw = 0;
    let globalTotalVarianceRaw = 0;

    tankGroupMap.forEach(({ tankName, siteName, rows }) => {
        const firstRow = rows[0];
        const lastRow = rows[rows.length - 1];

        // Opening balance = balance before the first recorded change
        const openingBalanceRaw = firstRow
            ? firstRow._newVolumeRaw - firstRow._volumeChangeRaw
            : 0;
        const closingBalanceRaw = lastRow ? lastRow._newVolumeRaw : 0;
        grandClosingBalanceRaw += closingBalanceRaw;

        const groupNetRaw = rows.reduce((sum, r) => sum + r._volumeChangeRaw, 0);

        // Per-type sub-totals
        const dispensingRows = rows.filter((r) => r.isDispensing);
        const deliveryRows = rows.filter((r) => r.isDelivery);
        const transferRows = rows.filter((r) => r.isTransfer);

        const dispensingTotal = dispensingRows.reduce((s, r) => s + Math.abs(r._volumeChangeRaw), 0);
        const deliveryTotal = deliveryRows.reduce((s, r) => s + r._volumeChangeRaw, 0);
        const transferTotal = transferRows.reduce((s, r) => s + r._volumeChangeRaw, 0);

        // Expected closing = opening + deliveries + net transfers (positive=in, negative=out) - dispensing
        const expectedClosingRaw = openingBalanceRaw + deliveryTotal + transferTotal - dispensingTotal;
        const expectedMatch = Math.abs(expectedClosingRaw - closingBalanceRaw) < 1;

        // Variance = Actual Closing − Expected Closing (negative = loss/shortage)
        const tankVarianceRaw = closingBalanceRaw - expectedClosingRaw;
        globalTotalVarianceRaw += tankVarianceRaw;

        // ── Last 2 days consumption trend (sparkline data) ────────────────────
        const trendDays = buildDailyConsumptionTrend(dispensingRows, 2);
        const trendDirection = trendDays.length >= 2
            ? (trendDays[trendDays.length - 1].value > trendDays[trendDays.length - 2].value ? 'up' : trendDays[trendDays.length - 1].value < trendDays[trendDays.length - 2].value ? 'down' : 'flat')
            : 'flat';
        const last2DispensingDays = buildLast2DispensingDays(dispensingRows, rows, 3);

        const tankEntry = {
            tankName,
            fuelType: '',
            openingBalance: formatNumber(openingBalanceRaw),
            closingBalance: formatNumber(closingBalanceRaw),
            expectedClosing: formatNumber(expectedClosingRaw),
            expectedMatch,
            variance: {
                value: formatNumber(tankVarianceRaw),
                formatted: (tankVarianceRaw >= 0 ? '+' : '') + formatNumber(tankVarianceRaw),
                isNegative: tankVarianceRaw < 0,
                percentage: openingBalanceRaw !== 0
                    ? ((tankVarianceRaw / openingBalanceRaw) * 100).toFixed(1)
                    : '0.0',
            },
            consumptionTrend: {
                days: trendDays,
                direction: trendDirection,
                isUp: trendDirection === 'up',
                isDown: trendDirection === 'down',
            },
            dispensing: {
                total: formatNumber(dispensingTotal),
                count: dispensingRows.length,
                last2Days: last2DispensingDays,
            },
            delivery: {
                total: formatNumber(deliveryTotal),
                count: deliveryRows.length,
            },
            transfer: {
                total: formatNumber(Math.abs(transferTotal)),
                count: transferRows.length,
            },
        };

        const txGroup = {
            groupName: tankName,
            fuelType: '',
            openingBalance: formatNumber(openingBalanceRaw),
            closingBalance: formatNumber(closingBalanceRaw),
            groupNet: formatNumber(groupNetRaw),
            rows, // already numbered globally
        };

        if (!siteMap.has(siteName)) {
            siteMap.set(siteName, { tanks: [], transactionGroups: [] });
        }
        siteMap.get(siteName).tanks.push(tankEntry);
        siteMap.get(siteName).transactionGroups.push(txGroup);
    });

    // ── 3. Build siteGroups array (matches backend structure) ──────────────────
    const siteGroups = [];
    siteMap.forEach((siteData, siteName) => {
        // Compute site-level average daily consumption
        const siteTotalDispensing = siteData.tanks.reduce((sum, t) => {
            const val = typeof t.dispensing?.total === 'string'
                ? parseFloat(t.dispensing.total.replace(/,/g, '')) || 0
                : (t.dispensing?.total || 0);
            return sum + val;
        }, 0);

        // Calculate report date span for daily average
        const siteRows = siteData.transactionGroups.flatMap(g => g.rows || []);
        const siteDates = siteRows
            .map(r => r.timestamp?.raw)
            .filter(Boolean)
            .map(d => new Date(d).toISOString().slice(0, 10));
        const uniqueDays = [...new Set(siteDates)].length || 1;
        const avgDailyConsumption = siteTotalDispensing / uniqueDays;

        siteGroups.push({
            siteName,
            tanks: siteData.tanks,
            transactionGroups: siteData.transactionGroups,
            siteSummary: {
                totalDispensing: formatNumber(siteTotalDispensing),
                avgDailyConsumption: formatNumber(avgDailyConsumption),
                daysInPeriod: uniqueDays,
            },
        });
    });
    siteGroups.sort((a, b) => a.siteName.localeCompare(b.siteName));

    // ── 4. Build top-level summary ─────────────────────────────────────────────
    const totalDeliveryRaw = allRows
        .filter((r) => r.isDelivery)
        .reduce((s, r) => s + Math.abs(r._volumeChangeRaw), 0);
    const totalDispensedRaw = allRows
        .filter((r) => r.isDispensing)
        .reduce((s, r) => s + Math.abs(r._volumeChangeRaw), 0);
    const totalTransferRaw = allRows
        .filter((r) => r.isTransfer)
        .reduce((s, r) => s + Math.abs(r._volumeChangeRaw), 0);
    const netBalanceChange = totalDeliveryRaw + totalTransferRaw - totalDispensedRaw;

    const trends = {
        transactions: buildFiveDaySparkTrend(allRows, () => 1),
        dispensed: buildFiveDaySparkTrend(allRows, (row) => (row.isDispensing ? Math.abs(row._volumeChangeRaw) : 0)),
        transfer: buildFiveDaySparkTrend(allRows, (row) => (row.isTransfer ? Math.abs(row._volumeChangeRaw) : 0)),
        delivery: buildFiveDaySparkTrend(allRows, (row) => (row.isDelivery ? Math.abs(row._volumeChangeRaw) : 0)),
        variance: buildFiveDaySparkTrend(allRows, (row) => {
            const magnitude = Math.abs(row._volumeChangeRaw);
            if (row.isDelivery || row.isTransfer) return magnitude;
            if (row.isDispensing) return -magnitude;
            return 0;
        }),
    };

    // ── Analytics — chart data for 7-day dispensing + vehicle type ──────
    const dispensingRows = allRows.filter((r) => r.isDispensing);

    // Daily dispensing grouped by date
    const dailyMap = new Map();
    dispensingRows.forEach((r) => {
        const dateKey = r.timestamp?.date || 'Unknown';
        dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + Math.abs(r._volumeChangeRaw));
    });
    const dailyEntries = Array.from(dailyMap.entries())
        .map(([date, vol]) => ({ date, volume: Math.round(vol * 100) / 100 }))
        .sort((a, b) => a.date.localeCompare(b.date));
    const last7 = dailyEntries.length > 7 ? dailyEntries.slice(-7) : dailyEntries;

    const sevenDayTotal = last7.reduce((s, d) => s + d.volume, 0);
    const dailyAverage = last7.length > 0 ? Math.round(sevenDayTotal / last7.length) : 0;
    const peakDay = [...last7].sort((a, b) => b.volume - a.volume)[0] || null;
    const lowestDay = last7.filter((d) => d.volume > 0).sort((a, b) => a.volume - b.volume)[0] || null;

    // Vehicle type consumption
    const vtMap = new Map();
    dispensingRows.forEach((r) => {
        const vt = r.notes || 'Other';
        vtMap.set(vt, (vtMap.get(vt) || 0) + Math.abs(r._volumeChangeRaw));
    });
    const vehicleTypeGroups = Array.from(vtMap.entries())
        .map(([type, litres]) => ({ type, litres: Math.round(litres * 100) / 100 }))
        .sort((a, b) => b.litres - a.litres)
        .slice(0, 7);
    const vtTotal = vehicleTypeGroups.reduce((s, v) => s + v.litres, 0);

    const avgPerFill = dispensingRows.length > 0
        ? (totalDispensedRaw / dispensingRows.length).toFixed(1)
        : '0.0';
    const activeVehicles = new Set(
        dispensingRows.filter((r) => r.vehiclePlate && r.vehiclePlate !== '\u2014').map((r) => r.vehiclePlate)
    ).size;

    const chartData = {
        dailyDispensing: {
            labels: last7.map((d) => d.date),
            data: last7.map((d) => d.volume),
        },
        vehicleTypeConsumption: {
            labels: vehicleTypeGroups.map((v) => v.type),
            data: vehicleTypeGroups.map((v) => v.litres),
            total: vtTotal,
        },
    };

    const analytics = {
        kpis: {
            sevenDayTotal: formatNumber(sevenDayTotal) + ' L',
            dailyAverage: formatNumber(dailyAverage) + ' L',
            peakDayLabel: peakDay ? peakDay.date : '\u2014',
            peakDayVolume: peakDay ? formatNumber(peakDay.volume) : '0',
            lowestDayLabel: lowestDay ? lowestDay.date : '\u2014',
            lowestDayVolume: lowestDay ? formatNumber(lowestDay.volume) : '0',
            avgPerVehicleFill: avgPerFill,
            fleetActiveCount: activeVehicles,
        },
    };

    return {
        records: allRows,
        siteGroups,
        summary: {
            totalRecords: allRows.length,
            totalTransactions: allRows.length,
            totalDispensed: formatNumber(totalDispensedRaw),
            totalTransfer: formatNumber(totalTransferRaw),
            totalDelivery: formatNumber(totalDeliveryRaw),
            netBalanceChange: formatNumber(netBalanceChange),
            grandClosingBalance: formatNumber(grandClosingBalanceRaw),
            totalVariance: {
                value: formatNumber(globalTotalVarianceRaw),
                formatted: (globalTotalVarianceRaw >= 0 ? '+' : '') + formatNumber(globalTotalVarianceRaw),
                isNegative: globalTotalVarianceRaw < 0,
            },
            trends,
            tanksMonitored: tankGroupMap.size,
            sitesMonitored: siteMap.size,
        },
        analytics,
        analyticsJson: JSON.stringify(chartData),
    };
};

const mapIssueTracker = (rawRecords, container, queryParams) => {
    const pageNumber = numberOrZero(getValue(container, ['pageNumber'])) || numberOrZero(queryParams?.pageNumber) || 1;
    const pageSize = numberOrZero(getValue(container, ['pageSize'])) || numberOrZero(queryParams?.pageSize) || rawRecords.length || 1;
    const baseRowIndex = Math.max(0, (pageNumber - 1) * pageSize);

    const mapped = rawRecords.map((record, index) => {
        const issueId = numberOrZero(getValue(record, ['id', 'issueId']));
        const siteId = numberOrZero(getValue(record, ['siteId']));
        const vehicleId = numberOrZero(getValue(record, ['vehicleId']));
        const vehicleHyoungNo = getValue(record, ['vehicleHyoungNo', 'vehicleName']);
        const vehicleNumber = getValue(record, ['vehicleNumber', 'numberPlate']);

        const resolvedVehicle =
            normalizeText(vehicleHyoungNo, '') ||
            normalizeText(vehicleNumber, '') ||
            (vehicleId > 0 ? `Vehicle #${vehicleId}` : '-');

        return {
            rowNumber: baseRowIndex + index + 1,
            issueId: issueId || '-',
            openDate: formatUtcDateTimeToLocal(getValue(record, ['openDate'])),
            dueDate: formatUtcDateTimeToLocal(getValue(record, ['dueDate'])),
            closingDate: formatUtcDateTimeToLocal(getValue(record, ['closingDate'])),
            siteName: normalizeText(getValue(record, ['siteName']) || (siteId > 0 ? `Site #${siteId}` : '-')),
            vehicleName: resolvedVehicle,
            issueTemplateName: normalizeText(getValue(record, ['templateName', 'issueTemplateName']), '-'),
            statusName: normalizeText(getValue(record, ['statusName']), '-'),
            categoryName: normalizeText(getValue(record, ['categoryName']), '-'),
            priorityName: normalizeText(getValue(record, ['priorityName']), '-'),
            problemTitle: normalizeText(getValue(record, ['problemTitle']), '-'),
            problemDescription: normalizeText(getValue(record, ['problemDescription']), ''),
            assignedTo: normalizeText(getValue(record, ['assignToUserName', 'assignedToUserName']), '-'),
            openedBy: normalizeText(getValue(record, ['openbyUserName', 'openedByUserName']), '-'),
            isAutoCreated: Boolean(getValue(record, ['isAutoCreated'])),
            canAutoClose: Boolean(getValue(record, ['canAutoClose'])),
        };
    });

    const totalIssues = numberOrZero(getValue(container, ['totalRecords'])) || mapped.length;
    const closedIssues = numberOrZero(getValue(container, ['closedIssues'])) ||
        mapped.filter((row) => /closed|resolved|complete/i.test(row.statusName)).length;
    const openIssues = numberOrZero(getValue(container, ['openIssues'])) ||
        Math.max(0, totalIssues - closedIssues);
    const autoCreatedIssues = numberOrZero(getValue(container, ['autoCreatedIssues'])) ||
        mapped.filter((row) => row.isAutoCreated).length;
    const totalPages = numberOrZero(getValue(container, ['totalPages'])) ||
        Math.ceil(totalIssues / Math.max(pageSize, 1));

    return {
        records: mapped,
        summary: {
            totalRecords: totalIssues,
            totalIssues,
            openIssues,
            closedIssues,
            autoCreatedIssues,
            pageNumber,
            pageSize,
            totalPages,
        },
    };
};

/**
 * Transforms raw TankVolumeHistoryDTO[] records into a monthly/yearly aggregated
 * summary for the 'transaction-history-summary-report' template.
 *
 * Template structure:
 *   summary: { totalTransactions, totalDispensed, totalDelivery, totalTransfer, netVariance }
 *   monthlyGroups[]: { month, monthLabel, year,
 *     siteGroups[]: { siteName,
 *       tanks[]: { tankName, openingBalance, closingBalance, expectedClosing,
 *                  dispensing.{total,count}, delivery.{total,count}, transfer.{total,count},
 *                  variance, variancePercent, avgDailyConsumption }
 *       subtotal: { dispensing, delivery, transfer, variance }
 *     }
 *   }
 *   grandTotal: { dispensing, delivery, transfer, variance }
 */
const mapTransactionHistorySummary = (rawRecords) => {
    // ── 1. Normalise each record ────────────────────────────────────────────────
    const rows = rawRecords.map((record) => {
        const transactionType = resolveTankTransactionType(record);
        const ts = getValue(record, ['timestamp', 'periodStart', 'dateTime']);
        const volumeChangeRaw = numberOrZero(getValue(record, ['volumeChange', 'totalVolume', 'volume']));
        const newVolumeRaw = numberOrZero(getValue(record, ['newVolume', 'totalVolume']));
        const tankId = getValue(record, ['tankId']) || 'unknown';
        const tankName = normalizeText(
            getValue(record, ['tankName']) || (tankId !== 'unknown' ? `Tank #${tankId}` : '-'),
        );
        const siteName = normalizeText(getValue(record, ['siteName', 'site']), '-');
        const parsed = parseDateAssumeUtc(ts);
        const monthKey = parsed
            ? `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`
            : 'unknown';

        const vehicleName = normalizeText(getValue(record, ['vehicleName', 'vehicle']), '');
        const vehicleType = normalizeText(getValue(record, ['vehicleType']), '');

        return {
            tankId,
            tankName,
            siteName,
            monthKey,
            timestamp: parsed,
            volumeChangeRaw,
            newVolumeRaw,
            transactionType,
            vehicleName,
            vehicleType,
            isDelivery: isTankEventMatch(transactionType, ['delivery', 'intankdelivery']),
            isDispensing: isTankEventMatch(transactionType, ['dispensing']),
            isTransfer: isTankEventMatch(transactionType, ['transfer']),
        };
    });

    // ── 2. Group by month → site → tank ─────────────────────────────────────────
    const monthMap = new Map(); // monthKey → Map<siteName, Map<tankKey, rows[]>>

    rows.forEach((row) => {
        if (!monthMap.has(row.monthKey)) {
            monthMap.set(row.monthKey, new Map());
        }
        const siteMap = monthMap.get(row.monthKey);
        if (!siteMap.has(row.siteName)) {
            siteMap.set(row.siteName, new Map());
        }
        const tankMap = siteMap.get(row.siteName);
        const tankKey = row.tankId !== 'unknown' ? row.tankId : row.tankName;
        if (!tankMap.has(tankKey)) {
            tankMap.set(tankKey, { tankName: row.tankName, rows: [] });
        }
        tankMap.get(tankKey).rows.push(row);
    });

    // ── 3. Build monthlyGroups array ────────────────────────────────────────────
    const MONTH_NAMES = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const sortedMonths = Array.from(monthMap.keys()).sort();
    const monthlyGroups = sortedMonths.map((monthKey) => {
        const [yearStr, monthStr] = monthKey.split('-');
        const monthIndex = parseInt(monthStr, 10) - 1;
        const monthLabel = MONTH_NAMES[monthIndex] || monthStr;
        const year = yearStr;
        const siteMap = monthMap.get(monthKey);

        let monthDispensing = 0;
        let monthDelivery = 0;
        let monthTransfer = 0;
        let monthDispensingCount = 0;
        let monthDeliveryCount = 0;
        let monthTransferCount = 0;

        const siteGroups = [];
        siteMap.forEach((tankMap, siteName) => {
            const tanks = [];
            tankMap.forEach(({ tankName, rows: tankRows }) => {
                const ordered = tankRows.sort((a, b) =>
                    (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0),
                );
                const first = ordered[0];
                const last = ordered[ordered.length - 1];

                const openingBalanceRaw = first ? first.newVolumeRaw - first.volumeChangeRaw : 0;
                const closingBalanceRaw = last ? last.newVolumeRaw : 0;

                const dispensingRows = ordered.filter((r) => r.isDispensing);
                const deliveryRows = ordered.filter((r) => r.isDelivery);
                const transferRows = ordered.filter((r) => r.isTransfer);

                const dispensingTotal = dispensingRows.reduce((s, r) => s + Math.abs(r.volumeChangeRaw), 0);
                const deliveryTotal = deliveryRows.reduce((s, r) => s + r.volumeChangeRaw, 0);
                const transferTotal = transferRows.reduce((s, r) => s + r.volumeChangeRaw, 0);

                const expectedClosingRaw = openingBalanceRaw + deliveryTotal + transferTotal - dispensingTotal;
                const varianceRaw = closingBalanceRaw - expectedClosingRaw;
                const variancePercent = expectedClosingRaw !== 0
                    ? roundTo((varianceRaw / Math.abs(expectedClosingRaw)) * 100, 2)
                    : 0;

                // Average daily consumption
                const daySpan = first && last && first.timestamp && last.timestamp
                    ? Math.max(1, Math.ceil((last.timestamp - first.timestamp) / (1000 * 60 * 60 * 24)))
                    : 1;
                const avgDailyConsumption = roundTo(dispensingTotal / daySpan, 2);

                monthDispensing += dispensingTotal;
                monthDelivery += deliveryTotal;
                monthTransfer += Math.abs(transferTotal);
                monthDispensingCount += dispensingRows.length;
                monthDeliveryCount += deliveryRows.length;
                monthTransferCount += transferRows.length;

                tanks.push({
                    tankName,
                    openingBalance: formatNumber(openingBalanceRaw),
                    closingBalance: formatNumber(closingBalanceRaw),
                    expectedClosing: formatNumber(expectedClosingRaw),
                    dispensing: { total: formatNumber(dispensingTotal), count: dispensingRows.length },
                    delivery: { total: formatNumber(deliveryTotal), count: deliveryRows.length },
                    transfer: { total: formatNumber(Math.abs(transferTotal)), count: transferRows.length },
                    variance: formatNumber(varianceRaw),
                    varianceIsNegative: varianceRaw < -0.5,
                    variancePercent: `${variancePercent}%`,
                    avgDailyConsumption: formatNumber(avgDailyConsumption),
                    totalTransactions: ordered.length,
                });
            });
            tanks.sort((a, b) => a.tankName.localeCompare(b.tankName));

            siteGroups.push({
                siteName,
                tanks,
            });
        });
        siteGroups.sort((a, b) => a.siteName.localeCompare(b.siteName));

        return {
            month: monthKey,
            monthLabel: `${monthLabel} ${year}`,
            year,
            siteGroups,
            subtotal: {
                dispensing: formatNumber(monthDispensing),
                dispensingCount: monthDispensingCount,
                delivery: formatNumber(monthDelivery),
                deliveryCount: monthDeliveryCount,
                transfer: formatNumber(monthTransfer),
                transferCount: monthTransferCount,
                variance: formatNumber(monthDelivery + monthTransfer - monthDispensing),
            },
        };
    });

    // ── 4. Grand totals ─────────────────────────────────────────────────────────
    const grandDispensing = rows.filter((r) => r.isDispensing).reduce((s, r) => s + Math.abs(r.volumeChangeRaw), 0);
    const grandDelivery = rows.filter((r) => r.isDelivery).reduce((s, r) => s + r.volumeChangeRaw, 0);
    const grandTransfer = rows.filter((r) => r.isTransfer).reduce((s, r) => s + Math.abs(r.volumeChangeRaw), 0);
    const netVariance = grandDelivery + grandTransfer - grandDispensing;

    // ── 5. Analytics — charts, gauges, top vehicles, days of supply ─────────
    const dispensingRows = rows.filter((r) => r.isDispensing);
    const deliveryRows = rows.filter((r) => r.isDelivery);
    const transferRows = rows.filter((r) => r.isTransfer);
    const adjustmentRows = rows.filter((r) => !r.isDispensing && !r.isDelivery && !r.isTransfer);
    const dispensingTxnCount = dispensingRows.length;
    const deliveryTxnCount = deliveryRows.length;
    const transferTxnCount = transferRows.length;
    const adjustmentTxnCount = adjustmentRows.length;

    // Daily consumption trend (dispensing per day)
    const dailyMap = new Map();
    dispensingRows.forEach((r) => {
        if (!r.timestamp) return;
        const key = `${r.timestamp.getFullYear()}-${String(r.timestamp.getMonth() + 1).padStart(2, '0')}-${String(r.timestamp.getDate()).padStart(2, '0')}`;
        dailyMap.set(key, (dailyMap.get(key) || 0) + Math.abs(r.volumeChangeRaw));
    });
    const dailyConsumption = Array.from(dailyMap.entries())
        .map(([dateStr, volume]) => ({ date: new Date(dateStr), volume: roundTo(volume, 2) }))
        .sort((a, b) => a.date - b.date);

    const totalDays = Math.max(1, dailyConsumption.length);
    const avgDailyAll = dailyConsumption.length > 0
        ? roundTo(dailyConsumption.reduce((s, d) => s + d.volume, 0) / totalDays, 0) : 0;
    const peakDay = dailyConsumption.length > 0
        ? dailyConsumption.reduce((best, d) => d.volume > best.volume ? d : best, dailyConsumption[0]) : null;
    const lowestDay = dailyConsumption.length > 0
        ? dailyConsumption.reduce((best, d) => d.volume < best.volume ? d : best, dailyConsumption[0]) : null;

    // Vehicle type consumption
    const vehicleTypeMap = new Map();
    dispensingRows.forEach((r) => {
        const vt = r.vehicleType || 'Unknown';
        vehicleTypeMap.set(vt, (vehicleTypeMap.get(vt) || 0) + Math.abs(r.volumeChangeRaw));
    });
    const vehicleTypeGroups = Array.from(vehicleTypeMap.entries())
        .map(([type, litres]) => ({ type, litres: roundTo(litres, 2) }))
        .sort((a, b) => b.litres - a.litres)
        .slice(0, 7);
    const vehicleTypeTotal = vehicleTypeGroups.reduce((s, v) => s + v.litres, 0) || 1;

    // Site comparison — per month dispensing per site
    const allSiteNames = [...new Set(rows.map((r) => r.siteName))].sort();
    const monthKeysDistinct = [...new Set(rows.map((r) => r.monthKey))].sort();
    const siteComparisonDatasets = monthKeysDistinct.map((mk) => ({
        label: mk,
        data: allSiteNames.map((site) => {
            return roundTo(
                rows.filter((r) => r.monthKey === mk && r.siteName === site && r.isDispensing)
                    .reduce((s, r) => s + Math.abs(r.volumeChangeRaw), 0), 2);
        }),
    }));

    // Top 10 vehicles by dispensing volume
    const vehicleTotals = new Map();
    dispensingRows.forEach((r) => {
        const plate = r.vehicleName || 'Unknown';
        if (!vehicleTotals.has(plate)) {
            vehicleTotals.set(plate, { plate, litres: 0, txnCount: 0, fuelType: r.vehicleType || 'diesel' });
        }
        const v = vehicleTotals.get(plate);
        v.litres += Math.abs(r.volumeChangeRaw);
        v.txnCount += 1;
    });
    const topVehiclesList = Array.from(vehicleTotals.values())
        .sort((a, b) => b.litres - a.litres)
        .slice(0, 10)
        .map((v) => ({ ...v, litres: roundTo(v.litres, 2) }));
    const maxVehicleLitres = topVehiclesList.length > 0 ? topVehiclesList[0].litres : 1;

    // Days of supply per site
    const daysOfSupplyList = allSiteNames.map((siteName) => {
        const siteRows = rows.filter((r) => r.siteName === siteName);
        const siteDisp = siteRows.filter((r) => r.isDispensing);
        const sorted = [...siteRows].sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));
        const closingStock = sorted.length > 0 ? sorted[sorted.length - 1].newVolumeRaw : 0;
        const totalDisp = siteDisp.reduce((s, r) => s + Math.abs(r.volumeChangeRaw), 0);

        const siteDailyMap = new Map();
        siteDisp.forEach((r) => {
            if (!r.timestamp) return;
            const k = `${r.timestamp.getFullYear()}-${String(r.timestamp.getMonth() + 1).padStart(2, '0')}-${String(r.timestamp.getDate()).padStart(2, '0')}`;
            siteDailyMap.set(k, (siteDailyMap.get(k) || 0) + Math.abs(r.volumeChangeRaw));
        });
        const siteDays = Math.max(1, siteDailyMap.size);
        const avgDaily = roundTo(totalDisp / siteDays, 2);
        const daysRemaining = avgDaily > 0 ? Math.round(closingStock / avgDaily) : 9999;
        const statusColor = daysRemaining <= 7 ? '#DC3545' : daysRemaining <= 14 ? '#D97706' : '#107C10';
        const widthPercent = Math.min(100, Math.max(3, Math.round((daysRemaining / 60) * 100)));

        return {
            siteName,
            days: daysRemaining,
            closingStockFormatted: formatNumber(closingStock),
            avgDailyFormatted: formatNumber(avgDaily),
            statusColor,
            widthPercent,
        };
    });

    const lowStockSites = daysOfSupplyList.filter((s) => s.days <= 10);

    // Variance gauges per tank (across all months)
    const allTankKeys = [...new Set(rows.filter((r) => r.tankId !== 'unknown').map((r) => `${r.tankId}||${r.tankName}||${r.siteName}`))];
    const varianceGauges = allTankKeys.map((key) => {
        const [tankId, tankName, siteName] = key.split('||');
        const tankRows = rows.filter((r) => String(r.tankId) === tankId);
        const sorted = [...tankRows].sort((a, b) => (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0));
        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        const opening = first ? first.newVolumeRaw - first.volumeChangeRaw : 0;
        const closing = last ? last.newVolumeRaw : 0;
        const disp = tankRows.filter((r) => r.isDispensing).reduce((s, r) => s + Math.abs(r.volumeChangeRaw), 0);
        const deliv = tankRows.filter((r) => r.isDelivery).reduce((s, r) => s + r.volumeChangeRaw, 0);
        const trans = tankRows.filter((r) => r.isTransfer).reduce((s, r) => s + r.volumeChangeRaw, 0);
        const expected = opening + deliv + trans - disp;
        const variance = closing - expected;
        const variPct = expected !== 0 ? Math.abs(roundTo((variance / Math.abs(expected)) * 100, 2)) : 0;
        const status = variPct < 0.5 ? 'ok' : variPct < 2 ? 'warn' : 'danger';
        const filledRatio = Math.min(1, variPct / 3);

        return { tankName, siteName, variancePercent: variPct, isLoss: variance < 0, status, filledRatio };
    }).sort((a, b) => b.variancePercent - a.variancePercent);

    const avgPerVehicleTxn = dispensingTxnCount > 0 ? roundTo(grandDispensing / dispensingTxnCount, 1) : 0;

    // Format date labels
    const fmtDate = (d) => {
        const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
    };

    // Build chart data object (mirrors backend chartData for analyticsJson)
    const chartData = {
        dailyTrend: {
            labels: dailyConsumption.map((d) => fmtDate(d.date)),
            data: dailyConsumption.map((d) => d.volume),
        },
        txnTypeSplit: {
            labels: ['Dispensing', 'Delivery', 'Transfer', 'Adjustment'],
            data: [dispensingTxnCount, deliveryTxnCount, transferTxnCount, adjustmentTxnCount],
        },
        siteComparison: {
            labels: allSiteNames,
            datasets: siteComparisonDatasets,
        },
        vehicleTypeConsumption: {
            labels: vehicleTypeGroups.map((v) => v.type),
            data: vehicleTypeGroups.map((v) => v.litres),
            total: vehicleTypeTotal,
        },
        varianceGauges,
    };

    return {
        records: rows,
        monthlyGroups,
        grandTotal: {
            dispensing: formatNumber(grandDispensing),
            delivery: formatNumber(grandDelivery),
            transfer: formatNumber(grandTransfer),
            variance: formatNumber(netVariance),
            varianceIsNegative: netVariance < -0.5,
        },
        summary: {
            totalRecords: rows.length,
            totalTransactions: rows.length,
            totalDispensed: formatNumber(grandDispensing),
            totalDelivery: formatNumber(grandDelivery),
            totalTransfer: formatNumber(grandTransfer),
            netVariance: formatNumber(netVariance),
            monthsCovered: monthlyGroups.length,
            sitesMonitored: new Set(rows.map((r) => r.siteName)).size,
            tanksMonitored: new Set(rows.map((r) => r.tankId)).size,
            avgDailyDispensed: formatNumber(avgDailyAll),
        },
        analytics: {
            topVehicles: topVehiclesList.map((v) => ({
                plate: v.plate,
                litresFormatted: formatNumber(v.litres),
                txnCount: v.txnCount,
                fuelType: v.fuelType,
                widthPercent: Math.round((v.litres / maxVehicleLitres) * 100),
            })),
            daysOfSupply: daysOfSupplyList,
            kpis: {
                peakDayLabel: peakDay ? fmtDate(peakDay.date) : '\u2014',
                peakDayVolume: peakDay ? `${formatNumber(peakDay.volume)} L` : '0 L',
                avgDailyLabel: `${formatNumber(avgDailyAll)} L`,
                avgDailyNote: `across ${totalDays} days`,
                lowestDayLabel: lowestDay ? fmtDate(lowestDay.date) : '\u2014',
                lowestDayVolume: lowestDay ? `${formatNumber(lowestDay.volume)} L` : '0 L',
                avgPerVehicleTxn: `${avgPerVehicleTxn} L`,
                lowStockAlertCount: lowStockSites.length,
                lowStockSites: lowStockSites.length > 0
                    ? lowStockSites.map((s) => s.siteName).join(' \u00B7 ') : 'None',
                dispensingTxnCount,
                deliveryTxnCount,
            },
        },
        analyticsJson: JSON.stringify(chartData),
    };
};

const transformBySource = (sourceId, rawRecords, container, queryParams) => {
    switch (sourceId) {
        case 'fuel-refill':
            return mapFuelRefill(rawRecords);
        case 'vehicle-consumption':
            return mapVehicleConsumption(rawRecords);
        case 'consumption-by-refills':
            return mapVehicleConsumption(rawRecords);
        case 'delivery':
            return mapDelivery(rawRecords);
        case 'device-offline':
            return mapDeviceOffline(rawRecords);
        case 'pts-device':
            return mapPtsDevice(rawRecords);
        case 'tank-volume-history':
            return mapTankVolumeHistory(rawRecords, container);
        case 'issue-tracker':
            return mapIssueTracker(rawRecords, container, queryParams);
        case 'transaction-history-summary':
            return mapTransactionHistorySummary(rawRecords);
        default:
            return {
                records: mapDefaultRecords(rawRecords),
                summary: {
                    totalRecords: rawRecords.length,
                },
            };
    }
};

const buildReportIdentity = (sourceName) => {
    const now = new Date();
    const stamp = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    return {
        reportTitle: `${sourceName} Report`,
        generatedAt: now.toISOString().replace('T', ' ').substring(0, 19),
        generatedBy: 'System',
        reportId: `RPT-${stamp}`,
    };
};

export const buildJsReportPayload = ({ sourceId, sourceName, apiResponse, queryParams = {} }) => {
    const { records: rawRecords, container } = unwrapApiRecords(apiResponse);
    const transformed = transformBySource(sourceId, rawRecords, container, queryParams);
    const records = transformed.records || [];
    const identity = buildReportIdentity(sourceName);
    const dateAliases = buildDateAliases(queryParams, container);
    const summary = {
        totalRecords: records.length,
        ...transformed.summary,
    };

    // Pull out any extra top-level keys returned by source-specific transformers
    // (e.g., siteGroups from mapTankVolumeHistory) so the jsReport Handlebars
    // template can access them directly.
    const { records: _r, summary: _s, ...extraTransformed } = transformed;

    return {
        ...identity,
        ...queryParams,
        ...dateAliases,
        ...extraTransformed,
        records,
        data: records,
        items: records,
        transactions: records,
        summary,
    };
};

export default buildJsReportPayload;
