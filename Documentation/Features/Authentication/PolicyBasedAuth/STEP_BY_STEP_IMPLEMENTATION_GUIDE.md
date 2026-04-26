# RefreshToken Implementation - Step-by-Step Guide
**MySQL Version: 5.5.6**
**Date: November 26, 2025**
**Status: ✅ Backend Complete | ⏳ Database Migration Pending | ⏳ Testing Pending**

---

## 🎯 What Was Implemented

This guide covers the complete implementation of JWT refresh tokens for the FMS system, enabling:
- ✅ **30-day sessions** with short-lived access tokens
- ✅ **Automatic token refresh** on 401 errors
- ✅ **Token rotation** for enhanced security
- ✅ **IP tracking** and usage monitoring
- ✅ **Server-side token revocation**

---

## 📋 Prerequisites

Before starting, ensure you have:
- [x] MySQL 5.5.6 or higher running
- [x] Database connection string configured in appsettings.json
- [x] EF Core tools installed: `dotnet tool install --global dotnet-ef`
- [x] Backup of production database (if applying to production)

---

## 🔧 Implementation Steps

### ✅ Step 1: Backend Code Changes (COMPLETED)

#### 1.1 Entity Created ✅
**File:** `FMS.Domain/Entities/Features/UserManagement/RefreshToken.cs`

```csharp
public class RefreshToken
{
    public int Id { get; set; }
    public string Token { get; set; }              // Crypto-secure random token
    public string UserId { get; set; }             // Foreign key to User
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }        // 30 days from creation
    public bool IsRevoked { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? RevocationReason { get; set; }
    public string? CreatedByIp { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public string? LastUsedByIp { get; set; }
    public int? ReplacedByTokenId { get; set; }    // Token rotation tracking
    public bool IsActive => !IsRevoked && DateTime.UtcNow < ExpiresAt;
}
```

#### 1.2 DbContext Updated ✅
**File:** `FMS.Persistence/DataAccess/GpsdataContext.cs`

**Changes:**
- Added `using FMS.Domain.Entities.Features.UserManagement;`
- Added `public virtual DbSet<RefreshToken> RefreshTokens { get; set; }`
- Registered `RefreshTokenConfiguration` in `OnModelCreating`

#### 1.3 Entity Configuration Created ✅
**File:** `FMS.Persistence/EntityConfigurations/RefreshTokenConfiguration.cs`

**Key Features:**
- Table name: `refreshtokens`
- Unique index on `token` for fast lookup
- Index on `user_id` for user token queries
- Composite index `(user_id, is_revoked, expires_at)` for finding active tokens
- Foreign key to `aspnetusers` with CASCADE delete
- Self-referencing FK for token rotation tracking

#### 1.4 Login Command Updated ✅
**File:** `FMS.Application/Features/UserManagement/User/Commands/UserLogin.cs`

**Changes:**
- Returns `LoginResponseDto` with `Token`, `RefreshToken`, and `User`
- Generates refresh token using `_jwtTokenGenerator.GenerateRefreshToken()`
- Stores refresh token in database with 30-day expiry
- Tracks creation IP address

#### 1.5 Refresh Token Endpoint Ready ✅
**File:** `FMS.WebClient/Controllers/UserManagement/UserController.cs`

**Endpoint:** `POST /User/refresh-token`

**Request:**
```json
{
  "refreshToken": "base64-encoded-token"
}
```

**Response:**
```json
{
  "IsSuccess": true,
  "Data": {
    "Token": "new-access-token",
    "RefreshToken": "new-refresh-token",
    "User": { ... }
  }
}
```

**Features:**
- ✅ Validates refresh token from database
- ✅ Checks if token is active (not revoked, not expired)
- ✅ Generates new access token with fresh permissions
- ✅ Token rotation (new refresh token, old one revoked)
- ✅ Updates usage tracking (IP, timestamps)

#### 1.6 Build Verification ✅
**Status:** ✅ Build successful (152 warnings, 0 errors)

```bash
FMS.WebClient succeeded with 152 warning(s) (13.2s) → FMS.WebClient\bin\Debug\net8.0\FMS.WebClient.dll
```

---

### ⏳ Step 2: Database Migration (PENDING)

#### 2.1 MySQL Schema Script Created ✅
**File:** `Documentation/Features/AuthPoliceBasedAuthority/database/01_create_refreshtokens_table.sql`

**Execute this script manually OR use EF Core migration (next step)**

#### 2.2 Option A: Manual MySQL Execution

