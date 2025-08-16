import React, { useEffect, useMemo, useState } from "react";
import notificationsApi from "../../../dataservice/notificationsApi";
import notificationPreferencesApi from "../../../dataservice/notificationPreferencesApi";

const NotificationPoliciesTab = () => {
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [policies, setPolicies] = useState([]);
  const [categories, setCategories] = useState([]);

  // Form state aligned to CreateNotificationPolicyRequestDTO
  const [form, setForm] = useState({
    name: "",
    notificationCategoryId: "",
    notificationType: "Alert",
    priority: "Medium",
    enableEmail: true,
    enableSms: false,
    enableSystem: true,
    maxNotificationsPerHour: 10,
    maxNotificationsPerDay: 50,
    cooldownMinutes: 30,
    titleTemplate: "",
    messageTemplate: "",
    requireAcknowledgment: false,
  });

  useEffect(() => {
    const load = async () => {
      const [cats, pols] = await Promise.all([
        notificationPreferencesApi.getNotificationCategories(),
        notificationsApi.getPolicies(),
      ]);
      if (cats.isSuccess) setCategories(cats.data);
      if (pols.isSuccess) setPolicies(pols.data);
    };
    load();
  }, []);

  const categoryOptions = useMemo(() => (categories || []).map(c => ({ value: c.id ?? c.Id ?? c.name, text: c.name ?? c.Name })), [categories]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleCreate = async () => {
    setCreating(true);
    setMessage("");
    try {
      if (!form.name || !form.notificationCategoryId) {
        setMessage("Name and Category are required");
        return;
      }
      const payload = {
        name: form.name,
        notificationCategoryId: Number(form.notificationCategoryId),
        notificationType: form.notificationType,
        priority: form.priority,
        enableEmail: !!form.enableEmail,
        enableSms: !!form.enableSms,
        enableSystem: !!form.enableSystem,
        maxNotificationsPerHour: Number(form.maxNotificationsPerHour) || 0,
        maxNotificationsPerDay: Number(form.maxNotificationsPerDay) || 0,
        cooldownMinutes: Number(form.cooldownMinutes) || 0,
        titleTemplate: form.titleTemplate || null,
        messageTemplate: form.messageTemplate || null,
        requireAcknowledgment: !!form.requireAcknowledgment,
      };
      const res = await notificationsApi.createPolicy(payload);
      if (res.isSuccess) {
        setMessage("Policy created successfully");
        setForm(prev => ({ ...prev, name: "", titleTemplate: "", messageTemplate: "" }));
        const refreshed = await notificationsApi.getPolicies();
        if (refreshed.isSuccess) setPolicies(refreshed.data);
      } else {
        setMessage(res.message || "Failed to create policy");
      }
    } catch (e) {
      setMessage("Failed to create policy");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="notification-policies-tab">
      <div className="tw-grid md:tw-grid-cols-2 tw-gap-6">
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded tw-p-4">
          <h3 className="tw-text-lg tw-font-medium tw-text-gray-800 tw-mb-3">Create Policy</h3>
          <div className="tw-grid tw-grid-cols-1 tw-gap-3">
            <div>
              <label className="tw-block tw-text-sm tw-text-gray-600 tw-mb-1">Name</label>
              <input className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1" name="name" value={form.name} onChange={handleChange} placeholder="Policy name" />
            </div>
            <div>
              <label className="tw-block tw-text-sm tw-text-gray-600 tw-mb-1">Category</label>
              <select className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1" name="notificationCategoryId" value={form.notificationCategoryId} onChange={handleChange}>
                <option value="">Select category</option>
                {categoryOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.text}</option>
                ))}
              </select>
            </div>
            <div className="tw-grid tw-grid-cols-3 tw-gap-3">
              <div>
                <label className="tw-block tw-text-sm tw-text-gray-600 tw-mb-1">Type</label>
                <select className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1" name="notificationType" value={form.notificationType} onChange={handleChange}>
                  {['Alert','Warning','Info'].map(v=> <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="tw-block tw-text-sm tw-text-gray-600 tw-mb-1">Priority</label>
                <select className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1" name="priority" value={form.priority} onChange={handleChange}>
                  {['Low','Medium','High','Critical'].map(v=> <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="tw-flex tw-items-center tw-gap-4 tw-mt-6">
                <label className="tw-flex tw-items-center tw-gap-2"><input type="checkbox" name="enableSystem" checked={form.enableSystem} onChange={handleChange} /> System</label>
                <label className="tw-flex tw-items-center tw-gap-2"><input type="checkbox" name="enableEmail" checked={form.enableEmail} onChange={handleChange} /> Email</label>
                <label className="tw-flex tw-items-center tw-gap-2"><input type="checkbox" name="enableSms" checked={form.enableSms} onChange={handleChange} /> SMS</label>
              </div>
            </div>
            <div className="tw-grid tw-grid-cols-3 tw-gap-3">
              <div>
                <label className="tw-block tw-text-sm tw-text-gray-600 tw-mb-1">Max/hour</label>
                <input type="number" className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1" name="maxNotificationsPerHour" value={form.maxNotificationsPerHour} onChange={handleChange} />
              </div>
              <div>
                <label className="tw-block tw-text-sm tw-text-gray-600 tw-mb-1">Max/day</label>
                <input type="number" className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1" name="maxNotificationsPerDay" value={form.maxNotificationsPerDay} onChange={handleChange} />
              </div>
              <div>
                <label className="tw-block tw-text-sm tw-text-gray-600 tw-mb-1">Cooldown (min)</label>
                <input type="number" className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1" name="cooldownMinutes" value={form.cooldownMinutes} onChange={handleChange} />
              </div>
            </div>
            <div>
              <label className="tw-block tw-text-sm tw-text-gray-600 tw-mb-1">Title Template</label>
              <input className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1" name="titleTemplate" value={form.titleTemplate} onChange={handleChange} placeholder="e.g. Alarm: {AlarmType}" />
            </div>
            <div>
              <label className="tw-block tw-text-sm tw-text-gray-600 tw-mb-1">Message Template</label>
              <textarea className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1 tw-h-20" name="messageTemplate" value={form.messageTemplate} onChange={handleChange} placeholder="e.g. Triggered on {CreatedAt}" />
            </div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <input type="checkbox" name="requireAcknowledgment" checked={form.requireAcknowledgment} onChange={handleChange} />
              <span className="tw-text-sm tw-text-gray-700">Require acknowledgment</span>
            </div>
            <div className="tw-mt-2">
              <button className="tw-bg-blue-600 tw-text-white tw-rounded tw-px-3 tw-py-1" onClick={handleCreate} disabled={creating}>
                {creating ? "Creating..." : "Create Policy"}
              </button>
              {message && <div className="tw-text-sm tw-mt-2 tw-text-gray-700">{message}</div>}
            </div>
          </div>
        </div>
        <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded tw-p-4">
          <h3 className="tw-text-lg tw-font-medium tw-text-gray-800 tw-mb-3">Existing Policies</h3>
          <div className="tw-space-y-2">
            {policies.length === 0 && <div className="tw-text-sm tw-text-gray-500">No policies yet.</div>}
            {policies.map(p => (
              <div key={p.Id || p.id} className="tw-border tw-border-gray-200 tw-rounded tw-p-3 tw-flex tw-items-center tw-justify-between">
                <div>
                  <div className="tw-font-medium tw-text-gray-900">{p.Name || p.name}</div>
                  <div className="tw-text-xs tw-text-gray-600">{p.NotificationType || p.notificationType} • {p.Priority || p.priority}</div>
                </div>
                <div className="tw-text-xs tw-text-gray-500">{p.IsActive ?? p.isActive ? "Active" : "Inactive"}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPoliciesTab;
