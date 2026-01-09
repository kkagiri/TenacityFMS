# FMS Fuel Management System
## Feature Overview for Decision Makers

**Document Type:** Non-Technical Feature Guide
**Audience:** Fleet Managers, Operations Directors, Finance Teams
**Last Updated:** January 2026

---

## 🎉 What's New in 2026

Happy New Year! We're excited to share the latest updates to the FMS Fuel Management System. This release introduces powerful new features including:

- **Enhanced Mobile App** - Fuel anywhere with high security
- **Geofence Validation** - Control exactly where fueling can occur
- **Fixed Asset Protection** - Verify deliveries to generators and remote equipment
- **GPS Fuel Level Integration** - Automatic tank capacity protection
- **Variance Detection** - Catch fuel discrepancies within 24 hours

<screenshot>
**Dashboard Overview showing real-time fuel operations**
</screenshot>

---

## 💡 Key Benefits at a Glance

| What You Get | The Result |
|--------------|------------|
| **Complete Visibility** | Know exactly where every liter of fuel goes |
| **Automatic Controls** | Rules enforced 24/7 without manual intervention |
| **Mobile Operations** | Fuel anywhere with the same security as your depot |
| **Theft Prevention** | Multi-layer protection catches fraud before it happens |
| **Budget Compliance** | Daily and monthly limits enforced automatically |
| **Audit Ready** | Complete records for compliance and investigations |

---

## 🛡️ Safety & Security Features

### 1. No Fuel Without Authorization

Every fueling event requires explicit authorization. The system checks multiple factors before any fuel can be dispensed:

- ✅ Is this vehicle allowed to fuel?
- ✅ Is the operator authorized?
- ✅ Is the vehicle at the correct location?
- ✅ Is there space in the tank?
- ✅ Has the daily/monthly limit been reached?

**If any check fails, fuel is blocked and the attempt is logged.**

<screenshot>
**Authorization denied screen showing reason for rejection**
</screenshot>

---

### 2. Location Verification

The system confirms that fueling is happening at the right place:

| Check Type | What It Verifies |
|------------|------------------|
| **Vehicle Location** | The vehicle's GPS confirms it's at the fuel point |
| **Operator Location** | The operator's phone GPS confirms they're present |
| **Geofence Boundaries** | Fueling only allowed in designated areas |

**Why This Matters:** Prevents fuel diversion - you know fuel went where it was supposed to go.

<screenshot>
**Map showing vehicle and operator locations at fuel point**
</screenshot>

---

### 3. Physical Presence Required

The nozzle must be physically lifted before authorization is granted. This hardware-level check ensures someone is actually at the pump - remote authorization attempts are blocked.

<screenshot>
**Mobile app showing "Lift Nozzle to Continue" prompt**
</screenshot>

---

### 4. Tank Overfill Prevention

The system knows your vehicle's tank capacity and current fuel level (from GPS sensors). It automatically limits the authorization to what will actually fit in the tank.

**Example:**
- Tank Capacity: 200 liters
- Current Fuel Level: 150 liters (from GPS)
- Maximum Allowed: 50 liters

Even if the operator requests 100 liters, the system only authorizes 50.

<screenshot>
**Vehicle confirmation screen showing tank capacity and available space**
</screenshot>

---

### 5. Daily & Monthly Limits

Set fuel budgets per vehicle and the system enforces them automatically:

| Limit Type | How It Works |
|------------|--------------|
| **Daily Limit** | Maximum fuel per day, resets at midnight |
| **Monthly Limit** | Maximum fuel per month, resets on the 1st |
| **Per Fill Limit** | Maximum amount per single fueling event |

**Example:** A delivery truck has a 100L daily limit. After using 80L in the morning, only 20L remains available for the rest of the day.

<screenshot>
**Limits display showing daily and monthly usage progress**
</screenshot>

---

### 6. Refill Count Restrictions

Limit how many times a vehicle can fuel per day, week, or month. This prevents "drip feeding" - a fraud technique where small amounts are taken frequently to avoid detection.

**Example:** A salesperson's car is limited to 2 fills per week. Multiple small fills to fill unauthorized containers would be blocked.

