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
    6: 'Dispensing',
    7: 'AutomatedDispensing',
    8: 'Reconciliation',
    9: 'AutomatedReconciliation',
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

const mapTankVolumeHistory = (rawRecords, container) => {
    const mapped = rawRecords.map((record, index) => {
        const transactionType = resolveTankTransactionType(record);
        const timestamp = getValue(record, ['timestamp', 'periodStart', 'dateTime']);
        const volumeChangeValue = numberOrZero(getValue(record, ['volumeChange', 'totalVolume', 'volume']));
        const newVolumeValue = numberOrZero(getValue(record, ['newVolume', 'totalVolume']));
        const siteId = getValue(record, ['siteId']);
        const tankId = getValue(record, ['tankId']);

        return {
            rowNumber: index + 1,
            dateTime: formatUtcDateTimeToLocal(timestamp),
            date: formatDate(timestamp),
            time: formatTime(parseDateAssumeUtc(timestamp) || timestamp),
            tankName: normalizeText(getValue(record, ['tankName']) || (tankId ? `Tank #${tankId}` : '-')),
            siteName: normalizeText(getValue(record, ['siteName', 'site']) || (siteId ? `Site #${siteId}` : '-')),
            transactionType,
            vehicleName: normalizeText(getValue(record, ['vehicleName']), ''),
            vehicleType: normalizeText(getValue(record, ['vehicleType']), ''),
            transferTankName: normalizeText(getValue(record, ['transferTankName']), ''),
            transferTankSite: normalizeText(getValue(record, ['transferTankSite']), ''),
            volumeChange: formatNumber(volumeChangeValue),
            newVolume: formatNumber(newVolumeValue),
            transactionCount: numberOrZero(getValue(record, ['transactionCount'])) || 1,
            referenceType: normalizeText(getValue(record, ['referenceType']), ''),
            isOpeningOrClosing: isTankEventMatch(transactionType, ['openingstock', 'closingstock']),
            isDelivery: isTankEventMatch(transactionType, ['delivery']),
            isDispensing: isTankEventMatch(transactionType, ['dispensing']),
            isNegativeVolume: volumeChangeValue < 0,
        };
    });

    const parseMappedNumber = (value) => numberOrZero(String(value || '0').replace(/,/g, ''));
    const deliveries = mapped
        .filter((r) => isTankEventMatch(r.transactionType, ['delivery', 'transferin']))
        .reduce((sum, r) => sum + Math.abs(parseMappedNumber(r.volumeChange)), 0);
    const dispensed = mapped
        .filter((r) => isTankEventMatch(r.transactionType, ['dispensing', 'transferout']))
        .reduce((sum, r) => sum + Math.abs(parseMappedNumber(r.volumeChange)), 0);
    const openingOrClosingCount = mapped
        .filter((r) => r.isOpeningOrClosing)
        .length;
    const totalTransactions = mapped.reduce((sum, r) => sum + numberOrZero(r.transactionCount), 0);
    const totalVolumeChange = mapped.reduce((sum, r) => sum + Math.abs(parseMappedNumber(r.volumeChange)), 0);

    return {
        records: mapped,
        summary: {
            totalRecords: mapped.length,
            totalTransactions,
            totalVolumeChange: formatNumber(totalVolumeChange),
            totalDelivered: formatNumber(deliveries),
            totalConsumed: formatNumber(dispensed),
            openingClosingCount: openingOrClosingCount,
            sitesMonitored: new Set(mapped.map((r) => r.siteName).filter(Boolean)).size,
            tanksMonitored: new Set(mapped.map((r) => r.tankName).filter(Boolean)).size,
        },
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

    return {
        ...identity,
        ...queryParams,
        ...dateAliases,
        records,
        data: records,
        items: records,
        transactions: records,
        summary,
    };
};

export default buildJsReportPayload;
