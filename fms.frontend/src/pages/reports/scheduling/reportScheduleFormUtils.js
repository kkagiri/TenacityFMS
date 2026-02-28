/**
 * File: reportScheduleFormUtils.js
 * Purpose: Bridge utility that converts ReportScheduleForm output (flat formData)
 *          into the CreateNotificationRequest payload expected by POST /notifications.
 * Dependencies: reportSourceRegistry, reportEmailScheduleUtils (getNextRunDateTime)
 * Last Modified: 2026-02-10
 *
 * Key Functions:
 * - buildNotificationRequestFromForm(formData, recipients, currentUser): Converts form data to notification request
 */

import { getReportSource } from '../sources/reportSourceRegistry';
import { getNextRunDateTime } from '../../../components/Reporting/ReportScheduler/reportEmailScheduleUtils';
import { getScheduledReportTypeDefinition } from '../utils/scheduledReportEmailPageUtils';

/**
 * Capitalise first letter of a string.
 * @param {string} str
 * @returns {string}
 */
const capitalise = (str) =>
    typeof str === 'string' && str.length ? str.charAt(0).toUpperCase() + str.slice(1) : str || '';

/**
 * Build a CreateNotificationRequest payload from ReportScheduleForm data.
 *
 * @param {Object} formData  - The form output from ReportScheduleForm
 * @param {Array}  recipientList - Loaded recipient objects [{email, displayName, id?, userId?}]
 * @param {string} currentUser  - Current user's username (for requestedBy)
 * @returns {{ success: boolean, request?: Object, error?: string }}
 */
export const buildNotificationRequestFromForm = (formData, recipientList = [], currentUser = 'Unknown') => {
    if (!formData.reportSourceId) {
        return { success: false, error: 'Please select a report source.' };
    }

    const source = getReportSource(formData.reportSourceId);
    if (!source) {
        return { success: false, error: `Unknown report source: ${formData.reportSourceId}` };
    }

    // --- Resolve recipients: match emails → user IDs ---
    const recipientEmails = Array.isArray(formData.recipientEmails) ? formData.recipientEmails : [];
    if (!recipientEmails.length) {
        return { success: false, error: 'Please select at least one recipient.' };
    }

    const recipientDtos = recipientEmails.map((email) => {
        // Try to find user by email match
        const match = recipientList.find(
            (u) =>
                (u.email || '').toLowerCase() === email.toLowerCase() ||
                (u.displayName || '').toLowerCase() === email.toLowerCase()
        );
        const userId = match?.userId || match?.id || email;
        return {
            UserId: String(userId),
            DeliveryMethods: ['Email'],
            ResolvedFrom: 'Manual',
        };
    });

    // --- Schedule timing ---
    const isRecurring = formData.frequency && formData.frequency !== 'once';
    const periodType = formData.frequency || 'daily';

    const scheduleDayOfWeekIds = Array.isArray(formData.scheduleDayOfWeekIds) && formData.scheduleDayOfWeekIds.length
        ? formData.scheduleDayOfWeekIds.filter(Boolean)
        : ['monday'];
    const scheduleWeekOfMonthIds = Array.isArray(formData.scheduleWeekOfMonthIds) && formData.scheduleWeekOfMonthIds.length
        ? formData.scheduleWeekOfMonthIds.filter(Boolean)
        : ['first'];
    const scheduleTime = formData.scheduleTime || '08:00';
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    let nextRunDate;
    if (isRecurring) {
        nextRunDate = getNextRunDateTime({
            periodType,
            scheduleDayOfWeek: scheduleDayOfWeekIds[0] || 'monday',
            scheduleDayOfWeekIds,
            scheduleWeekOfMonthIds,
            scheduleWeekOfMonth: scheduleWeekOfMonthIds[0] || 'first',
            scheduleTime,
        });
    } else {
        // One-time schedule
        nextRunDate = formData.scheduledAt instanceof Date
            ? formData.scheduledAt
            : new Date(formData.scheduledAt || Date.now());
    }

    if (!nextRunDate || isNaN(nextRunDate.getTime())) {
        return { success: false, error: 'Please provide a valid schedule date/time.' };
    }

    // --- Build Data payload ---
    const reportFormat = String(formData.outputFormat || 'pdf').toUpperCase();
    const scheduleName = formData.scheduleName || `${source.name} - Scheduled Report`;
    const description = formData.description || source.description || 'Scheduled report delivery.';

    // Resolve the canonical PascalCase reportType from the report type definitions
    // so it matches the backend ScheduledReportDeliveryService expectations
    const reportTypeDef = getScheduledReportTypeDefinition(source.id);
    const reportType = reportTypeDef?.reportType || source.id;
    const triggerSource = reportTypeDef?.triggerSource || `${reportType}ReportSchedule`;

    const recipientNames = recipientEmails.map((email) => {
        const match = recipientList.find(
            (u) => (u.email || '').toLowerCase() === email.toLowerCase()
        );
        return match?.displayName || email;
    });

    const request = {
        Type: 2, // NotificationType.ScheduledReport
        CategoryId: 20,
        Priority: 1,
        Title: scheduleName,
        Message: `${scheduleName} — ${capitalise(periodType)} ${reportFormat} report`,
        Data: {
            schedulerVersion: 3,
            reportType,
            templateName: source.defaultTemplate || null,
            periodType,
            format: reportFormat,
            reportName: scheduleName,
            reportDescription: description,
            effectiveStartDate: null,
            effectiveEndDate: null,
            windowMode: periodType === 'monthly' ? 'runMonth' : 'runDateMinusOneDay',
            siteIds: [],
            tankIds: [],
            siteNames: ['All Sites'],
            tankNames: ['All Tanks'],
            filters: formData.filters || {},
            recurringSchedule: isRecurring
                ? {
                    enabled: true,
                    scheduleType: periodType === 'monthly' ? 'monthly' : 'weekly',
                    daysOfWeek: scheduleDayOfWeekIds,
                    dayOfWeek: scheduleDayOfWeekIds[0] || 'monday',
                    weeksOfMonth: periodType === 'monthly' ? scheduleWeekOfMonthIds : null,
                    weekOfMonth: periodType === 'monthly' ? (scheduleWeekOfMonthIds[0] || 'first') : null,
                    timeOfDay: scheduleTime,
                    timeZone,
                    nextRunAtUtc: nextRunDate.toISOString(),
                }
                : {
                    enabled: false,
                    scheduleType: 'once',
                    timeOfDay: scheduleTime,
                    timeZone,
                    nextRunAtUtc: nextRunDate.toISOString(),
                },
            requestedBy: currentUser,
            requestedAt: new Date().toISOString(),
            timeZone,
            reportViewPath: null,
            reportViewUrl: null,
            recipientNames,
        },
        TriggerSource: triggerSource,
        ScheduledAt: nextRunDate.toISOString(),
        SiteId: null,
        TankId: null,
        Recipients: recipientDtos,
        DisableFallbackAllUsers: true,
    };

    return { success: true, request };
};

