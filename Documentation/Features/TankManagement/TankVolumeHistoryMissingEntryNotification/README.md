# Tank Volume History Missing Entry Notification System

## 📚 Documentation Overview

This folder contains complete documentation for the automated Tank Volume History Missing Entry Notification feature.

---

## 📄 Available Documents

### 1. **IMPLEMENTATION_PLAN.md** ⭐ (START HERE)
**Comprehensive implementation guide with all technical details**

- Complete architecture overview
- Database schema and SQL scripts
- Backend implementation (CQRS queries, commands, DTOs)
- Background service implementation
- API endpoints
- Email template design
- Phase-by-phase implementation checklist

**Use this for**: Full implementation from scratch

---

### 2. **QUICK_REFERENCE.md** 🚀
**Quick lookup guide for developers already familiar with the feature**

- Feature summary (1-page overview)
- Key implementation points
- API endpoint references
- Configuration settings
- Testing checklist
- Troubleshooting guide
- Quick deployment steps (25 minutes total)

**Use this for**: Quick lookups, testing, troubleshooting

---

### 3. **WORKFLOW_DIAGRAMS.md** 📊
**Visual workflow diagrams (Mermaid syntax)**

- System flow overview
- Detailed query logic flow
- Notification creation flow
- Background service scheduling flow
- Data flow diagram
- Component interaction diagram
- Error handling flow

**Use this for**: Understanding system architecture visually

---

### 4. **KEY_FEATURES.md** 💡
**Feature highlights and business value**

- Dynamic date range concept explained
- Real-world examples
- Key advantages
- Technical implementation highlights
- Business benefits
- Performance considerations
- Use cases

**Use this for**: Understanding the "why" and business value

---

### 5. **database/setup_missing_entry_notifications.sql** 💾
**Complete database setup SQL script**

- Notification category creation
- Notification policy configuration
- System configuration settings
- Ready-to-run SQL statements

**Use this for**: Database setup (run first)

---

## 🎯 Feature Summary

### What It Does
Automatically checks all tanks daily for missing fuel volume entries and notifies site administrators via email.

### Key Innovation: Dynamic Date Range ⚡
- **Traditional systems**: Check only yesterday or last 7 days (fixed window)
- **This system**: Checks from **last entry date to yesterday** (dynamic range)
- **Result**: Catches ALL gaps, whether 1 day or 1 month old

### Example
```
Tank A last entry: October 5, 2025
Today: November 4, 2025
System checks: October 6 to November 3 (29 days)
Email shows: ALL 29 missing dates if no data exists
```

---

## 🚀 Quick Start

### Step 1: Read the Plan (15 min)
```
Start with: IMPLEMENTATION_PLAN.md
Focus on: Business Requirements + Architecture sections
```

### Step 2: Setup Database (5 min)
```
Run: database/setup_missing_entry_notifications.sql
Verify: Check systemconfigurations table
```

### Step 3: Implement Backend (2-3 hours)
```
Follow: IMPLEMENTATION_PLAN.md > Backend Implementation section
Create: Query, Command, DTOs, Background Service
Test: Unit tests as you go
```

### Step 4: Deploy & Test (30 min)
```
Use: QUICK_REFERENCE.md > Quick Deployment section
Verify: Manual trigger test via API
Monitor: Check logs and email delivery
```

---

## 🔧 Technical Stack

- **Backend**: .NET 8.0, CQRS (MediatR), Entity Framework Core
- **Database**: MySQL
- **Background Jobs**: BackgroundService (hosted service)
- **Notifications**: Existing NotificationService + EmailService
- **Frontend**: React 18 + DevExtreme (for settings UI)

---

## 📋 Implementation Checklist

Use this high-level checklist to track progress:

- [ ] **Phase 1**: Database Setup (30 min)
  - [ ] Run SQL scripts
  - [ ] Verify configurations
  - [ ] Assign site administrators

- [ ] **Phase 2**: Backend - Queries & Commands (2 hours)
  - [ ] Create DTOs
  - [ ] Implement GetMissingTankVolumeEntriesQuery
  - [ ] Implement ProcessMissingEntryNotificationsCommand
  - [ ] Write unit tests

