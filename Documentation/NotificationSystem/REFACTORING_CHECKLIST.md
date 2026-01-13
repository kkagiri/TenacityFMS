# Notification System Refactoring Checklist

## Overview
This document tracks the cleanup and simplification of the FMS Notification System.
Based on analysis completed on January 10, 2026.
**Last Updated:** January 20, 2026

---

## Phase 1: Quick Wins (Immediate) ✅ COMPLETE

### 1.1 Remove Duplicate Policies Tab
- [x] Update `NotificationSettings.js` to show only Categories
- [x] Add link to `/notifications/policies` for policy management
- [x] Test that categories still work correctly
- [x] Verify navigation links work

### 1.2 Update Page Titles for Clarity
- [x] Admin page: Shows "Categories & Notification Setup"
- [x] Navigation updated in layout

### 1.3 Documentation Consolidation
- [x] Create `NOTIFICATION_SYSTEM_GUIDE.md` - comprehensive guide
- [x] Create `PUSH_NOTIFICATION_SETUP.md` - push setup guide
- [ ] Archive old scattered documentation files
- [ ] Update main README to point to new guides

---

## Phase 2: UI Cleanup ✅ COMPLETE

### 2.1 Simplify Notifications Module Navigation
Simplified structure:
```
/notifications
├── /dashboard     → Overview & stats
├── /policies      → Create/edit notification rules (Notification Rules)
├── /recipients    → Recipient groups (Recipient Groups)
├── /preferences   → Personal settings (My Preferences)
└── /history       → Notification log
```

**Completed:**
- [x] Updated `NotificationLayout.js` navigation
- [x] Removed Testing link from main navigation
- [x] Removed Templates from configuration (templates integrated into policies)
- [x] Renamed items for clarity (Recipients → Recipient Groups, Policies → Notification Rules)
- [x] Added descriptions to nav items
- [x] Simplified configuration section

### 2.2 Remove Testing Panel
- [x] Removed Testing from primary navigation
- [x] Testing functionality available via dashboard or direct URL if needed

### 2.3 User Preferences Page
- [ ] Add clearer category descriptions (future enhancement)
- [ ] Show notification preview (future enhancement)
- [ ] Add "Reset to defaults" button (future enhancement)

---

## Phase 3: Backend Cleanup ✅ COMPLETE

### 3.1 Notification Channels
- [x] Remove `SlackNotificationChannel.cs` (not used) - **Kept but deprecated**
- [x] Implement `PushNotificationChannel.cs` - Full implementation complete
- [x] Created `PushNotificationService.cs` with FCM support
- [x] Created `UserPushDevice` entity for token storage
- [x] Added `PushDevicesController` for device registration
- [x] Updated `DeliveryMethod` enum with Push option

### 3.2 AutomatedFuelingConfiguration Fix
- [x] Commented out missing `AutomatedFuelingConfiguration` entity reference in GpsdataContext
- [x] Build error resolved

### 3.3 Standardize Trigger Conditions JSON
Current: Multiple inconsistent formats
Target: Single JSON schema

**Tasks:**
- [ ] Define canonical trigger condition schema (future)
- [ ] Update `PolicyRulesProcessor.cs` (future)
- [ ] Migrate existing policy conditions (future)
- [ ] Update frontend policy editor (future)

### 3.4 Simplify Recipient Resolution
Current complexity is manageable. Consider simplification in future sprint.

---

## Phase 4: Push Notifications ✅ BACKEND COMPLETE

### 4.1 Backend Implementation
- [x] Create `UserPushDevice` entity
- [x] Create `UserPushDeviceConfiguration` EF config
- [x] Add `DbSet<UserPushDevice>` to context
- [x] Create `IPushNotificationService` interface
- [x] Create `PushNotificationService` with FCM support
- [x] Create `PushDevicesController` with endpoints:
  - POST `/register` - Register device token
  - POST `/unregister` - Remove device token
  - GET `/my-devices` - List user's devices
  - POST `/test` - Send test push
- [x] Register service in DI container
- [x] Update `DeliveryMethod` enum with Push

### 4.2 Database
- [x] Create migration SQL: `20250620_add_user_push_devices.sql`
- [ ] Run migration on database

### 4.3 Frontend Support
- [x] Add Push to `notificationEnums.js` with icon and description
- [ ] Add push preference toggle in user preferences (optional)

### 4.4 Documentation
- [x] Create `PUSH_NOTIFICATION_SETUP.md`
- [x] Include FCM setup instructions

---

## Phase 5: Mobile/Web Push Integration 🔄 PLANNED

### Current State Analysis
The mobile app (fms.mobile) uses:
- **SignalR** for real-time events when app is open
- **Notifee** (`@notifee/react-native`) for local notifications triggered by SignalR
- **No remote push** currently (notifications only work when app is connected)

### 5.1 Option A: Keep Current Architecture (Recommended) ✅
Your current setup is already functional:
- SignalR delivers real-time updates to connected mobile/web clients
- Notifee shows local notifications when SignalR events arrive
- Works well for users who have the app open

**Pros:** Simple, already working, no additional infrastructure
**Cons:** Notifications only work when app is open/connected

### 5.2 Option B: Add FCM for Background Push
If you need notifications when the app is closed:

#### Mobile App Changes (fms.mobile)
- [ ] Add `@react-native-firebase/messaging` package
- [ ] Configure Firebase project (free, doesn't require Play Store)
- [ ] Get FCM token on app startup
- [ ] Register token with backend via `/api/push-devices/register`
- [ ] Handle incoming push messages with Notifee
- [ ] Re-register token when refreshed

#### Web App Changes (fms.frontend)
- [ ] Add Firebase Web SDK
- [ ] Create Service Worker for push handling
- [ ] Request notification permission on login
- [ ] Register browser token with backend
- [ ] Handle push events in service worker

### 5.3 Decision Required
**Question for user:** Do you need notifications when the app is completely closed?
- **If NO**: Current SignalR + Notifee setup is perfect, no changes needed
- **If YES**: Need to implement FCM integration (about 2-4 hours work)

---

## Files to Archive

Move to `Documentation/NotificationSystem/_archive/`:
```
- NotificationModuleImplementation.md
- NotificationService_Refactoring_Summary.md
- ImplementationSummary.md
- NotificationRoutingGuide.md (outdated)
- SiteAdministrator_*.md (merged into main guide)
- Various HTML files in Documentation/Notification/
```

Keep:
```
- NOTIFICATION_SYSTEM_GUIDE.md (new comprehensive guide)
- REFACTORING_CHECKLIST.md (this file)
- README.md (updated to reference guide)
- NotificationSystem_Entities.md (entity reference)
```

---

## Testing Checklist

After each phase, verify:
- [ ] Categories can be created/edited in admin
- [ ] Policies can be created/edited in notifications module
- [ ] User preferences save correctly
- [ ] Notifications are sent via System channel
- [ ] Notifications are sent via Email channel
- [ ] Alarm triggers create notifications
- [ ] SignalR real-time updates work

---

## Notes

### Why This Refactoring?
1. **Confusion**: Users don't know where to configure notifications
2. **Duplication**: Policies shown in two places
3. **Complexity**: Too many recipient-related tables
4. **Documentation**: Scattered across 30+ files

### Success Criteria
- Single source of truth for each configuration type
- Clear navigation for different user roles
- Consolidated documentation
- No unused code in production

### Firebase Clarification (Jan 20, 2026)
**Firebase does NOT require Play Store**. You can use FCM for push notifications even for apps distributed outside the Play Store (APK sideloading, internal distribution, etc.). Firebase is just Google's push infrastructure - it's free and works regardless of how you distribute your app.
