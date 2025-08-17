import React, { useState } from 'react';

/**
 * 🎯 ENHANCED PolicyJsonFieldsEditor - Add JSON fields to NotificationPolicy creation
 * This extends your existing policy creation with the unused JSON fields
 */
const PolicyJsonFieldsEditor = ({ policyData, onChange }) => {
  const [activeTab, setActiveTab] = useState('triggers');
  const [triggerConditions, setTriggerConditions] = useState({
    timeConditions: {
      businessHoursOnly: false,
      startHour: '06:00',
      endHour: '22:00',
      excludeWeekends: false,
      excludeHolidays: []
    },
    frequencyLimit: {
      maxPerHour: 5,
      cooldownMinutes: 15,
      maxPerDay: 50
    },
    environmentalConditions: {
      minimumSeverity: 'Medium',
      requireConfirmation: false
    }
  });

  const [recipientRules, setRecipientRules] = useState({
    rules: [
      {
        condition: "priority == 'Critical'",
        recipients: ["manager@station.com", "supervisor@company.com"]
      },
      {
        condition: "hour >= 22 || hour < 6",
        recipients: ["night-manager@station.com", "emergency@company.com"]
      },
      {
        condition: "tankId == ${tankId} && siteId == ${siteId}",
        recipients: ["site-manager@station.com"]
      }
    ],
    fallbackRecipients: ["admin@company.com"]
  });

  const [escalationRules, setEscalationRules] = useState({
    escalationLevels: [
      {
        level: 1,
        delayMinutes: 15,
        recipients: ["shift-supervisor@station.com"],
        deliveryMethods: ["email", "sms"]
      },
      {
        level: 2,
        delayMinutes: 30,
        recipients: ["site-manager@station.com"],
        deliveryMethods: ["email", "sms", "phone"]
      },
      {
        level: 3,
        delayMinutes: 60,
        recipients: ["regional-manager@company.com", "operations-director@company.com"],
        deliveryMethods: ["email", "sms", "phone"]
      }
    ],
    stopEscalationOnAcknowledge: true,
    maxEscalationLevel: 3
  });

  // Update parent when JSON changes
  React.useEffect(() => {
    onChange({
      ...policyData,
      triggerConditions: JSON.stringify(triggerConditions),
      recipientRules: JSON.stringify(recipientRules),
      escalationRules: JSON.stringify(escalationRules)
    });
  }, [triggerConditions, recipientRules, escalationRules]);

  return (
    <div className="policy-json-editor tw-bg-white tw-border tw-rounded tw-p-4 tw-mt-4">
      <h3 className="tw-text-lg tw-font-medium tw-text-gray-800 tw-mb-4">
        🎯 Advanced Policy Rules (JSON Configuration)
      </h3>

      {/* Tab Navigation */}
      <div className="tw-flex tw-border-b tw-mb-4">
        {[
          { key: 'triggers', label: '🔍 Trigger Conditions', desc: 'When to send' },
          { key: 'recipients', label: '🎯 Recipient Rules', desc: 'Who to notify' },
          { key: 'escalation', label: '🚨 Escalation Rules', desc: 'How to escalate' }
        ].map(tab => (
          <button
            key={tab.key}
            className={`tw-px-4 tw-py-2 tw-text-sm tw-font-medium ${
              activeTab === tab.key
                ? 'tw-border-b-2 tw-border-blue-500 tw-text-blue-600'
                : 'tw-text-gray-500 hover:tw-text-gray-700'
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            <div className="tw-text-xs tw-text-gray-400">{tab.desc}</div>
          </button>
        ))}
      </div>

      {/* Trigger Conditions Tab */}
      {activeTab === 'triggers' && (
        <div className="tw-space-y-4">
          <div>
            <h4 className="tw-font-medium tw-text-gray-700 tw-mb-2">⏰ Time Conditions</h4>
            <div className="tw-grid tw-grid-cols-2 tw-gap-4">
              <label className="tw-flex tw-items-center tw-gap-2">
                <input
                  type="checkbox"
                  checked={triggerConditions.timeConditions.businessHoursOnly}
                  onChange={e => setTriggerConditions(prev => ({
                    ...prev,
                    timeConditions: { ...prev.timeConditions, businessHoursOnly: e.target.checked }
                  }))}
                />
                <span className="tw-text-sm">Business hours only</span>
              </label>
              <label className="tw-flex tw-items-center tw-gap-2">
                <input
                  type="checkbox"
                  checked={triggerConditions.timeConditions.excludeWeekends}
                  onChange={e => setTriggerConditions(prev => ({
                    ...prev,
                    timeConditions: { ...prev.timeConditions, excludeWeekends: e.target.checked }
                  }))}
                />
                <span className="tw-text-sm">Exclude weekends</span>
              </label>
            </div>

            {triggerConditions.timeConditions.businessHoursOnly && (
              <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mt-2">
                <div>
                  <label className="tw-block tw-text-xs tw-text-gray-600 tw-mb-1">Start Hour</label>
                  <input
                    type="time"
                    className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1"
                    value={triggerConditions.timeConditions.startHour}
                    onChange={e => setTriggerConditions(prev => ({
                      ...prev,
                      timeConditions: { ...prev.timeConditions, startHour: e.target.value }
                    }))}
                  />
                </div>
                <div>
                  <label className="tw-block tw-text-xs tw-text-gray-600 tw-mb-1">End Hour</label>
                  <input
                    type="time"
                    className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1"
                    value={triggerConditions.timeConditions.endHour}
                    onChange={e => setTriggerConditions(prev => ({
                      ...prev,
                      timeConditions: { ...prev.timeConditions, endHour: e.target.value }
                    }))}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <h4 className="tw-font-medium tw-text-gray-700 tw-mb-2">🔢 Frequency Limits</h4>
            <div className="tw-grid tw-grid-cols-3 tw-gap-4">
              <div>
                <label className="tw-block tw-text-xs tw-text-gray-600 tw-mb-1">Max per hour</label>
                <input
                  type="number"
                  className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1"
                  value={triggerConditions.frequencyLimit.maxPerHour}
                  onChange={e => setTriggerConditions(prev => ({
                    ...prev,
                    frequencyLimit: { ...prev.frequencyLimit, maxPerHour: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <label className="tw-block tw-text-xs tw-text-gray-600 tw-mb-1">Cooldown (min)</label>
                <input
                  type="number"
                  className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1"
                  value={triggerConditions.frequencyLimit.cooldownMinutes}
                  onChange={e => setTriggerConditions(prev => ({
                    ...prev,
                    frequencyLimit: { ...prev.frequencyLimit, cooldownMinutes: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <label className="tw-block tw-text-xs tw-text-gray-600 tw-mb-1">Max per day</label>
                <input
                  type="number"
                  className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1"
                  value={triggerConditions.frequencyLimit.maxPerDay}
                  onChange={e => setTriggerConditions(prev => ({
                    ...prev,
                    frequencyLimit: { ...prev.frequencyLimit, maxPerDay: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recipient Rules Tab */}
      {activeTab === 'recipients' && (
        <div className="tw-space-y-4">
          <div>
            <h4 className="tw-font-medium tw-text-gray-700 tw-mb-2">🎯 Dynamic Recipient Rules</h4>
            <p className="tw-text-sm tw-text-gray-600 tw-mb-3">
              Define conditions that determine who gets notified based on alarm context
            </p>

            {recipientRules.rules.map((rule, index) => (
              <div key={index} className="tw-border tw-rounded tw-p-3 tw-bg-gray-50">
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                  <div>
                    <label className="tw-block tw-text-xs tw-text-gray-600 tw-mb-1">Condition</label>
                    <input
                      type="text"
                      className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1"
                      value={rule.condition}
                      onChange={e => {
                        const newRules = [...recipientRules.rules];
                        newRules[index] = { ...rule, condition: e.target.value };
                        setRecipientRules(prev => ({ ...prev, rules: newRules }));
                      }}
                      placeholder="e.g. priority == 'Critical'"
                    />
                  </div>
                  <div>
                    <label className="tw-block tw-text-xs tw-text-gray-600 tw-mb-1">Recipients (comma-separated)</label>
                    <input
                      type="text"
                      className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1"
                      value={rule.recipients.join(', ')}
                      onChange={e => {
                        const newRules = [...recipientRules.rules];
                        newRules[index] = { ...rule, recipients: e.target.value.split(',').map(r => r.trim()) };
                        setRecipientRules(prev => ({ ...prev, rules: newRules }));
                      }}
                      placeholder="manager@station.com, supervisor@company.com"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              className="tw-text-blue-600 tw-text-sm hover:tw-underline"
              onClick={() => setRecipientRules(prev => ({
                ...prev,
                rules: [...prev.rules, { condition: "", recipients: [] }]
              }))}
            >
              + Add Rule
            </button>
          </div>
        </div>
      )}

      {/* Escalation Rules Tab */}
      {activeTab === 'escalation' && (
        <div className="tw-space-y-4">
          <div>
            <h4 className="tw-font-medium tw-text-gray-700 tw-mb-2">🚨 Escalation Levels</h4>
            <p className="tw-text-sm tw-text-gray-600 tw-mb-3">
              Define how notifications escalate if not acknowledged
            </p>

            {escalationRules.escalationLevels.map((level, index) => (
              <div key={index} className="tw-border tw-rounded tw-p-3 tw-bg-gray-50">
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4">
                  <div>
                    <label className="tw-block tw-text-xs tw-text-gray-600 tw-mb-1">Level</label>
                    <input
                      type="number"
                      className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1"
                      value={level.level}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="tw-block tw-text-xs tw-text-gray-600 tw-mb-1">Delay (min)</label>
                    <input
                      type="number"
                      className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1"
                      value={level.delayMinutes}
                      onChange={e => {
                        const newLevels = [...escalationRules.escalationLevels];
                        newLevels[index] = { ...level, delayMinutes: parseInt(e.target.value) || 0 };
                        setEscalationRules(prev => ({ ...prev, escalationLevels: newLevels }));
                      }}
                    />
                  </div>
                  <div>
                    <label className="tw-block tw-text-xs tw-text-gray-600 tw-mb-1">Recipients</label>
                    <input
                      type="text"
                      className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1"
                      value={level.recipients.join(', ')}
                      onChange={e => {
                        const newLevels = [...escalationRules.escalationLevels];
                        newLevels[index] = { ...level, recipients: e.target.value.split(',').map(r => r.trim()) };
                        setEscalationRules(prev => ({ ...prev, escalationLevels: newLevels }));
                      }}
                    />
                  </div>
                  <div>
                    <label className="tw-block tw-text-xs tw-text-gray-600 tw-mb-1">Methods</label>
                    <input
                      type="text"
                      className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1"
                      value={level.deliveryMethods.join(', ')}
                      onChange={e => {
                        const newLevels = [...escalationRules.escalationLevels];
                        newLevels[index] = { ...level, deliveryMethods: e.target.value.split(',').map(m => m.trim()) };
                        setEscalationRules(prev => ({ ...prev, escalationLevels: newLevels }));
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="tw-flex tw-items-center tw-gap-4">
            <label className="tw-flex tw-items-center tw-gap-2">
              <input
                type="checkbox"
                checked={escalationRules.stopEscalationOnAcknowledge}
                onChange={e => setEscalationRules(prev => ({
                  ...prev,
                  stopEscalationOnAcknowledge: e.target.checked
                }))}
              />
              <span className="tw-text-sm">Stop escalation when acknowledged</span>
            </label>
          </div>
        </div>
      )}

      {/* JSON Preview */}
      <div className="tw-mt-6 tw-border-t tw-pt-4">
        <details className="tw-cursor-pointer">
          <summary className="tw-text-sm tw-font-medium tw-text-gray-700">
            📋 JSON Preview (for database storage)
          </summary>
          <div className="tw-mt-2 tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
            <div>
              <h5 className="tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">TriggerConditions</h5>
              <pre className="tw-text-xs tw-bg-gray-100 tw-p-2 tw-rounded tw-overflow-auto tw-max-h-32">
                {JSON.stringify(triggerConditions, null, 2)}
              </pre>
            </div>
            <div>
              <h5 className="tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">RecipientRules</h5>
              <pre className="tw-text-xs tw-bg-gray-100 tw-p-2 tw-rounded tw-overflow-auto tw-max-h-32">
                {JSON.stringify(recipientRules, null, 2)}
              </pre>
            </div>
            <div>
              <h5 className="tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">EscalationRules</h5>
              <pre className="tw-text-xs tw-bg-gray-100 tw-p-2 tw-rounded tw-overflow-auto tw-max-h-32">
                {JSON.stringify(escalationRules, null, 2)}
              </pre>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default PolicyJsonFieldsEditor;
