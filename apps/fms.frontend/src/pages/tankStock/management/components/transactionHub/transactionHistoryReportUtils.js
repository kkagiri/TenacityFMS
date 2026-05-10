/**
 * File: transactionHistoryReportUtils.js
 * Purpose: Build datasets and filenames for the Transaction Volume History JsReport template
 * Dependencies: VolumeChangeReasonEnum
 * Last Modified: 2026-01-21
 *
 * Key Functions:
 * - buildTransactionVolumeHistoryReportData: Shapes transaction data for JsReport rendering
 * - buildTransactionVolumeHistoryFileName: Creates a report filename based on date range
 */
import { VolumeChangeReasonEnum } from './transactionHubConstants';

const formatNumber = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const sanitizeText = (value, fallback = '-') => {
  if (value === null || value === undefined) return fallback;

  const normalized = String(value)
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized.length ? normalized : fallback;
};

const formatTimestamp = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return isNaN(date.getTime()) ? sanitizeText(value) : date.toLocaleString();
};

const resolveChangeReasonName = (changeReason) => {
  const reason = VolumeChangeReasonEnum.find((r) => r.id === changeReason);
  return sanitizeText(reason ? reason.name : String(changeReason ?? 'Unknown'), 'Unknown');
};

const formatDateRange = (startDate, endDate) => {
  if (!startDate && !endDate) return 'Today';
  if (startDate && !endDate) return startDate.toLocaleDateString();
  if (!startDate && endDate) return endDate.toLocaleDateString();

  const start = startDate.toLocaleDateString();
  const end = endDate.toLocaleDateString();
  return start === end ? start : `${start} - ${end}`;
};

const resolveSiteName = (sites, selectedSiteIds) => {
  if (!selectedSiteIds || selectedSiteIds.length === 0) return 'All Sites';
  if (selectedSiteIds.length === 1) {
    return sanitizeText(
      sites?.find((site) => site.id === selectedSiteIds[0])?.name,
      'Unknown Site'
    );
  }

  return `Multiple Sites (${selectedSiteIds.length})`;
};

const resolveTankName = (tanks, tankId) => {
  return sanitizeText(tanks?.find((tank) => tank.id === tankId)?.name, `Tank ${tankId}`);
};

export const buildTransactionVolumeHistoryFileName = (startDate, endDate) => {
  const start = startDate ? startDate.toISOString().split('T')[0] : null;
  const end = endDate ? endDate.toISOString().split('T')[0] : null;

  if (start && end) {
    return `TransactionVolumeHistory_${start}_to_${end}.pdf`;
  }

  const today = new Date().toISOString().split('T')[0];
  return `TransactionVolumeHistory_${today}.pdf`;
};

export const buildTransactionVolumeHistoryReportData = ({
  tankVolumeHistory,
  tanks,
  sites,
  headerStartDate,
  headerEndDate,
  selectedSiteIds,
  selectedTankIds,
  user
}) => {
  const filteredTransactions = selectedTankIds?.length
    ? tankVolumeHistory.filter((tx) => selectedTankIds.includes(tx.tankId))
    : tankVolumeHistory;

  const groupedByTank = new Map();
  filteredTransactions.forEach((tx) => {
    if (!groupedByTank.has(tx.tankId)) {
      groupedByTank.set(tx.tankId, []);
    }
    groupedByTank.get(tx.tankId).push(tx);
  });

  const tankReports = Array.from(groupedByTank.entries()).map(([tankId, transactions]) => {
    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    const opening = sortedTransactions[0];
    const closing = sortedTransactions[sortedTransactions.length - 1];

    return {
      tankId,
      tankName: resolveTankName(tanks, tankId),
      openingVolume: formatNumber(opening?.newVolume),
      openingTimestamp: formatTimestamp(opening?.timestamp),
      closingVolume: formatNumber(closing?.newVolume),
      closingTimestamp: formatTimestamp(closing?.timestamp),
      totalTransactions: sortedTransactions.length,
      transactions: sortedTransactions.map((tx, index) => ({
        index: index + 1,
        timestamp: formatTimestamp(tx.timestamp),
        changeReason: resolveChangeReasonName(tx.changeReason),
        volumeChange: formatNumber(tx.volumeChange),
        newVolume: formatNumber(tx.newVolume),
        vehicleName: sanitizeText(tx.vehicleName, 'N/A'),
        recordedBy: sanitizeText(tx.recordedByUserName, 'Unknown')
      }))
    };
  });

  tankReports.sort((a, b) => a.tankName.localeCompare(b.tankName));

  return {
    reportTitle: 'Transaction Volume History Report',
    generatedAt: new Date().toLocaleString(),
    generatedBy: sanitizeText(user?.userName || user?.username, 'Unknown User'),
    dateRange: formatDateRange(headerStartDate, headerEndDate),
    siteName: sanitizeText(resolveSiteName(sites, selectedSiteIds), 'All Sites'),
    totalTransactions: filteredTransactions.length,
    tankReports
  };
};
