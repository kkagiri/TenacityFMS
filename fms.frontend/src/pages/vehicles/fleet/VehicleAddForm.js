/**
 * File: VehicleAddForm.js
 * Purpose: Vehicle creation wrapper that reuses VehicleFormPanel for M365-consistent UI.
 * Dependencies: React, Redux vehicle actions, notify, VehicleFormPanel
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - VehicleAddForm: Handles create-vehicle submission using the shared vehicle form panel
 */
import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import notify from "devextreme/ui/notify";

import { createVehicle } from "../../../redux/actions/vehicleActions";
import VehicleFormPanel from "./VehicleFormPanel";

const VehicleAddForm = ({ onSave, onCancel }) => {
    const dispatch = useDispatch();
    const [isSaving, setIsSaving] = useState(false);

    const handleCreateVehicle = useCallback(
        async (formData) => {
            try {
                setIsSaving(true);
                const result = await dispatch(createVehicle(formData));

                if (result.success) {
                    notify("Vehicle created successfully", "success", 3000);
                    onSave?.({
                        vehicleId:
                            result.data?.vehicleId ||
                            result.data?.VehicleId ||
                            result.data?.id,
                        ...result.data,
                    });
                    return;
                }

                notify(result.message || "Error creating vehicle", "error", 3000);
            } catch (error) {
                console.error("Error creating vehicle:", error);
                notify("Error creating vehicle", "error", 3000);
            } finally {
                setIsSaving(false);
            }
        },
        [dispatch, onSave]
    );

    return (
        <VehicleFormPanel
            vehicle={null}
            onSubmit={handleCreateVehicle}
            onCancel={() => onCancel?.()}
            isSaving={isSaving}
            submitLabel="Create Vehicle"
            savingLabel="Creating..."
        />
    );
};

export default VehicleAddForm;