- [ ] **Phase 3**: Background Service (1 hour)
  - [ ] Create TankVolumeEntryCheckService
  - [ ] Register in DI container
  - [ ] Configure schedule

- [ ] **Phase 4**: API Endpoints (30 min)
  - [ ] Add GetMissingEntries endpoint
  - [ ] Add NotifyMissingEntries endpoint
  - [ ] Test with Postman/Swagger

- [ ] **Phase 5**: Frontend (2 hours)
  - [ ] Create settings component
  - [ ] Add manual trigger UI
  - [ ] Integrate with navigation

- [ ] **Phase 6**: Testing (1 hour)
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] End-to-end test
  - [ ] Email delivery test

---

## 🎓 Learning Path

### For New Developers
1. Read **KEY_FEATURES.md** - Understand the business value
2. Review **WORKFLOW_DIAGRAMS.md** - Visual understanding
3. Study **IMPLEMENTATION_PLAN.md** - Technical details
4. Use **QUICK_REFERENCE.md** - During development

### For Experienced Developers
1. Skim **QUICK_REFERENCE.md** - Get the overview
2. Check **IMPLEMENTATION_PLAN.md** - Implementation specifics
3. Reference **WORKFLOW_DIAGRAMS.md** - As needed
4. Run **database/setup_missing_entry_notifications.sql**

---

## 📞 Common Questions

### Q: Do we create a new policy for each notification?
**A**: ❌ NO! The policy is created **ONCE** during database setup. Each daily check creates notifications that **REFERENCE** this existing policy via `NotificationPolicyId`. Think of the policy as a template that all notifications use.

### Q: Why check from last entry instead of fixed 7 days?
**A**: Catches ALL gaps, not just recent ones. If a user is on vacation for 2 weeks, the system flags all 14 days when they return.

### Q: Won't this generate huge emails for tanks inactive for months?
**A**: Safety limit (`MaxLookbackDays` = 90 days default) prevents this. Only checks last 90 days max.

### Q: What if a tank has partial data (some days yes, some no)?
**A**: System only reports the specific missing dates, not all dates in the range.

### Q: Can this be triggered manually for testing?
**A**: Yes! Use the `POST /api/tankvolumehistory/notify-missing-entries` endpoint.

### Q: How do I change the schedule time?
**A**: Update `TankVolumeEntryCheck_ScheduleTime` in systemconfigurations table or via frontend UI.

---

## 🐛 Troubleshooting

**Issue**: No notifications being sent
- Check: QUICK_REFERENCE.md > Troubleshooting section
- Verify: SMTP configuration, site administrators assigned

**Issue**: Wrong missing dates reported
- Check: Query logic in IMPLEMENTATION_PLAN.md
- Verify: Timezone settings, VolumeChangeReasonEnum values

**Issue**: Performance slow with many tanks
- Check: MaxLookbackDays setting
- Consider: Pagination or batch processing

---

## 📦 Related Features

- **Notification System**: `Documentation/NotificationSystem/`
- **Email Service**: `Documentation/NotificationSystem/EmailService_Implementation_Summary.md`
- **Tank Management**: `Documentation/Features/TankManagement/`
- **Background Services**: `FMS.BackgroundServices/`

---

## 🏆 Best Practices

1. **Always test with manual trigger first** before relying on scheduled runs
2. **Monitor logs** for the first week after deployment
3. **Set MaxLookbackDays** appropriately for your business needs
4. **Ensure all sites have administrators** assigned before going live
5. **Test email delivery** with various scenarios (1 missing day, multiple missing days, etc.)

---

## 📊 Success Metrics

After implementation, track:
- Number of missing entries detected daily
- Email delivery success rate
- Time to data entry completion after notification
- Reduction in data gaps over time

---

## 🤝 Contributing

When updating this feature:
1. Update relevant documentation files
2. Keep QUICK_REFERENCE.md in sync with IMPLEMENTATION_PLAN.md
3. Update WORKFLOW_DIAGRAMS.md if logic changes
4. Add new examples to KEY_FEATURES.md if helpful

---

## 📅 Version History

- **v1.0** (November 2025): Initial implementation with dynamic date range checking

---

**Questions or Issues?** Check QUICK_REFERENCE.md > Troubleshooting or contact the development team.