/**
 * Build an update payload for PUT /notifications/scheduled-reports/{id}
 * from ReportScheduleForm data.
 *
 * @param {Object} formData  - The form output
 * @param {Array}  recipientList - Loaded recipients
 * @param {string} currentUser
 * @returns {Object} Update payload
 */
export const buildUpdatePayloadFromForm = (formData, recipientList = [], currentUser = 'Unknown') => {
    const periodType = formData.frequency || 'daily';
    const isRecurring = periodType !== 'once';
    const scheduleDayOfWeekIds = Array.isArray(formData.scheduleDayOfWeekIds) && formData.scheduleDayOfWeekIds.length
        ? formData.scheduleDayOfWeekIds.filter(Boolean)
        : ['monday'];
    const scheduleWeekOfMonthIds = Array.isArray(formData.scheduleWeekOfMonthIds) && formData.scheduleWeekOfMonthIds.length
        ? formData.scheduleWeekOfMonthIds.filter(Boolean)
        : ['first'];
    const scheduleTime = formData.scheduleTime || '08:00';

    let nextRunDate;
    if (isRecurring) {
        nextRunDate = getNextRunDateTime({
            periodType,
            scheduleDayOfWeek: scheduleDayOfWeekIds[0] || 'monday',
            scheduleDayOfWeekIds,
            scheduleWeekOfMonthIds,
            scheduleWeekOfMonth: scheduleWeekOfMonthIds[0] || 'first',
            scheduleTime,
        });
    } else {
        nextRunDate = formData.scheduledAt instanceof Date
            ? formData.scheduledAt
            : new Date(formData.scheduledAt || Date.now());
    }

    return {
        scheduledAtUtc: nextRunDate?.toISOString() || new Date().toISOString(),
        scheduleType: periodType === 'monthly' ? 'monthly' : (isRecurring ? 'weekly' : 'once'),
        daysOfWeek: scheduleDayOfWeekIds,
        weeksOfMonth: periodType === 'monthly' ? scheduleWeekOfMonthIds : null,
        weekOfMonth: periodType === 'monthly' ? (scheduleWeekOfMonthIds[0] || 'first') : null,
        scheduleTimeOfDay: scheduleTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        enabled: true,
    };
};