<screenshot>
**Refill count indicator showing remaining fills**
</screenshot>

---

### 7. Time Window Control

Restrict fueling to specific hours of the day:

- **Depot Operations:** 6:00 AM - 10:00 PM
- **Construction Sites:** Only during working hours
- **Emergency Access:** Master tag required outside hours

<screenshot>
**Time window restriction notification**
</screenshot>

---

### 8. Geofence Boundaries

Define geographic areas where fueling is permitted. The system checks that the mobile tanker, operator, and/or receiving vehicle are within approved boundaries.

**Use Cases:**
- Company depots only
- Approved construction sites
- Customer delivery locations

<screenshot>
**Geofence map showing allowed fueling zones**
</screenshot>

---

### 9. Stationary Asset Protection

For generators, construction equipment, and other fixed assets:

- Register the asset's GPS location
- Tanker must be at that location to fuel
- Prevents fuel diversion to unauthorized locations

<screenshot>
**Fixed asset location confirmation screen**
</screenshot>

---

### 10. Complete Audit Trail

Every action is logged with full details:

- Who authorized the fueling
- Vehicle identification
- Location (GPS coordinates)
- Amount requested vs. dispensed
- All validation checks performed
- Any overrides or exceptions

**Why This Matters:** Complete evidence for investigations, insurance claims, and compliance audits.

<screenshot>
**Transaction history with detailed audit information**
</screenshot>

---

## 📱 Mobile Application Features

### Fuel Anywhere with Full Security

The FMS Mobile App brings depot-level security to field operations. Operators can fuel vehicles anywhere while maintaining complete control and visibility.

<screenshot>
**Mobile app home screen**
</screenshot>

---

### Simple 10-Step Fueling Process

The app guides operators through a secure fueling workflow:

| Step | What Happens |
|------|--------------|
| 1. **Select Tank** | Choose which fuel source to use |
| 2. **Select Pump** | Pick an available pump |
| 3. **Select Nozzle** | Choose the fuel type/nozzle |
| 4. **Choose Mode** | Vehicle fueling or tank-to-tank transfer |
| 5. **Select Vehicle** | Scan RFID tag or search by name |
| 6. **Confirm Vehicle** | Review limits and restrictions |
| 7. **Enter Volume** | Set the amount (validated against limits) |
| 8. **Authorize** | Send authorization to pump |
| 9. **Monitor** | Watch live fueling progress |
| 10. **Complete** | Review transaction summary |

<screenshot>
**Step-by-step fueling workflow screens**
</screenshot>

---

### Live Transaction Monitoring

During fueling, the app shows real-time progress:

- Volume dispensed
- Amount in currency
- Progress toward authorized volume
- Pump and nozzle status

Operators can minimize this view and continue using the app while fueling completes.

<screenshot>
**Live fueling progress screen**
</screenshot>

---

### Vehicle Search & RFID Scanning

Find vehicles quickly:

- **RFID Scan:** Hold phone near vehicle tag for instant identification
- **Search:** Type vehicle name, plate number, or fleet number
- **Recent:** Quick access to recently fueled vehicles

<screenshot>
**Vehicle selection screen with search and RFID options**
</screenshot>

---

### Limit Visibility

Before fueling, operators see exactly what's available:

- Daily remaining allowance
- Monthly remaining allowance
- Tank capacity available
- Per-transaction maximum

**No surprises** - operators know upfront if there will be any restrictions.

<screenshot>
**Vehicle confirmation showing all applicable limits**
</screenshot>

---

### Offline Capability

The app caches essential data for poor connectivity situations:

- Vehicle list and details
- Validation settings
- Recent transactions

When connectivity returns, data syncs automatically.

---

### No Rules Warning

When a vehicle hasn't been configured with fueling rules, the app alerts the operator:

- **Assign Rules:** Configure rules on the spot (if permitted)
- **Master Tag Override:** Continue with supervisor authorization
- **Cancel:** Return to vehicle selection

<screenshot>
**No rules warning modal with options**
</screenshot>

---

## 🔄 How Mobile & Depot Work Together

### Centralized Control, Distributed Operations

