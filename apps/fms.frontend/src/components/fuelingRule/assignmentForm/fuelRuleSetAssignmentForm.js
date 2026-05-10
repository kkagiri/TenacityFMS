import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { assignRuleSetToTag } from '../../../redux/actions/fuelingRuleActions';
import notify from 'devextreme/ui/notify';

const FuelRuleSetAssignmentForm = ({ vehicle }) => {
    const [formData, setFormData] = useState({ ruleSetId: '' });
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const handleRuleSetChange = (e) => {
        setFormData(prev => ({
            ...prev,
            ruleSetId: e.value
        }));
    };

    const handleSubmit = async () => {
        if (!formData.ruleSetId) {
            notify('Please select a rule set', 'error');
            return;
        }

        setLoading(true);
        try {
            const assignRuleResult = await dispatch(assignRuleSetToTag(formData.ruleSetId, vehicle.tagId));

            if (!assignRuleResult.success) {
                throw new Error(assignRuleResult.error);
            }

            notify('Rule set assigned successfully', 'success');
        } catch (error) {
            notify(error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h3>Assign Fuel Rule Set</h3>
            <div>
                <label>Rule Set:</label>
                <input type="text" value={formData.ruleSetId} onChange={handleRuleSetChange} />
            </div>
            <button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Assigning...' : 'Assign Rule Set'}
            </button>
        </div>
    );
};

export default FuelRuleSetAssignmentForm;