**For MySQL 5.5.6:**
```bash
# Connect to MySQL
mysql -u root -p

# Select database (replace 'gpsdata' with your database name)
USE gpsdata;

# Run the script
source Documentation/Features/AuthPoliceBasedAuthority/database/01_create_refreshtokens_table.sql;

# Verify table creation
DESCRIBE refreshtokens;
```

**Expected Output:**
```
+----------------------+--------------+------+-----+---------+----------------+
| Field                | Type         | Null | Key | Default | Extra          |
+----------------------+--------------+------+-----+---------+----------------+
| Id                   | int(11)      | NO   | PRI | NULL    | auto_increment |
| token                | varchar(500) | NO   | UNI | NULL    |                |
| user_id              | varchar(450) | NO   | MUL | NULL    |                |
| created_at           | datetime     | NO   |     | NULL    |                |
| expires_at           | datetime     | NO   | MUL | NULL    |                |
| is_revoked           | tinyint(1)   | NO   |     | 0       |                |
| revoked_at           | datetime     | YES  |     | NULL    |                |
| revocation_reason    | varchar(200) | YES  |     | NULL    |                |
| created_by_ip        | varchar(50)  | YES  |     | NULL    |                |
| last_used_at         | datetime     | YES  |     | NULL    |                |
| last_used_by_ip      | varchar(50)  | YES  |     | NULL    |                |
| replaced_by_token_id | int(11)      | YES  | MUL | NULL    |                |
+----------------------+--------------+------+-----+---------+----------------+
```

#### 2.3 Option B: EF Core Migration (Recommended for Development)

**Generate Migration:**
```powershell
# Navigate to solution directory
cd "C:\Users\kkagiri\source\repos\Tenacy.Fms"

# Generate migration
dotnet ef migrations add AddRefreshTokensTable `
  --project FMS.Persistence `
  --startup-project FMS.WebClient `
  --output-dir Migrations `
  --context GpsdataContext
```

**Review Migration:**
```powershell
# Check migration files
ls FMS.Persistence\Migrations\*AddRefreshTokensTable*
```

**Apply Migration:**

**Development Environment:**
```powershell
# Update database
dotnet ef database update `
  --project FMS.Persistence `
  --startup-project FMS.WebClient `
  --context GpsdataContext
```

**Production Environment:**
```powershell
# Generate SQL script for manual review
dotnet ef migrations script `
  --project FMS.Persistence `
  --startup-project FMS.WebClient `
  --context GpsdataContext `
  --output migration.sql

# Review migration.sql, then execute on production database
```

#### 2.4 Verify Database

**Check Table Exists:**
```sql
SELECT TABLE_NAME, ENGINE, TABLE_ROWS
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'gpsdata'
AND TABLE_NAME = 'refreshtokens';
```

**Check Indexes:**
```sql
SHOW INDEX FROM refreshtokens;
```

**Expected Indexes:**
- `PRIMARY` on `Id`
- `idx_refreshtoken_token` (UNIQUE) on `token`
- `idx_refreshtoken_userid` on `user_id`
- `idx_refreshtoken_expiresat` on `expires_at`
- `idx_refreshtoken_active` on `(user_id, is_revoked, expires_at)`
- `FK_refreshtokens_AspNetUsers_user_id` (Foreign Key)
- `FK_refreshtokens_refreshtokens_replaced_by_token_id` (Foreign Key)

---

### ⏳ Step 3: Testing (PENDING)

#### 3.1 Test Login Endpoint

**Request:**
```bash
POST http://localhost:5000/User/Login
Content-Type: application/json

{
  "username": "admin",
  "password": "yourpassword"
}
```

**Expected Response:**
```json
{
  "IsSuccess": true,
  "Data": {
    "Token": "eyJhbGc...",           // Access token (15 min or 7 days)
    "RefreshToken": "base64...",      // NEW! Refresh token (30 days)
    "User": {
      "Id": "...",
      "UserName": "admin",
      "Email": "admin@example.com",
      "Roles": ["Admin"]
    }
  },
  "Message": "Login successful"
}
```

**Verify in Database:**
```sql
SELECT id, user_id, created_at, expires_at, is_revoked, created_by_ip
FROM refreshtokens
ORDER BY created_at DESC
LIMIT 1;
```

#### 3.2 Test Refresh Token Endpoint

**Wait for access token to expire (or force expiry by changing JWT settings), then:**

**Request:**
```bash
POST http://localhost:5000/User/refresh-token
Content-Type: application/json

