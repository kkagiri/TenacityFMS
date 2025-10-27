# Provider Management - Quick Reference Guide

## 🚀 Quick Start

### Accessing the System

1. Login to FMS → Navigate to **"Provider Management"**
2. Three tabs available:
   - **Dashboard** 📊 - Real-time monitoring
   - **Configuration** ⚙️ - Manage settings
   - **Vehicle Assignments** 🚛 - Map vehicles

---

## 📊 Dashboard - At a Glance

### Key Metrics (Top Cards)

- **Total Providers**: How many configured
- **Healthy Providers**: How many working
- **Total Requests**: API calls made
- **Success Rate**: % successful requests

### Provider Status Colors

| Color     | Status    | Action              |
| --------- | --------- | ------------------- |
| 🟢 Green  | Healthy   | None needed         |
| 🟡 Yellow | Degraded  | Monitor closely     |
| 🔴 Red    | Unhealthy | Fix immediately     |
| ⚫ Gray   | Disabled  | Re-enable if needed |

### Quick Actions

- **🔌 Plug Icon**: Test provider connection
- **🔄 Reload Button**: Refresh all providers
- **✅ Auto-refresh**: Updates every 30 seconds

---

## ⚙️ Configuration - Quick Tasks

### Enable/Disable Provider

**Click the badge** → "Enabled" ↔️ "Disabled"

- Green = Active
- Gray = Inactive

### Set Default Provider

**Click the ⭐ star icon** → Provider becomes default

### Edit Configuration

1. **Click ⚙️ gear icon**
2. **Edit JSON** in popup
3. **Click "Save"**
4. Provider auto-reloads

### Common Configuration (GPSGate)

```json
{
  "ApiKey": "YOUR_API_KEY",
  "BaseUrl": "http://10.0.10.150/comGpsGate/api/v.1",
  "ApplicationId": "12"
}
```

---

## 🔧 Common Tasks

### ✅ Add New Provider

1. Execute database INSERT script
2. Dashboard → Click "Reload Providers"
3. Configuration → Find new provider → Edit
4. Dashboard → Test connection (🔌 icon)
5. Configuration → Enable if successful

### ✅ Switch Default Provider

1. Dashboard → Verify new provider is 🟢 Healthy
2. Dashboard → Test connection (🔌 icon)
3. Configuration → Click ⭐ on new provider
4. Configuration → Disable old provider (optional)

### ✅ Troubleshoot Unhealthy Provider

1. Dashboard → Click 🔌 to test connection
2. Configuration → Click ⚙️ to check settings
3. Verify API key, URL, credentials
4. Save changes → Reload providers
5. Dashboard → Test again

### ✅ Update Provider Settings

1. Configuration → Find provider
2. Click ⚙️ gear icon
3. Edit JSON (check syntax!)
4. Click "Save Configuration"
5. Dashboard → Verify 🟢 Healthy status

---

## ⚠️ Warnings

### Don't Do This

- ❌ Disable ALL providers (need at least 1)
- ❌ Disable the default provider without setting new default
- ❌ Save invalid JSON (will fail validation)
- ❌ Share API keys publicly
- ❌ Edit providers without testing first

### Do This Instead

- ✅ Test connection before setting as default
- ✅ Keep backup provider enabled
- ✅ Validate JSON before saving
- ✅ Document configuration changes
- ✅ Monitor health after changes

---

## 🆘 Troubleshooting

### Problem: Provider shows 🔴 Unhealthy

**Solutions**:

1. Test connection (🔌 icon)
2. Check configuration (⚙️ icon)
3. Verify API credentials
4. Check network connectivity
5. Review error message

### Problem: Can't save configuration

**Solutions**:

1. Validate JSON syntax (use validator)
2. Check all required fields present
3. Refresh page and try again
4. Check browser console for errors

### Problem: Menu not visible

**Solutions**:

1. Verify you have admin permissions
2. Check database navigation items exist
3. Logout and login again
4. Contact system administrator

### Problem: Statistics not updating

**Solutions**:

1. Click "Reload Providers" button
2. Refresh page (F5)
3. Check auto-refresh is enabled
4. Verify backend API is running

---

## 📞 Getting Help

### Self-Service

