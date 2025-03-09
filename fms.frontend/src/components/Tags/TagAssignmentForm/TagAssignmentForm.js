// TagAssignmentForm.jsx

import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Form, SimpleItem, Label } from 'devextreme-react/form';
import { Button } from 'devextreme-react/button';
import { TextBox } from 'devextreme-react/text-box';
import { SelectBox } from 'devextreme-react/select-box';
import { assignTagToVehicle } from '../../../redux/actions/tagActions';
import { assignRuleSetToTag } from '../../../redux/actions/fuelingRuleActions';
import notify from 'devextreme/ui/notify';
import LoadIndicator from 'devextreme-react/load-indicator';
import './TagAssignmentForm.scss';

const TagAssignmentForm = ({ vehicle, tags, ruleSets, onClose }) => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        tagId: '',
        ruleSetId: null,
    });
    const [inputMode, setInputMode] = useState('manual'); // 'manual' or 'scan'

    // Filter available tags that are either unassigned or already assigned to the current vehicle
    const availableTags = tags.filter(
        (tag) => !tag.vehicleId || tag.vehicleId === vehicle.vehicleId
    );

    // Handler for manual tag input change
    const handleTagInputChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            tagId: e.value,
        }));
    };

    // Handler for selecting an existing tag
    const handleExistingTagChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            tagId: e.value,
        }));
    };

    // Handler for selecting a rule set
    const handleRuleSetChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            ruleSetId: e.value,
        }));
    };

    // Handler for form submission
    const handleSubmit = async () => {
        if (!formData.tagId) {
            notify('Please enter or scan a tag ID.', 'error', 3000);
            return;
        }


        setLoading(true);
        try {
            // Assign tag to vehicle
            const assignTagResult = await dispatch(
                assignTagToVehicle({
                    tagId: formData.tagId,
                    vehicleId: vehicle.vehicleId,
                })
            );

            if (!assignTagResult.success) {
                throw new Error(assignTagResult.error || 'Failed to assign tag to vehicle.');
            }

            // Assign rule set to tag
            const assignRuleResult = await dispatch(
                assignRuleSetToTag(formData.ruleSetId, formData.tagId)
            );

            if (!assignRuleResult.success) {
                throw new Error(assignRuleResult.error || 'Failed to assign rule set to tag.');
            }

            notify('Tag successfully assigned to vehicle and rule set.', 'success', 3000);
            onClose();
        } catch (error) {
            notify(error.message || 'An error occurred during assignment.', 'error', 5000);
        } finally {
            setLoading(false);
        }
    };

    // Handler to simulate RFID tag scanning
    const startTagScan = () => {
        setInputMode('scan');
        // TODO: Integrate with PTS device scanning
        // For demonstration, we'll simulate a scan after 2 seconds
        notify('Scanning RFID tag...', 'info', 2000);
        setTimeout(() => {
            const simulatedTag = 'RFID123456'; // Simulated scanned tag ID
            setFormData((prev) => ({
                ...prev,
                tagId: simulatedTag,
            }));
            notify(`Scanned Tag: ${simulatedTag}`, 'success', 3000);
            setInputMode('manual'); // Reset back to manual after scanning
        }, 2000);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <LoadIndicator width={40} height={40} visible={true} />
            </div>
        );
    }

    return (
        <div className="tag-assignment-form">
            <Form>
                {/* Tag Input Section */}
                <SimpleItem>
                    <Label text="RFID Tag ID" />
                    <div className="tag-input-container">
                        <TextBox
                            value={formData.tagId}
                            onValueChanged={handleTagInputChange}
                            placeholder="Enter RFID Tag ID"
                            width="70%"
                            disabled={inputMode === 'scan'}
                        />
                        <Button
                            text="ScanTag"
                            type="default"
                            stylingMode="contained"
                            onClick={startTagScan}
                            width="25%"
                        />
                    </div>
                </SimpleItem>

                {/* Existing Tag Selection Section */}
                <SimpleItem>
                    <Label text="Or Select Existing Tag" />
                    <SelectBox
                        dataSource={availableTags}
                        displayExpr="tagId"
                        valueExpr="tagId"
                        placeholder="Select a tag"
                        onValueChanged={handleExistingTagChange}
                        searchEnabled={true}
                        showClearButton={true}
                        width="100%"
                    />
                </SimpleItem>


                {/* Action Buttons */}
                <SimpleItem>
                    <div className="button-container">
                        <Button
                            text="Cancel"
                            onClick={onClose}
                            stylingMode="outlined"
                            type="normal"
                            width="120px"
                        />
                        <Button
                            text="Assign"
                            type="default"
                            onClick={handleSubmit}
                            stylingMode="contained"
                            disabled={!formData.tagId}
                            width="120px"
                        />
                    </div>
                </SimpleItem>
            </Form>
        </div>
    );

};

export default TagAssignmentForm;