{
  "refreshToken": "base64-encoded-token-from-login"
}
```

**Expected Response:**
```json
{
  "IsSuccess": true,
  "Data": {
    "Token": "new-access-token",
    "RefreshToken": "new-refresh-token",  // New refresh token
    "User": { ... }
  },
  "Message": "Token refreshed successfully"
}
```

**Verify Token Rotation in Database:**
```sql
-- Old token should be revoked
SELECT id, is_revoked, revoked_at, revocation_reason, replaced_by_token_id
FROM refreshtokens
WHERE token = 'old-token-here';

-- New token should be active
SELECT id, is_revoked, created_at, expires_at
FROM refreshtokens
WHERE token = 'new-token-here';
```

#### 3.3 Test Expired Refresh Token

**Manually expire a token:**
```sql
UPDATE refreshtokens
SET expires_at = DATE_SUB(NOW(), INTERVAL 1 DAY)
WHERE id = 1;
```

**Try to use expired token:**
```bash
POST http://localhost:5000/User/refresh-token
Content-Type: application/json

{
  "refreshToken": "expired-token"
}
```

**Expected Response:**
```json
{
  "IsSuccess": false,
  "Errors": ["Invalid or expired refresh token"],
  "Message": "Token refresh failed"
}
```

#### 3.4 Test Revoked Refresh Token

**Manually revoke a token:**
```sql
UPDATE refreshtokens
SET is_revoked = 1,
    revoked_at = NOW(),
    revocation_reason = 'Manual test'
WHERE id = 1;
```

**Try to use revoked token:**
```bash
POST http://localhost:5000/User/refresh-token
Content-Type: application/json

{
  "refreshToken": "revoked-token"
}
```

**Expected Response:**
```json
{
  "IsSuccess": false,
  "Errors": ["Invalid or expired refresh token"],
  "Message": "Token refresh failed"
}
```

---

### ⏳ Step 4: Frontend Integration (PENDING)

#### 4.1 Verify Axios Interceptor

**File:** `fms.frontend/src/api/axiosInstance.js`

**Expected Code:**
```javascript
// Axios response interceptor - automatic token refresh on 401
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        originalRequest._retry = true;

        try {
          const response = await axiosInstance.post("/User/refresh-token", {
            refreshToken
          });

          const { Token, RefreshToken } = response.data.Data;
          localStorage.setItem("token", Token);
          localStorage.setItem("refreshToken", RefreshToken);

          originalRequest.headers["Authorization"] = "Bearer " + Token;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.clear();
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);
```

#### 4.2 Verify AuthActions

**File:** `fms.frontend/src/redux/actions/AuthActions.js`

**Check Login Action:**
```javascript
export const signIn = (username, password) => async (dispatch) => {
  try {
    const response = await axiosInstance.post("/User/Login", {
      username,
      password
    });

    const { Token: token, RefreshToken: refreshToken, User: user } = response.data.Data;

    // Store tokens
    localStorage.setItem("token", token);
    localStorage.setItem("refreshToken", refreshToken);  // NEW!

    // Dispatch actions
    dispatch({ type: LOGIN_SUCCESS, payload: { token, user } });
    dispatch({ type: USER_LOADED, payload: user });

    return { success: true };
  } catch (error) {
    dispatch({ type: LOGIN_FAIL });
    return { success: false, error: error.response?.data };
  }
};
```

**Check Logout Action:**
```javascript
export const logout = () => (dispatch) => {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");  // NEW!
  dispatch({ type: LOGOUT });
};
```

#### 4.3 Test Frontend Flow

1. **Login via UI:**
   - Navigate to `/login`
   - Enter credentials
   - Click Login
   - Check browser console for token storage
   - Verify `localStorage.getItem("refreshToken")` exists

2. **Test Automatic Refresh:**
   - Make API calls that return 401 (expired token)
   - Watch Network tab in DevTools
   - Should see automatic call to `/User/refresh-token`
   - Should see original request retry with new token

3. **Test Logout:**
   - Click Logout
   - Verify both tokens are cleared from localStorage
   - Verify redirect to login page

---

## 🔍 Troubleshooting

### Issue: "RefreshTokens does not exist" Error

**Solution:**
```bash
# Run database migration
dotnet ef database update --project FMS.Persistence --startup-project FMS.WebClient
```

### Issue: Foreign Key Constraint Fails

**Solution:**
```sql
-- Ensure aspnetusers table exists and has Id column
SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_NAME = 'aspnetusers';

