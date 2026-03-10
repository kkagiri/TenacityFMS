/**
 * File: vehicleTrackingSidebarConfig.js
 * Purpose: Provides sidebar sort, filter, and visible-column configuration for the vehicle tracking page
 * Dependencies: None
 * Last Modified: 2026-03-09
 *
 * Key Exports:
 * - TRACKING_STATUS_FILTER_OPTIONS: Available status filters for the vehicle pane
 * - TRACKING_SORT_OPTIONS: Sort choices for the vehicle pane
 * - TRACKING_COLUMN_OPTIONS: Optional visible sidebar detail columns
 * - filterVehicleCollection(): Filters vehicle records by search text and status
 * - sortVehicleCollection(): Sorts vehicle records for sidebar and map filtering
 */

export const TRACKING_STATUS_ORDER = {
    Moving: 0,
    Idling: 1,
    Stopped: 2,
    Parked: 3,
    Offline: 4,
    Unknown: 5,
};

export const TRACKING_STATUS_FILTER_OPTIONS = [
    { value: 'all', label: 'All statuses' },
    { value: 'Moving', label: 'Moving' },
    { value: 'Idling', label: 'Idling' },
    { value: 'Stopped', label: 'Stopped' },
    { value: 'Parked', label: 'Parked' },
    { value: 'Offline', label: 'Offline' },
];

export const TRACKING_SORT_OPTIONS = [
    { value: 'name', label: 'Vehicle name' },
    { value: 'status', label: 'Vehicle status' },
    { value: 'speed', label: 'Speed' },
    { value: 'lastUpdated', label: 'Last updated' },
    { value: 'heading', label: 'Heading' },
];

export const TRACKING_COLUMN_OPTIONS = [
    { value: 'status', label: 'Status' },
    { value: 'speed', label: 'Speed' },
    { value: 'lastUpdated', label: 'Last updated' },
    { value: 'heading', label: 'Heading' },
    { value: 'ignition', label: 'Ignition' },
    { value: 'movementSource', label: 'Movement source' },
];

const compareStrings = (left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' });

export const filterVehicleCollection = (vehicles = [], options = {}) => {
    const {
        searchText = '',
        statusFilter = 'all',
        getOperationalStatus,
    } = options;

    const searchLower = searchText.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
        const status = getOperationalStatus(vehicle);
        const matchesStatus = statusFilter === 'all'
            ? true
            : statusFilter === 'Offline'
                ? vehicle.isOnline === false
                : status === statusFilter;

        if (!matchesStatus) {
            return false;
        }

        if (!searchLower) {
            return true;
        }

        const searchableValues = [
            vehicle.name,
            vehicle.description,
            vehicle.hyoungNo,
            vehicle.numberPlate,
            vehicle.plateNumber,
            vehicle.address,
            vehicle.siteName,
            vehicle.id,
            vehicle.vehicleId,
            status,
        ];

        return searchableValues.some((value) =>
            value?.toString().toLowerCase().includes(searchLower)
        );
    });
};

export const sortVehicleCollection = (vehicles = [], options = {}) => {
    const {
        sortField = 'status',
        sortDirection = 'asc',
        getOperationalStatus,
        getSpeed,
        getHeading,
        getLastUpdated,
    } = options;

    const factor = sortDirection === 'desc' ? -1 : 1;
    const list = [...vehicles];

    list.sort((left, right) => {
        let comparison = 0;

        switch (sortField) {
            case 'status': {
                const leftStatus = getOperationalStatus(left) || 'Unknown';
                const rightStatus = getOperationalStatus(right) || 'Unknown';
                comparison = (TRACKING_STATUS_ORDER[leftStatus] ?? TRACKING_STATUS_ORDER.Unknown)
                    - (TRACKING_STATUS_ORDER[rightStatus] ?? TRACKING_STATUS_ORDER.Unknown);
                if (comparison === 0) {
                    comparison = compareStrings(left.name || '', right.name || '');
                }
                break;
            }
            case 'speed':
                comparison = (getSpeed(left) || 0) - (getSpeed(right) || 0);
                break;
            case 'lastUpdated': {
                const leftTime = new Date(getLastUpdated(left) || 0).getTime();
                const rightTime = new Date(getLastUpdated(right) || 0).getTime();
                comparison = leftTime - rightTime;
                break;
            }
            case 'heading':
                comparison = (getHeading(left) || 0) - (getHeading(right) || 0);
                break;
            case 'name':
            default:
                comparison = compareStrings(left.name || '', right.name || '');
                break;
        }

        return comparison * factor;
    });

    return list;
};
