/**
 * File: vehicleTripService.js
 * Purpose: Compatibility service for persisted vehicle-trip flows.
 * Dependencies: None
 * Last Modified: 2026-04-29
 */

const emptyTrips = [];

export const fetchVehicleTripList = async () => emptyTrips;
export const fetchVehicleTripHistory = async () => emptyTrips;
export const fetchTripSiteLookup = async () => [];
export const recomputeVehicleTrips = async (payload) => ({ isSuccess: true, message: "Compatibility stub", data: payload || {} });
export const reconcileVehicleTrips = async (payload) => ({ isSuccess: true, message: "Compatibility stub", data: payload || {} });