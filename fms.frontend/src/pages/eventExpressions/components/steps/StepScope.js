/**
 * File: StepScope.js
 * Purpose: Step 3 of Event Expression form — Scope selection.
 *          Dynamically shows scope filters based on the selected event type's
 *          availableScopeFilters (Site, Tank, Device, Vehicle, User, Product).
 * Dependencies: devextreme-react TagBox/TextBox, parent formData/handlers via props
 * Last Modified: 2026-02-14
 *
 * Key Props:
 * - formData: current form state (siteIds, tankIds, deviceId)
 * - onFieldChange(field, value): updates form field
 * - onSiteChange(siteIds): handles site selection + triggers tank loading
 * - sites: available sites from Redux
 * - tanks: available tanks (filtered by selected site)
 * - availableScopeFilters: string[] from selectedTypeMetadata (e.g., ["SiteId","TankId","DeviceId"])
 */

import React from 'react';
import { TagBox } from 'devextreme-react/tag-box';
import { TextBox } from 'devextreme-react/text-box';

const SCOPE_ICONS = {
    SiteId: 'fa-light fa-building',
    TankId: 'fa-light fa-database',
    DeviceId: 'fa-light fa-microchip',
    VehicleId: 'fa-light fa-car',
    UserId: 'fa-light fa-user',
    ProductId: 'fa-light fa-droplet'
};

const SCOPE_LABELS = {
    SiteId: 'Site',
    TankId: 'Tank',
    DeviceId: 'Device',
    VehicleId: 'Vehicle',
    UserId: 'User',
    ProductId: 'Product (Fuel Type)'
};

