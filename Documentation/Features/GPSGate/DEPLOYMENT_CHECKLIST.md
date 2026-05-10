# GPSGate Integration - Final Setup Checklist

## ?? Pre-Deployment Checklist

### 1. Code Review
- [ ] Review all created files for correctness
- [ ] Verify SOAP service references are correct
- [ ] Check entity configurations match database schema
- [ ] Ensure all handlers return FMSResponse<T>
- [ ] Verify AutoMapper profile is registered

### 2. Database Setup
- [ ] Run migration script: `Documentation/GPSGate/database/01_gpsgate_tables.sql`
- [ ] Verify tables created successfully
  ```sql
  SHOW TABLES LIKE 'gpsgate%';
  ```
- [ ] Check default report definitions inserted
  ```sql
  SELECT * FROM gpsgate_report_definitions;
  ```
- [ ] Verify indexes created
  ```sql
  SHOW INDEX FROM gpsgate_sessions;
  SHOW INDEX FROM gpsgate_reports;
  ```

### 3. Service Registration
- [ ] Add service registrations to DI container
  ```csharp
  services.AddScoped<IGPSGateDirectoryService, GPSGateDirectoryService>();
  services.AddScoped<IGPSGateReportingService, GPSGateReportingService>();
  ```
- [ ] Verify MediatR is registered (should already be)
- [ ] Check AutoMapper is configured (should already be)

### 4. Configuration
- [ ] Verify GPSGate server endpoint URLs
  - Default: `http://10.0.10.150/GpsGateServer/Services/`
- [ ] Update if needed in Connected Services configurations
- [ ] Test network connectivity to GPSGate server
  ```bash
  curl http://10.0.10.150/GpsGateServer/Services/directory.asmx
  ```

### 5. Build & Compile
- [ ] Build solution
  ```bash
  dotnet build Tenacity.Fms.sln
  ```
- [ ] Check for compilation errors
- [ ] Resolve any missing references
- [ ] Verify no warnings in GPSGate code

## ?? Testing Checklist

### 1. Unit Tests (Recommended)
- [ ] Test LoginCommandHandler
- [ ] Test GenerateReportCommandHandler
- [ ] Test query handlers
- [ ] Test service layer methods
- [ ] Test validation logic

### 2. Integration Tests
- [ ] Test complete login flow
- [ ] Test report generation workflow
- [ ] Test database persistence
- [ ] Test error scenarios

### 3. Manual Testing

#### A. Test Login Endpoint
```bash
# Using curl
curl -X POST "https://localhost:5001/api/gpsgate/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "password": "your_password",
    "applicationId": 1
  }'
```
- [ ] Test with valid credentials ? Should return sessionId
- [ ] Test with invalid credentials ? Should return error
- [ ] Check database for session entry
- [ ] Verify session expiration is set

#### B. Test Report Generation
```bash
# Using curl
curl -X POST "https://localhost:5001/api/gpsgate/reports/generate?sessionId=YOUR_SESSION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "reportId": 208,
    "startDate": "2024-01-01T00:00:00",
    "endDate": "2024-01-31T23:59:59"
  }'
```
- [ ] Test with valid session ? Should return handleId
- [ ] Test with invalid session ? Should return error
- [ ] Check database for report entry
- [ ] Verify status is "Processing"

#### C. Test Report Status
```bash
curl -X GET "https://localhost:5001/api/gpsgate/reports/status/12345?sessionId=YOUR_SESSION_ID"
```
- [ ] Should return current status and progress
- [ ] Check database status updated

#### D. Test Fetch Report
```bash
curl -X GET "https://localhost:5001/api/gpsgate/reports/fetch/12345?sessionId=YOUR_SESSION_ID"
```
- [ ] Should return report data when completed
- [ ] Check database has report_data populated

#### E. Test Report History
```bash
curl -X GET "https://localhost:5001/api/gpsgate/reports/history?reportId=208&status=Completed"
```
- [ ] Should return list of reports
- [ ] Test filtering by reportId
- [ ] Test filtering by status

### 4. Database Validation
```sql
-- Check session created
SELECT * FROM gpsgate_sessions ORDER BY created_at DESC LIMIT 5;

-- Check reports
SELECT * FROM gpsgate_reports ORDER BY requested_at DESC LIMIT 10;

-- Check report data populated
SELECT id, handle_id, status, LENGTH(report_data) as data_size
FROM gpsgate_reports
WHERE report_data IS NOT NULL;
```

## ?? Post-Deployment Checklist

### 1. Monitoring Setup
- [ ] Configure logging for GPSGate operations
- [ ] Set up alerts for failed logins
- [ ] Monitor report generation success rate
- [ ] Track API response times

### 2. Documentation
- [ ] Update API documentation (Swagger)
- [ ] Document any configuration changes
- [ ] Share setup guide with team
- [ ] Document known issues/limitations

### 3. Security
- [ ] Review authentication flow
- [ ] Ensure sensitive data is not logged
- [ ] Verify session timeout is appropriate
- [ ] Check authorization on all endpoints

### 4. Performance
- [ ] Test with multiple concurrent requests
- [ ] Monitor database query performance
- [ ] Check for N+1 query issues
- [ ] Verify proper indexing

### 5. Error Handling
- [ ] Test network timeout scenarios
- [ ] Test GPSGate server unavailable
- [ ] Test invalid report IDs
- [ ] Test session expiration handling

## ?? Deployment Steps

### Development Environment
1. [ ] Run database migration
2. [ ] Build and run application
3. [ ] Test all endpoints
4. [ ] Verify logging works

### Staging Environment
1. [ ] Deploy database changes
2. [ ] Deploy application code
3. [ ] Update configuration
4. [ ] Run smoke tests
5. [ ] Perform full integration test

### Production Environment
1. [ ] Schedule maintenance window
2. [ ] Backup database
3. [ ] Deploy database changes
4. [ ] Deploy application code
5. [ ] Update configuration
6. [ ] Run smoke tests
7. [ ] Monitor for errors
8. [ ] Notify team of completion

## ?? Troubleshooting Guide

### Issue: "Could not connect to SOAP service"
**Check:**
- [ ] GPSGate server is running
- [ ] Network connectivity
- [ ] Firewall rules
- [ ] Endpoint URLs correct

### Issue: "Session ID not found"
**Check:**
- [ ] Login was successful
- [ ] Session not expired
- [ ] Database connection working
- [ ] Session properly saved

### Issue: "Report generation failed"
**Check:**
- [ ] Valid report ID
- [ ] Date range is valid
- [ ] GPSGate has data for period
- [ ] Check error_message in database

### Issue: "Report data is NULL"
**Check:**
- [ ] Report completed successfully
- [ ] Called FetchReport endpoint
- [ ] GPSGate returned data
- [ ] No SOAP errors

## ? Sign-Off

### Development Team
- [ ] Code review completed
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Documentation complete

### QA Team
- [ ] Manual testing completed
- [ ] All test cases passed
- [ ] Performance acceptable
- [ ] No critical bugs

### DevOps Team
- [ ] Database scripts reviewed
- [ ] Deployment plan reviewed
- [ ] Monitoring configured
- [ ] Backup procedures in place

### Product Owner
- [ ] Functionality reviewed
- [ ] Meets requirements
- [ ] Ready for deployment

---

## ?? Notes

**GPSGate Credentials:**
- Username: _____________
- Application ID: _____________
- Test Environment: _____________

**Database:**
- Server: _____________
- Database: _____________
- Migration Date: _____________

**Deployment Date:** _____________

**Deployed By:** _____________

**Sign-off Date:** _____________