-- If missing, Identity tables not created - run migrations
```

### Issue: Token Not Rotating

**Check:**
1. Token rotation code in `UserController.cs` line 263
2. Database trigger not interfering
3. Transaction rollback not happening

**Debug Query:**
```sql
SELECT id, is_revoked, revocation_reason, replaced_by_token_id, revoked_at
FROM refreshtokens
WHERE user_id = 'USER_ID_HERE'
ORDER BY created_at DESC
LIMIT 5;
```

### Issue: Frontend Not Storing Refresh Token

**Check:**
1. API response includes `RefreshToken` field
2. `AuthActions.js` extracts `RefreshToken` from response
3. localStorage is not disabled by browser
4. No errors in browser console

**Debug:**
```javascript
// In browser console after login
console.log(localStorage.getItem("token"));
console.log(localStorage.getItem("refreshToken"));
```

---

## 📊 Monitoring & Maintenance

### Cleanup Expired Tokens

**Run Weekly:**
```sql
-- Delete expired tokens older than 30 days
DELETE FROM refreshtokens
WHERE expires_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

**Or create a scheduled job:**
```sql
-- MySQL Event (requires EVENT scheduler enabled)
CREATE EVENT cleanup_expired_tokens
ON SCHEDULE EVERY 1 WEEK
DO
DELETE FROM refreshtokens
WHERE expires_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

### Monitor Token Usage

**Active Tokens Per User:**
```sql
SELECT u.UserName, COUNT(*) as active_tokens
FROM refreshtokens rt
JOIN aspnetusers u ON rt.user_id = u.Id
WHERE rt.is_revoked = 0 AND rt.expires_at > NOW()
GROUP BY u.UserName
ORDER BY active_tokens DESC;
```

**Token Creation Rate:**
```sql
SELECT DATE(created_at) as date, COUNT(*) as tokens_created
FROM refreshtokens
WHERE created_at > DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

**Suspicious Activity (Multiple IPs):**
```sql
SELECT user_id, COUNT(DISTINCT created_by_ip) as ip_count
FROM refreshtokens
WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
GROUP BY user_id
HAVING ip_count > 3;
```

---

## ✅ Completion Checklist

### Backend
- [x] RefreshToken entity created
- [x] DbSet added to GpsdataContext
- [x] Entity configuration created
- [x] Configuration registered in OnModelCreating
- [x] Login command updated to return refresh token
- [x] Refresh token endpoint implemented
- [x] JWT generator has GenerateRefreshToken() method
- [x] Solution builds successfully

### Database
- [ ] MySQL script executed OR EF migration applied
- [ ] Table `refreshtokens` exists
- [ ] All indexes created correctly
- [ ] Foreign keys working
- [ ] Login creates refresh token in database
- [ ] Refresh endpoint rotates tokens correctly

### Frontend
- [ ] Axios interceptor handles 401 errors
- [ ] Login stores refresh token
- [ ] Logout clears refresh token
- [ ] Automatic token refresh works
- [ ] Failed requests retry after refresh

### Testing
- [ ] Login returns refresh token
- [ ] Refresh token stored in database
- [ ] Token rotation works (old revoked, new created)
- [ ] Expired tokens rejected
- [ ] Revoked tokens rejected
- [ ] IP tracking working
- [ ] Frontend auto-refresh working
- [ ] Logout clears all tokens

---

## 📚 Next Steps

1. **Apply Database Migration** (Step 2)
2. **Run Tests** (Step 3)
3. **Verify Frontend** (Step 4)
4. **Set Up Token Cleanup Job** (Monitoring section)
5. **Update Documentation** for users
6. **Consider Moving to httpOnly Cookies** (security improvement)

---

## 🔐 Security Notes

### Current Implementation
- ✅ Token rotation (old token revoked on each refresh)
- ✅ IP tracking (audit trail)
- ✅ Server-side revocation (logout invalidates tokens)
- ✅ Expiration handling (30-day max)
- ⚠️ localStorage (vulnerable to XSS attacks)

### Recommended Improvements
1. **Move to httpOnly Cookies:**
   - More secure than localStorage
   - Not accessible via JavaScript
   - Prevents XSS token theft

2. **Add CSRF Protection:**
   - When using cookies
   - Prevents cross-site request forgery

3. **Implement Token Fingerprinting:**
   - Bind token to browser fingerprint
   - Detect token theft across devices

4. **Add Rate Limiting:**
   - Limit refresh attempts
   - Prevent brute force attacks

---

**Documentation Version:** 1.0
**Last Updated:** November 26, 2025
**Author:** System Implementation
**Status:** ✅ Backend Complete | ⏳ Database & Testing Pending