const StepScope = ({ formData, onFieldChange, onSiteChange, sites, tanks, availableScopeFilters }) => {
    const filters = availableScopeFilters || ['SiteId', 'TankId'];
    const hasSite = filters.includes('SiteId');
    const hasTank = filters.includes('TankId');
    const hasDevice = filters.includes('DeviceId');
    const hasVehicle = filters.includes('VehicleId');
    const hasUser = filters.includes('UserId');
    const hasProduct = filters.includes('ProductId');

    return (
        <div className="tw-flex tw-flex-col lg:tw-flex-row tw-gap-6">
            <div className="lg:tw-w-1/2 tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4">
                <p className="tw-text-xs tw-text-gray-500 tw-mb-3">
                    Leave blank to apply globally. Only scope types relevant to this event type are shown.
                </p>

                {/* Site scope */}
                {hasSite && (
                    <div className="tw-mb-3">
                        <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                            <i className={`${SCOPE_ICONS.SiteId} tw-mr-1 tw-text-gray-400`} />
                            Site
                        </label>
                        <TagBox
                            items={sites}
                            displayExpr="name"
                            valueExpr="siteId"
                            value={formData.siteIds}
                            onValueChanged={(e) => {
                                if (onSiteChange) {
                                    onSiteChange(e.value || []);
                                } else {
                                    onFieldChange('siteIds', e.value || []);
                                    if (hasTank) onFieldChange('tankIds', []);
                                }
                            }}
                            placeholder="All Sites"
                            showClearButton={true}
                            searchEnabled={true}
                            width="100%"
                            multiline={false}
                            showSelectionControls={true}
                        />
                    </div>
                )}

                {/* Tank scope */}
                {hasTank && (
                    <div className="tw-mb-3">
                        <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                            <i className={`${SCOPE_ICONS.TankId} tw-mr-1 tw-text-gray-400`} />
                            Tank
                        </label>
                        <TagBox
                            items={tanks}
                            displayExpr="name"
                            valueExpr="id"
                            value={formData.tankIds}
                            onValueChanged={(e) => onFieldChange('tankIds', e.value || [])}
                            placeholder={formData.siteIds?.length > 0 ? 'All Tanks' : 'Select a site first'}
                            showClearButton={true}
                            searchEnabled={true}
                            disabled={!hasSite || !formData.siteIds || formData.siteIds.length === 0}
                            width="100%"
                            multiline={false}
                            showSelectionControls={true}
                        />
                    </div>
                )}

                {/* Device scope — text input for device ID (entity has deviceId field) */}
                {hasDevice && (
                    <div className="tw-mb-3">
                        <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                            <i className={`${SCOPE_ICONS.DeviceId} tw-mr-1 tw-text-gray-400`} />
                            Device ID
                        </label>
                        <TextBox
                            value={formData.deviceId || ''}
                            onValueChanged={(e) => onFieldChange('deviceId', e.value || null)}
                            placeholder="Enter Device ID or leave blank for all"
                            showClearButton={true}
                            width="100%"
                        />
                    </div>
                )}

                {/* Vehicle scope — placeholder for future */}
                {hasVehicle && (
                    <div className="tw-mb-3">
                        <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                            <i className={`${SCOPE_ICONS.VehicleId} tw-mr-1 tw-text-gray-400`} />
                            Vehicle
                        </label>
                        <TextBox
                            value={formData.vehicleId || ''}
                            onValueChanged={(e) => onFieldChange('vehicleId', e.value || null)}
                            placeholder="Enter Vehicle ID or leave blank for all"
                            showClearButton={true}
                            width="100%"
                        />
                    </div>
                )}

                {/* User scope — placeholder for future */}
                {hasUser && (
                    <div className="tw-mb-3">
                        <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                            <i className={`${SCOPE_ICONS.UserId} tw-mr-1 tw-text-gray-400`} />
                            User
                        </label>
                        <TextBox
                            value={formData.userId || ''}
                            onValueChanged={(e) => onFieldChange('userId', e.value || null)}
                            placeholder="Enter User ID or leave blank for all"
                            showClearButton={true}
                            width="100%"
                        />
                    </div>
                )}

                {/* Product scope — placeholder for future */}
                {hasProduct && (
                    <div className="tw-mb-3">
                        <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1 tw-block">
                            <i className={`${SCOPE_ICONS.ProductId} tw-mr-1 tw-text-gray-400`} />
                            Product (Fuel Type)
                        </label>
                        <TextBox
                            value={formData.productId || ''}
                            onValueChanged={(e) => onFieldChange('productId', e.value || null)}
                            placeholder="Enter Product/Fuel Type or leave blank for all"
                            showClearButton={true}
                            width="100%"
                        />
                    </div>
                )}

                {/* No scope filters available */}
                {filters.length === 0 && (
                    <div className="tw-bg-green-50 tw-rounded tw-border tw-border-green-200 tw-p-3 tw-text-xs tw-text-green-700">
                        <i className="fa-light fa-globe tw-mr-1" />
                        This event type applies globally — no scope filters needed.
                    </div>
                )}
            </div>

            {/* Right side: scope summary info */}
            <div className="lg:tw-w-1/2 tw-bg-gray-50 tw-rounded-lg tw-border tw-border-gray-200 tw-p-4">
                <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-2">
                    <i className="fa-light fa-circle-info tw-mr-2" />
                    Scope Summary
                </h4>
                <div className="tw-text-sm tw-text-gray-600 tw-space-y-2">
                    {hasSite && (
                        <div className="tw-flex tw-items-center tw-gap-2">
                            <i className={`${SCOPE_ICONS.SiteId} tw-w-5 tw-text-gray-400`} />
                            <span>
                                {formData.siteIds?.length > 0
                                    ? `${formData.siteIds.length} site(s) selected`
                                    : 'All sites'}
                            </span>
                        </div>
                    )}
                    {hasTank && (
                        <div className="tw-flex tw-items-center tw-gap-2">
                            <i className={`${SCOPE_ICONS.TankId} tw-w-5 tw-text-gray-400`} />
                            <span>
                                {formData.tankIds?.length > 0
                                    ? `${formData.tankIds.length} tank(s) selected`
                                    : 'All tanks'}
                            </span>
                        </div>
                    )}
                    {hasDevice && (
                        <div className="tw-flex tw-items-center tw-gap-2">
                            <i className={`${SCOPE_ICONS.DeviceId} tw-w-5 tw-text-gray-400`} />
                            <span>{formData.deviceId ? `Device: ${formData.deviceId}` : 'All devices'}</span>
                        </div>
                    )}
                    {hasVehicle && (
                        <div className="tw-flex tw-items-center tw-gap-2">
                            <i className={`${SCOPE_ICONS.VehicleId} tw-w-5 tw-text-gray-400`} />
                            <span>{formData.vehicleId ? `Vehicle: ${formData.vehicleId}` : 'All vehicles'}</span>
                        </div>
                    )}
                    {hasUser && (
                        <div className="tw-flex tw-items-center tw-gap-2">
                            <i className={`${SCOPE_ICONS.UserId} tw-w-5 tw-text-gray-400`} />
                            <span>{formData.userId ? `User: ${formData.userId}` : 'All users'}</span>
                        </div>
                    )}
                    {hasProduct && (
                        <div className="tw-flex tw-items-center tw-gap-2">
                            <i className={`${SCOPE_ICONS.ProductId} tw-w-5 tw-text-gray-400`} />
                            <span>{formData.productId ? `Product: ${formData.productId}` : 'All products'}</span>
                        </div>
                    )}
                    {filters.length === 0 && (
                        <div className="tw-flex tw-items-center tw-gap-2">
                            <i className="fa-light fa-globe tw-w-5 tw-text-gray-400" />
                            <span>Global scope — applies everywhere</span>
                        </div>
                    )}
                </div>

                {/* Available scope badges */}
                <div className="tw-mt-4 tw-pt-3 tw-border-t tw-border-gray-200">
                    <p className="tw-text-xs tw-text-gray-400 tw-mb-2">Available scope filters for this event type:</p>
                    <div className="tw-flex tw-flex-wrap tw-gap-1">
                        {filters.map((f) => (
                            <span key={f} className="tw-inline-flex tw-items-center tw-gap-1 tw-px-2 tw-py-0.5 tw-bg-blue-50 tw-text-blue-700 tw-rounded tw-text-xs">
                                <i className={`${SCOPE_ICONS[f] || 'fa-light fa-filter'} tw-text-[10px]`} />
                                {SCOPE_LABELS[f] || f}
                            </span>
                        ))}
                        {filters.length === 0 && (
                            <span className="tw-text-xs tw-text-gray-400">None — global scope</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StepScope;
