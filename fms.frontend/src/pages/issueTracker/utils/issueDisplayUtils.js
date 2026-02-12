/**
 * File: issueDisplayUtils.js
 * Purpose: Resolves issue title/description placeholders and extracts contextual values for Issue Tracker UI
 * Dependencies: None
 * Last Modified: 2026-02-12
 *
 * Key Functions:
 * - normalizeIssueDisplay: Produces UI-ready issue title/description values
 * - getIssueVehicleLabel: Resolves the best available vehicle label from issue fields
 */

const PLACEHOLDER_TOKEN_PATTERN = /\{(vehicleName|thresholdDays|lastSeen)\}/gi;

const safeText = (value) => (typeof value === 'string' ? value.trim() : '');

const humanizeElapsedMinutes = (minutesValue) => {
    const minutes = Number(minutesValue);
    if (!Number.isFinite(minutes) || minutes < 0) {
        return `${minutesValue} min ago`;
    }

    if (minutes < 60) {
        const roundedMinutes = Math.floor(minutes);
        return `${roundedMinutes} min ago`;
    }

    const hours = minutes / 60;
    if (hours < 24) {
        const roundedHours = Math.floor(hours);
        return `${roundedHours} ${roundedHours === 1 ? 'hr' : 'hrs'} ago`;
    }

    const days = hours / 24;
    if (days < 30) {
        const roundedDays = Math.floor(days);
        return `${roundedDays} ${roundedDays === 1 ? 'day' : 'days'} ago`;
    }

    const months = days / 30;
    if (months < 12) {
        const roundedMonths = Math.floor(months);
        return `${roundedMonths} ${roundedMonths === 1 ? 'month' : 'months'} ago`;
    }

    const years = months / 12;
    const roundedYears = Math.floor(years);
    return `${roundedYears} ${roundedYears === 1 ? 'year' : 'years'} ago`;
};

const extractVehicleNameFromDescription = (description) => {
    const normalizedDescription = safeText(description);
    if (!normalizedDescription) {
        return '';
    }

    const vehicleMatch = normalizedDescription.match(/Vehicle\s+(.+?)\s+has\s+had\s+no\s+GPS\s+update/i);
    if (vehicleMatch?.[1]) {
        return vehicleMatch[1].trim();
    }

    return '';
};

const extractThresholdDaysFromDescription = (description) => {
    const normalizedDescription = safeText(description);
    if (!normalizedDescription) {
        return '';
    }

    const daysMatch = normalizedDescription.match(/more\s+than\s+(\d+)\s+days?/i);
    return daysMatch?.[1] ? daysMatch[1] : '';
};

const extractLastSeenFromDescription = (description) => {
    const normalizedDescription = safeText(description);
    if (!normalizedDescription) {
        return '';
    }

    const match = normalizedDescription.match(
        /Last\s+seen:\s*([^\n\r]+?)(?:\.\s|$)/i
    );

    return match?.[1] ? match[1].trim() : '';
};

const formatDescriptionElapsedMinutes = (description) => {
    const normalizedDescription = safeText(description);
    if (!normalizedDescription) {
        return normalizedDescription;
    }

    return normalizedDescription.replace(
        /(\d+(?:\.\d+)?)\s*(?:min|mins|minute|minutes)\s+ago/gi,
        (match, minuteValue) => humanizeElapsedMinutes(minuteValue)
    );
};

const replacePlaceholders = (template, replacements) => {
    const normalizedTemplate = safeText(template);
    if (!normalizedTemplate) {
        return normalizedTemplate;
    }

    return normalizedTemplate.replace(PLACEHOLDER_TOKEN_PATTERN, (_, tokenName) => {
        const replacement = replacements[tokenName];
        return replacement !== undefined && replacement !== null && replacement !== ''
            ? replacement
            : `{${tokenName}}`;
    });
};

export const getIssueVehicleLabel = (issue = {}) => {
    return (
        safeText(issue.vehicleName) ||
        safeText(issue.vehicleHyoungNo) ||
        safeText(issue.vehicleNumber) ||
        safeText(issue.vehicleNo) ||
        ''
    );
};

export const normalizeIssueDisplay = (issue) => {
    if (!issue) {
        return issue;
    }

    const description = safeText(issue.problemDescription);
    const title = safeText(issue.problemTitle);

    const resolvedVehicleName = getIssueVehicleLabel(issue) || extractVehicleNameFromDescription(description);
    const resolvedThresholdDays =
        issue.thresholdDays !== undefined && issue.thresholdDays !== null && issue.thresholdDays !== ''
            ? String(issue.thresholdDays)
            : extractThresholdDaysFromDescription(description);
    const resolvedLastSeen =
        safeText(issue.lastSeen) ||
        safeText(issue.lastSeenDisplay) ||
        extractLastSeenFromDescription(description);

    const replacements = {
        vehicleName: resolvedVehicleName || 'Unknown Vehicle',
        thresholdDays: resolvedThresholdDays || 'N/A',
        lastSeen: resolvedLastSeen || 'N/A'
    };

    const resolvedTitle = replacePlaceholders(title, replacements);
    const resolvedDescription = replacePlaceholders(
        formatDescriptionElapsedMinutes(description),
        replacements
    );

    return {
        ...issue,
        problemTitle: resolvedTitle || issue.problemTitle,
        problemDescription: resolvedDescription || issue.problemDescription,
        vehicleDisplayName: resolvedVehicleName || getIssueVehicleLabel(issue)
    };
};
