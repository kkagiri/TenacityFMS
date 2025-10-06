# SignalR Fix - Quick Reference Card

## 🚀 Quick Start (3 Steps)

### Step 1: Add Imports
```javascript
import { useSignalRSelector } from '../../../hooks/useSignalRSelector';
import { IsolatedForm } from '../../../components/common/SignalRIsolation';
```

### Step 2: Replace Selectors
```javascript
// BEFORE:
const data = useSelector(state => state.module.data);

// AFTER:
const data = useSignalRSelector(state => state.module.data);
```

### Step 3: Wrap Forms (if applicable)
```javascript
// BEFORE:
return <form>...</form>;

// AFTER:
return <IsolatedForm formId="myForm"><form>...</form></IsolatedForm>;
```

---

## 📝 Import Paths by Location

| Your File Location | Import Path |
|-------------------|-------------|
| `pages/module/` | `../../hooks/useSignalRSelector` |
| `pages/module/forms/` | `../../../hooks/useSignalRSelector` |
| `pages/module/component/` | `../../../hooks/useSignalRSelector` |
| `components/module/` | `../../hooks/useSignalRSelector` |

---

## 🎯 Component-Specific Patterns

### Forms
```javascript
import { useSignalRSelector } from '../../../hooks/useSignalRSelector';
import { IsolatedForm } from '../../../components/common/SignalRIsolation';

function MyForm() {
  const data = useSignalRSelector(state => state.module.data);
  
  return (
    <IsolatedForm formId="myForm">
      <form onSubmit={handleSubmit}>
        {/* form content */}
      </form>
    </IsolatedForm>
  );
}
```

### Data Grids
```javascript
import { useSignalRSelector } from '../../hooks/useSignalRSelector';

function MyGrid() {
  const data = useSignalRSelector(state => state.module.data);
  return <DataGrid dataSource={data} />;
}
```

### Modals
```javascript
import { useSignalRSelector } from '../../hooks/useSignalRSelector';
import { IsolatedForm } from '../../components/common/SignalRIsolation';

function MyModal({ isOpen }) {
  const data = useSignalRSelector(state => state.module.data);
  
  return (
    <Modal isOpen={isOpen}>
      <IsolatedForm formId="modalForm">
        {/* content */}
      </IsolatedForm>
    </Modal>
  );
}
```

### Dashboard Widgets
```javascript
import { useDashboardMetricsSelector } from '../../hooks/useSignalRSelector';

function MetricsWidget() {
  const metrics = useDashboardMetricsSelector();
  return <div>{metrics.total}</div>;
}
```

---

## ✅ Testing Checklist

After each fix:
- [ ] File builds without errors
- [ ] Component renders correctly
- [ ] No console errors
- [ ] Forms: typing is smooth
- [ ] Grids: no flickering
- [ ] Data still updates in real-time

---

## 🔍 Find Files to Fix

```powershell
cd fms.frontend
.\find-signalr-fixes.ps1
```

View results:
```powershell
Import-Csv signalr-fix-status.csv | Out-GridView
```

---

## 🆘 Common Issues

### Import Error
**Error:** `Cannot find module 'useSignalRSelector'`
**Fix:** Check the relative path (count the `../`)

### Component Still Refreshes
**Fix:** Make sure you:
1. Replaced ALL `useSelector` calls
2. Wrapped the `<form>` tag directly (not parent div)
3. Removed old `useSelector` import

### Data Not Updating
**Fix:** Check SignalR connection in Redux DevTools

---

## 📊 Priority Order

1. **CRITICAL** 🔴 - Forms (do first!)
2. **HIGH** 🟡 - Modals & Data Grids
3. **MEDIUM** 🟢 - Multiple selectors
4. **LOW** 🔵 - Single selectors

---

## 💡 Pro Tips

- Fix files in the same folder together
- Test after every 5-10 files
- Use Git branches for each category
- Check browser console for middleware logs

---

**Start with tank stock forms - biggest impact in 30 minutes!**
