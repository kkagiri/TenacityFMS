/**
 * File: vehicleTrackingSnapshotService.js
 * Purpose: Caches tracking views and vehicle snapshots for the vehicle tracking workspace
 * Dependencies: axiosInstance, vehicleTrackingHelpers
 * Last Modified: 2026-03-21
 *
 * Key Functions:
 * - fetchTrackingTagsSnapshot(): Retrieves cached tracking views with TTL-based reuse
 * - fetchVehiclesByTagSnapshot(): Retrieves cached vehicle snapshots per tracking tag
 * - normalizeTrackingTagId(): Normalizes tag identifiers for cache keys and comparisons
 */
import axiosInstance from '../../../api/axiosInstance';
import { normalizeVehicle } from './utils/vehicleTrackingHelpers';

const TAGS_CACHE_TTL_MS = 5 * 60 * 1000;
const VEHICLE_SNAPSHOT_CACHE_TTL_MS = 4000;

let tagsRequestCache = { data: null, expiresAt: 0, promise: null };
const vehicleSnapshotRequestCache = new Map();

const cloneVehicleCollection = (collection = []) => collection.map((item) => ({ ...item }));

export const normalizeTrackingTagId = (value) => (value == null || value === '' ? null : String(value));

export const fetchTrackingTagsSnapshot = async () => {
    if (tagsRequestCache.data && Date.now() < tagsRequestCache.expiresAt) {
        return cloneVehicleCollection(tagsRequestCache.data);
    }

    if (tagsRequestCache.promise) {
        return cloneVehicleCollection(await tagsRequestCache.promise);
    }

    tagsRequestCache.promise = axiosInstance.get('/vehicletracking/tags')
        .then((response) => {
            if (!response.data?.isSuccess) {
                throw new Error(response.data?.message || 'Failed to fetch vehicle views');
            }

            const tags = response.data.data || [];
            tagsRequestCache = {
                data: cloneVehicleCollection(tags),
                expiresAt: Date.now() + TAGS_CACHE_TTL_MS,
                promise: null,
            };

            return cloneVehicleCollection(tags);
        })
        .catch((error) => {
            tagsRequestCache.promise = null;
            throw error;
        });

    return cloneVehicleCollection(await tagsRequestCache.promise);
};

export const fetchVehiclesByTagSnapshot = async (tagId) => {
    const cacheKey = String(tagId);
    const cachedEntry = vehicleSnapshotRequestCache.get(cacheKey);

    if (cachedEntry?.data && Date.now() < cachedEntry.expiresAt) {
        return cloneVehicleCollection(cachedEntry.data);
    }

    if (cachedEntry?.promise) {
        return cloneVehicleCollection(await cachedEntry.promise);
    }

    const requestPromise = axiosInstance.get(`/vehicletracking/tags/${tagId}/vehicles`)
        .then((response) => {
            if (!response.data?.isSuccess) {
                throw new Error(response.data?.message || 'Failed to fetch vehicles');
            }

            const vehicles = (response.data.data || []).map(normalizeVehicle);
            vehicleSnapshotRequestCache.set(cacheKey, {
                data: cloneVehicleCollection(vehicles),
                expiresAt: Date.now() + VEHICLE_SNAPSHOT_CACHE_TTL_MS,
                promise: null,
            });

            return cloneVehicleCollection(vehicles);
        })
        .catch((error) => {
            if (vehicleSnapshotRequestCache.get(cacheKey)?.promise === requestPromise) {
                vehicleSnapshotRequestCache.delete(cacheKey);
            }

            throw error;
        });

    vehicleSnapshotRequestCache.set(cacheKey, {
        data: cachedEntry?.data || null,
        expiresAt: cachedEntry?.expiresAt || 0,
        promise: requestPromise,
    });

    return cloneVehicleCollection(await requestPromise);
};