1. **User Guide**: `Documentation/Features/VehicleTracking/USER_GUIDE.md`
2. **API Docs**: `Documentation/Features/VehicleTracking/API_REFERENCE.md`
3. **Browser Console**: Press F12 → Check for errors

### Contact Support

- **Email**: support@yourcompany.com
- **Phone**: +1 (555) 123-4567
- **Portal**: https://support.yourcompany.com

### What to Include

- Screenshot of the issue
- Error messages from console (F12)
- Steps to reproduce
- Which provider is affected

---

## 🔑 Keyboard Shortcuts

| Shortcut         | Action               |
| ---------------- | -------------------- |
| `F5` or `Ctrl+R` | Refresh page         |
| `Esc`            | Close popup          |
| `F12`            | Open browser console |

---

## 📋 Pre-Flight Checklist

### Before Making Changes

- [ ] Backup current configuration
- [ ] Test on non-production first
- [ ] Verify backup provider is healthy
- [ ] Document the change
- [ ] Notify team if needed

### After Making Changes

- [ ] Test connection worked
- [ ] Check health status is green
- [ ] Monitor statistics for issues
- [ ] Verify tracking still working
- [ ] Update documentation

---

## 💡 Best Practices

### Daily Operations

✅ Check Dashboard once per day
✅ Enable auto-refresh during active monitoring
✅ Keep at least 2 providers enabled
✅ Set most reliable provider as default
✅ Test connections after configuration changes

### Weekly Maintenance

✅ Review provider statistics
✅ Check for degraded providers
✅ Verify all enabled providers are healthy
✅ Update configurations as needed
✅ Document any changes made

### Monthly Review

✅ Analyze success rates and performance
✅ Optimize priority order
✅ Review vehicle assignments
✅ Plan capacity and scaling
✅ Update documentation

---

## 📊 Understanding Metrics

### Response Time

- **< 200ms**: Excellent ⭐⭐⭐
- **200-500ms**: Good ⭐⭐
- **500-1000ms**: Acceptable ⭐
- **> 1000ms**: Needs investigation ⚠️

### Success Rate

- **> 99%**: Excellent ⭐⭐⭐
- **95-99%**: Good ⭐⭐
- **90-95%**: Acceptable ⭐
- **< 90%**: Needs investigation ⚠️

### Health Status

- **Healthy**: All checks passing
- **Degraded**: Slow but working
- **Unhealthy**: Not responding

---

## 🎯 Success Indicators

### System is Healthy When:

✅ All providers show 🟢 Healthy (or at least 1)
✅ Success rate > 95%
✅ Response times < 500ms
✅ No error messages in dashboard
✅ Vehicle tracking working normally

### Immediate Action Needed When:

⚠️ All providers show 🔴 Unhealthy
⚠️ Success rate < 90%
⚠️ Default provider disabled with no replacement
⚠️ Connection tests consistently fail
⚠️ No location data from vehicles

---

## 📝 Quick Notes Template

Use this when documenting changes:

```
Date: [YYYY-MM-DD]
Time: [HH:MM]
Action: [Enable/Disable/Configure/Test]
Provider: [Provider Name]
Reason: [Why change was made]
Old Value: [Previous setting]
New Value: [New setting]
Test Result: [Pass/Fail]
Notes: [Additional context]
```

---

## 🌟 Pro Tips

1. **Always test before setting as default**

   - Use 🔌 icon to verify connection
   - Check health status is 🟢 green
   - Review statistics for reliability

2. **Use auto-refresh during troubleshooting**

   - Enable it to see real-time updates
   - Disable it to prevent distractions

3. **Keep configuration backups**

   - Copy JSON before editing
   - Save in secure location
   - Document what each field means

4. **Monitor after changes**

   - Watch for 5-10 minutes
   - Check statistics increase
   - Verify no error spikes

5. **Plan for maintenance windows**
   - Make changes during low-traffic times
   - Have rollback plan ready
   - Notify operations team

---

**Version**: 1.0
**Last Updated**: October 27, 2025
**For**: FMS Administrators

---

## 🔖 Bookmark These Pages

- **Dashboard**: `http://your-server/providermanagement/dashboard`
- **Configuration**: `http://your-server/providermanagement/configuration`
- **Assignments**: `http://your-server/providermanagement/assignments`

Print this guide and keep it handy! 📄
