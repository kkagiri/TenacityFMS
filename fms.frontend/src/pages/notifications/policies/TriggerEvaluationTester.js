import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import alarmHandlerApi from '../../../dataservice/alarmHandlerApi';
import { fetchSiteList } from '../../../redux/actions/siteActions';
import { fetctTankbySiteId } from '../../../redux/actions/tankActions';
import { selectSites } from '../../../redux/selectors/siteSelectors';
import { selectTanksBySite } from '../../../redux/selectors/tankSelectors';

// TriggerEvaluationTester: standalone synthetic evaluation form
// Includes waterHeight and offlineMinutes fields derived from UploadStatus telemetry domain.
export default function TriggerEvaluationTester({ policyId }) {
  const dispatch = useDispatch();
  const sites = useSelector(selectSites);
  const [selectedSite, setSelectedSite] = useState('');
  const tanksForSite = useSelector(state => selectedSite ? selectTanksBySite(state, selectedSite) : []);
  const [form, setForm] = useState({
    alarmType: 'TankLevelBelowThreshold',
    percentageFull: '', // used by TankLevelBelowThreshold
    waterHeight: '',    // may be used by WaterDetected
    offlineMinutes: '', // used by DeviceOffline
    siteId: '',
    tankId: '',
    deviceId: '',
    ptsDeviceId: ''
  });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  useEffect(() => {
    if (!sites || sites.length === 0) {
      dispatch(fetchSiteList());
    }
  }, [dispatch, sites]);

  useEffect(() => {
    if (selectedSite) {
      dispatch(fetctTankbySiteId(selectedSite));
      setForm(f => ({ ...f, siteId: selectedSite, tankId: '' }));
    }
  }, [selectedSite, dispatch]);

  const alarmType = form.alarmType;
  const showPercentageFull = alarmType === 'TankLevelBelowThreshold';
  const showWaterHeight = alarmType === 'WaterDetected';
  const showOffline = alarmType === 'DeviceOffline';
  const showTankSelect = alarmType !== 'DeviceOffline'; // offline maybe device-level

  const runTest = async () => {
    setBusy(true);
    setResult(null);
    try {
      const payload = {
        alarmType: form.alarmType,
        percentageFull: showPercentageFull && form.percentageFull !== '' ? Number(form.percentageFull) : undefined,
        waterHeight: showWaterHeight && form.waterHeight !== '' ? Number(form.waterHeight) : undefined,
        offlineMinutes: showOffline && form.offlineMinutes !== '' ? Number(form.offlineMinutes) : undefined,
        siteId: form.siteId ? Number(form.siteId) : undefined,
        tankId: showTankSelect && form.tankId ? Number(form.tankId) : undefined,
        deviceId: form.deviceId ? Number(form.deviceId) : undefined,
        ptsDeviceId: form.ptsDeviceId || undefined
      };
      const res = await alarmHandlerApi.evaluateTest(payload);
      setResult(res);
    } catch (e) {
      setResult({ success: false, message: e.message || 'Error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tw-mt-8 tw-border tw-border-dashed tw-rounded tw-p-4 tw-bg-gray-50">
      <h4 className="tw-font-semibold tw-mb-3 tw-text-sm">Test Trigger Evaluation</h4>
      <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-6 tw-gap-3 tw-text-xs">
        <div>
          <label className="tw-block tw-mb-1">Alarm Type</label>
          <select className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1" value={form.alarmType} onChange={e => update('alarmType', e.target.value)}>
            <option value="TankLevelBelowThreshold">TankLevelBelowThreshold</option>
            <option value="WaterDetected">WaterDetected</option>
            <option value="DeviceOffline">DeviceOffline</option>
          </select>
        </div>
        {showPercentageFull && (
          <div>
            <label className="tw-block tw-mb-1">% Full</label>
            <input className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1" type="number" value={form.percentageFull} onChange={e => update('percentageFull', e.target.value)} placeholder="e.g. 7.5" />
          </div>
        )}
        {showWaterHeight && (
          <div>
            <label className="tw-block tw-mb-1">Water Height (mm)</label>
            <input className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1" type="number" value={form.waterHeight} onChange={e => update('waterHeight', e.target.value)} placeholder="mm" />
          </div>
        )}
        {showOffline && (
          <div>
            <label className="tw-block tw-mb-1">Offline Minutes</label>
            <input className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1" type="number" value={form.offlineMinutes} onChange={e => update('offlineMinutes', e.target.value)} placeholder="e.g. 30" />
          </div>
        )}
        <div>
          <label className="tw-block tw-mb-1">Site</label>
          <select className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1" value={selectedSite} onChange={e => setSelectedSite(e.target.value)}>
            <option value="">(Select)</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.name || s.siteName || `Site ${s.id}`}</option>)}
          </select>
        </div>
        {showTankSelect && (
          <div>
            <label className="tw-block tw-mb-1">Tank</label>
            <select className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1" value={form.tankId} onChange={e => update('tankId', e.target.value)} disabled={!selectedSite}>
              <option value="">{selectedSite ? '(Select Tank)' : 'Select Site First'}</option>
              {tanksForSite.map(t => <option key={t.id} value={t.id}>{t.name || `Tank ${t.id}`}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="tw-block tw-mb-1">Device Id</label>
          <input className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1" value={form.deviceId} onChange={e => update('deviceId', e.target.value)} />
        </div>
        <div>
          <label className="tw-block tw-mb-1">PTS Device Id</label>
          <input className="tw-w-full tw-border tw-rounded tw-px-2 tw-py-1" value={form.ptsDeviceId} onChange={e => update('ptsDeviceId', e.target.value)} />
        </div>
      </div>
      <div className="tw-mt-4 tw-flex tw-items-center tw-gap-3">
        <button type="button" disabled={busy} onClick={runTest} className="tw-bg-blue-600 tw-text-white tw-text-xs tw-rounded tw-px-3 tw-py-1">
          {busy ? 'Testing...' : 'Run Test'}
        </button>
        {result && (
          <span className={`tw-text-xs ${result.success ? 'tw-text-green-600' : 'tw-text-red-600'}`}>{result.message || (result.success ? 'Success' : 'Failed')}</span>
        )}
      </div>
      {result && typeof result.created === 'number' && (
        <div className="tw-mt-2 tw-text-xs tw-text-gray-600">Notifications created: {result.created}</div>
      )}
    </div>
  );
}