```
┌─────────────────────────────────────────────────────────────────┐
│                     FMS CLOUD PLATFORM                          │
│                                                                 │
│   • Stores all rules and configurations                        │
│   • Processes all authorizations                               │
│   • Logs all transactions                                      │
│   • Generates reports and alerts                               │
└─────────────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │   DEPOT     │      │   MOBILE    │      │   ADMIN     │
   │   PUMPS     │      │   TANKERS   │      │   PORTAL    │
   │             │      │             │      │             │
   │ Fixed pump  │      │ Operators   │      │ Managers    │
   │ controllers │      │ with mobile │      │ configure   │
   │             │      │ app         │      │ rules       │
   └─────────────┘      └─────────────┘      └─────────────┘
```

### Same Rules Everywhere

Whether fueling happens at a fixed depot or from a mobile tanker in the field, the **same rules apply**:

- Same vehicle limits
- Same authorization checks
- Same audit logging
- Same real-time visibility

<screenshot>
**Admin portal showing rules that apply to all fueling points**
</screenshot>

---

### Real-Time Visibility

Managers can see all fueling activity as it happens:

- Active transactions in progress
- Completed transactions today
- Exceptions and alerts
- Vehicle locations on map

<screenshot>
**Operations dashboard with real-time activity**
</screenshot>

---

### Centralized Configuration

All settings managed from one place:

| Setting | Applies To |
|---------|------------|
| Fuel Rules | All vehicles across all sites |
| Location Validation | Specific devices or all |
| Time Windows | Per site or organization-wide |
| User Permissions | All operators |

**Change once, apply everywhere.**

<screenshot>
**Configuration panel in admin portal**
</screenshot>

---

## 📊 Reporting & Analytics

### What You Can Track

| Report Type | What It Shows |
|-------------|---------------|
| **Consumption by Vehicle** | Fuel usage per vehicle over time |
| **Consumption by Driver** | Who is using the most fuel |
| **Exceptions Report** | Blocked attempts, overrides, anomalies |
| **Variance Analysis** | Expected vs. actual consumption |
| **Cost Allocation** | Fuel costs by department/project |

<screenshot>
**Sample consumption report**
</screenshot>

---

### Variance Detection

The system compares expected consumption (from GPS tracking) with actual fuel dispensed:

| Variance | Status | Action |
|----------|--------|--------|
| < 2% | ✅ Normal | No action needed |
| 2-5% | ⚠️ Warning | Review recommended |
| > 5% | 🔴 Alert | Investigation required |

**Catch discrepancies within 24 hours** instead of discovering losses at month-end.

<screenshot>
**Variance detection dashboard**
</screenshot>

---

## 🚀 Getting Started

### Implementation Steps

1. **Hardware Setup** - Install PTS controllers at fuel points
2. **Configure Rules** - Set up fuel rules for your fleet
3. **Deploy Mobile App** - Train operators on the mobile application
4. **Go Live** - Start with monitoring mode, then enable enforcement
5. **Optimize** - Review reports and adjust rules as needed

### Training & Support

- In-app guidance for operators
- Administrator training included
- Ongoing technical support

---

## ✅ Summary: What FMS Delivers

| Challenge | FMS Solution |
|-----------|--------------|
| "Where is our fuel going?" | Complete tracking from storage to vehicle |
| "We can't control remote fueling" | Mobile app with full validation anywhere |
| "Budget overruns every month" | Automatic limit enforcement per vehicle |
| "Can't detect theft until month-end" | Real-time variance alerts within 24 hours |
| "No evidence for investigations" | Complete audit trail with GPS coordinates |
| "Manual processes are error-prone" | Automated validation and logging |
| "Rules aren't consistently applied" | Same rules everywhere, no exceptions |

---

## 📞 Next Steps

To learn more about FMS Fuel Management:

1. **Request a Demo** - See the system in action with your scenarios
2. **Site Assessment** - We evaluate your fuel points and requirements
3. **Pilot Program** - Try it at one location before full rollout
4. **Full Deployment** - Roll out across all sites with training

---

*FMS Fuel Management - Complete Control. Total Visibility. Zero Waste.*

