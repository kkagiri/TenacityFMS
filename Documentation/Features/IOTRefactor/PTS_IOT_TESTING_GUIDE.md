# PTS-IoT Migration Testing Guide

## 🧪 Testing Strategy

This guide provides step-by-step testing procedures for your PTS-IoT migration.

### Test Environment Setup

**Prerequisites:**
- Existing PTS system running with at least one test device
- New IoT architecture files deployed
- Redis server accessible
- Database with both legacy and IoT tracking tables

### Phase 1: Pre-Migration Validation

#### Test 1: Verify Existing PTS System
```powershell
# test_existing_pts.ps1
$deviceId = "TEST_PTS_001"
$ptsMessage = @{
    Protocol = "jsonPTS"
    PtsId = [guid]::NewGuid().ToString()
    Packets = @(
        @{
            Id = 1
            Type = "UploadStatus"
            Data = @{
                Status = "Online"
                BatteryLevel = 85
                SignalStrength = 75
            }
        }
    )
} | ConvertTo-Json -Depth 5

# Test existing HTTP endpoint
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/pts/message" `
        -Method Post `
        -ContentType "application/json" `
        -Body $ptsMessage `
        -Headers @{ "X-Device-Id" = $deviceId }

    Write-Host "✅ Existing PTS system working" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Existing PTS system failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
```

#### Test 2: Redis Connectivity
```powershell
# test_redis_connectivity.ps1
$redisHost = "localhost"
$redisPort = 6379

try {
    # Test Redis connection using .NET Redis client or external tool
    $testKey = "test:connectivity:$(Get-Date -Format 'yyyyMMddHHmmss')"

    # Using redis-cli if available
    $setResult = redis-cli -h $redisHost -p $redisPort SET $testKey "test-value" EX 10
    $getResult = redis-cli -h $redisHost -p $redisPort GET $testKey

    if ($getResult -eq "test-value") {
        Write-Host "✅ Redis connectivity verified" -ForegroundColor Green
        redis-cli -h $redisHost -p $redisPort DEL $testKey | Out-Null
    } else {
        throw "Redis test failed"
    }
} catch {
    Write-Host "❌ Redis connectivity failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
```

### Phase 2: IoT Components Testing

#### Test 3: Protocol Handler Validation
```powershell
# test_protocol_handler.ps1
$testCases = @(
    @{
        Name = "Simple UploadStatus"
        PtsMessage = @{
            Protocol = "jsonPTS"
            PtsId = "test-001"
            Packets = @(
                @{
                    Id = 1
                    Type = "UploadStatus"
                    Data = @{ Status = "Online"; Battery = 90 }
                }
            )
        }
        ExpectedMessageType = "telemetry"
    },
    @{
        Name = "Pump Authorization"
        PtsMessage = @{
            Protocol = "jsonPTS"
            PtsId = "test-002"
            Packets = @(
                @{
                    Id = 1
                    Type = "PumpAuthorize"
                    Data = @{ PumpId = 1; RequestId = "REQ001" }
                }
            )
        }
        ExpectedMessageType = "command"
    }
)

foreach ($testCase in $testCases) {
    Write-Host "Testing: $($testCase.Name)" -ForegroundColor Cyan

    $jsonMessage = $testCase.PtsMessage | ConvertTo-Json -Depth 5

    try {
        # Test protocol handler endpoint (assuming you've added one)
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/iot/test-protocol" `
            -Method Post `
            -ContentType "application/json" `
            -Body $jsonMessage

        if ($response.MessageType -eq $testCase.ExpectedMessageType) {
            Write-Host "✅ $($testCase.Name) passed" -ForegroundColor Green
        } else {
            Write-Host "❌ $($testCase.Name) failed - Expected: $($testCase.ExpectedMessageType), Got: $($response.MessageType)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ $($testCase.Name) error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
```

#### Test 4: Data Integration Service
```powershell
# test_data_integration.ps1
$deviceId = "TEST_PTS_001"

# Test data transformation
$deviceMessage = @{
    MessageId = [guid]::NewGuid().ToString()
    DeviceId = $deviceId
    Protocol = "jsonPTS"
    MessageType = "telemetry"
    Data = @{
        uploadStatus = @{
            Status = "Online"
            BatteryLevel = 88
            SignalStrength = 72
            Timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        }
    }
    Timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
} | ConvertTo-Json -Depth 5

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/iot/test-transform" `
        -Method Post `
        -ContentType "application/json" `
        -Body $deviceMessage

    Write-Host "✅ Data transformation test passed" -ForegroundColor Green
    Write-Host "Cached to: $($response.CacheKeys -join ', ')" -ForegroundColor Gray
} catch {
    Write-Host "❌ Data transformation test failed: $($_.Exception.Message)" -ForegroundColor Red
}
```

### Phase 3: Migration Testing

#### Test 5: Hybrid Processing
```powershell
# test_hybrid_processing.ps1
$deviceId = "TEST_PTS_001"

# First, configure device for IoT processing
$config = @{
    IoTMigration = @{
        EnableIoTProcessing = $true
        DevicesUsingIoT = @($deviceId)
        FallbackToLegacy = $true
        LogAllProcessing = $true
    }
} | ConvertTo-Json -Depth 3

try {
    # Update configuration (assuming you have an endpoint for this)
    Invoke-RestMethod -Uri "http://localhost:5000/api/admin/config/migration" `
        -Method Put `
        -ContentType "application/json" `
        -Body $config

    Write-Host "✅ Migration config updated" -ForegroundColor Green

    # Wait for config to take effect
    Start-Sleep -Seconds 2

    # Test message processing
    $ptsMessage = @{
        Protocol = "jsonPTS"
        PtsId = [guid]::NewGuid().ToString()
        Packets = @(
            @{
                Id = 1
                Type = "UploadStatus"
                Data = @{
                    Status = "Online"
                    BatteryLevel = 91
                    SignalStrength = 78
                    PumpStatus = @{
                        Pump1 = "Idle"
                        Pump2 = "Active"
                    }
                }
            }
        )
    } | ConvertTo-Json -Depth 5

    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/pts/message" `
        -Method Post `
        -ContentType "application/json" `
        -Body $ptsMessage `
        -Headers @{ "X-Device-Id" = $deviceId }

    Write-Host "✅ Hybrid processing test completed" -ForegroundColor Green
    Write-Host "Processing method: $($response.ProcessingMethod)" -ForegroundColor Gray

} catch {
    Write-Host "❌ Hybrid processing test failed: $($_.Exception.Message)" -ForegroundColor Red
}
```

### Phase 4: Performance Testing

#### Test 6: Load Testing
```powershell
# test_performance.ps1
param(
    [int]$MessageCount = 100,
    [int]$ConcurrentThreads = 5
)

$deviceId = "TEST_PTS_001"
$results = @()

Write-Host "Starting performance test: $MessageCount messages, $ConcurrentThreads threads" -ForegroundColor Cyan

$scriptBlock = {
    param($deviceId, $messageCount, $threadId)

    $times = @()

    for ($i = 1; $i -le $messageCount; $i++) {
        $startTime = Get-Date

        $ptsMessage = @{
            Protocol = "jsonPTS"
            PtsId = "perf-test-$threadId-$i"
            Packets = @(
                @{
                    Id = 1
                    Type = "UploadStatus"
                    Data = @{
                        Status = "Online"
                        BatteryLevel = (Get-Random -Minimum 70 -Maximum 100)
                        SignalStrength = (Get-Random -Minimum 50 -Maximum 100)
                        MessageNumber = $i
                        ThreadId = $threadId
                    }
                }
            )
        } | ConvertTo-Json -Depth 5

        try {
            $response = Invoke-RestMethod -Uri "http://localhost:5000/api/pts/message" `
                -Method Post `
                -ContentType "application/json" `
                -Body $ptsMessage `
                -Headers @{ "X-Device-Id" = $deviceId }

            $endTime = Get-Date
            $duration = ($endTime - $startTime).TotalMilliseconds
            $times += $duration

        } catch {
            Write-Host "Error in thread $threadId, message $i: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    return @{
        ThreadId = $threadId
        MessageCount = $messageCount
        AverageTime = ($times | Measure-Object -Average).Average
        MinTime = ($times | Measure-Object -Minimum).Minimum
        MaxTime = ($times | Measure-Object -Maximum).Maximum
        TotalTime = ($times | Measure-Object -Sum).Sum
    }
}

# Run concurrent threads
$jobs = @()
for ($t = 1; $t -le $ConcurrentThreads; $t++) {
    $job = Start-Job -ScriptBlock $scriptBlock -ArgumentList $deviceId, ($MessageCount / $ConcurrentThreads), $t
    $jobs += $job
}

# Wait for all jobs to complete
$jobs | Wait-Job | Out-Null

# Collect results
foreach ($job in $jobs) {
    $result = Receive-Job -Job $job
    $results += $result
    Remove-Job -Job $job
}

# Display results
Write-Host "`n📊 Performance Test Results:" -ForegroundColor Yellow
Write-Host "=============================" -ForegroundColor Yellow

$totalMessages = ($results | Measure-Object -Property MessageCount -Sum).Sum
$overallAverage = ($results | Measure-Object -Property AverageTime -Average).Average
$overallMin = ($results | Measure-Object -Property MinTime -Minimum).Minimum
$overallMax = ($results | Measure-Object -Property MaxTime -Maximum).Maximum

Write-Host "Total Messages: $totalMessages"
Write-Host "Average Response Time: $([math]::Round($overallAverage, 2)) ms"
Write-Host "Min Response Time: $([math]::Round($overallMin, 2)) ms"
Write-Host "Max Response Time: $([math]::Round($overallMax, 2)) ms"
Write-Host "Throughput: $([math]::Round($totalMessages / (($results | Measure-Object -Property TotalTime -Sum).Sum / 1000), 2)) messages/second"

foreach ($result in $results) {
    Write-Host "Thread $($result.ThreadId): Avg $([math]::Round($result.AverageTime, 2))ms" -ForegroundColor Gray
}
```

### Phase 5: Data Validation

#### Test 7: Data Consistency Check
```powershell
# test_data_consistency.ps1
$deviceId = "TEST_PTS_001"

Write-Host "Running data consistency validation..." -ForegroundColor Cyan

# Send test message
$testMessage = @{
    Protocol = "jsonPTS"
    PtsId = "consistency-test-$(Get-Date -Format 'yyyyMMddHHmmss')"
    Packets = @(
        @{
            Id = 1
            Type = "UploadStatus"
            Data = @{
                Status = "Online"
                BatteryLevel = 95
                SignalStrength = 85
                TankLevels = @{
                    Tank1 = 75.5
                    Tank2 = 82.3
                }
                PumpTransactions = @(
                    @{
                        PumpId = 1
                        TransactionId = "TXN001"
                        Amount = 25.50
                        FuelType = "Diesel"
                    }
                )
            }
        }
    )
} | ConvertTo-Json -Depth 5

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/pts/message" `
        -Method Post `
        -ContentType "application/json" `
        -Body $testMessage `
        -Headers @{ "X-Device-Id" = $deviceId }

    Write-Host "✅ Test message sent successfully" -ForegroundColor Green

    # Wait for processing
    Start-Sleep -Seconds 3

    # Check data in different storage layers
    Write-Host "`n🔍 Checking data consistency across storage layers..." -ForegroundColor Cyan

    # Check Redis cache (using redis-cli)
    $cacheCheck = redis-cli GET "device:$deviceId:status"
    if ($cacheCheck) {
        Write-Host "✅ Data found in Redis cache" -ForegroundColor Green
    } else {
        Write-Host "❌ Data not found in Redis cache" -ForegroundColor Red
    }

    # Check database (via API endpoint)
    $dbCheck = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/device/$deviceId/status"
    if ($dbCheck) {
        Write-Host "✅ Data found in database" -ForegroundColor Green
    } else {
        Write-Host "❌ Data not found in database" -ForegroundColor Red
    }

    # Check message log
    $logCheck = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/message-log?deviceId=$deviceId&limit=1"
    if ($logCheck -and $logCheck.Count -gt 0) {
        Write-Host "✅ Message logged successfully" -ForegroundColor Green
        Write-Host "Processing method: $($logCheck[0].ProcessingMethod)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Message not logged" -ForegroundColor Red
    }

} catch {
    Write-Host "❌ Data consistency test failed: $($_.Exception.Message)" -ForegroundColor Red
}
```

### Phase 6: Rollback Testing

#### Test 8: Fallback Mechanism
```powershell
# test_fallback.ps1
$deviceId = "TEST_PTS_001"

Write-Host "Testing fallback mechanism..." -ForegroundColor Cyan

# Configure for IoT processing with fallback enabled
$config = @{
    IoTMigration = @{
        EnableIoTProcessing = $true
        DevicesUsingIoT = @($deviceId)
        FallbackToLegacy = $true
        LogAllProcessing = $true
    }
} | ConvertTo-Json -Depth 3

try {
    # Update configuration
    Invoke-RestMethod -Uri "http://localhost:5000/api/admin/config/migration" `
        -Method Put `
        -ContentType "application/json" `
        -Body $config

    Write-Host "✅ Fallback configuration set" -ForegroundColor Green

    # Send a message that might cause IoT processing to fail
    $problematicMessage = @{
        Protocol = "jsonPTS"
        PtsId = "fallback-test"
        Packets = @(
            @{
                Id = 1
                Type = "InvalidType"  # This should cause IoT processing to fail
                Data = @{
                    InvalidData = "This should trigger fallback"
                }
            }
        )
    } | ConvertTo-Json -Depth 5

    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/pts/message" `
        -Method Post `
        -ContentType "application/json" `
        -Body $problematicMessage `
        -Headers @{ "X-Device-Id" = $deviceId }

    if ($response.ProcessingMethod -eq "Legacy") {
        Write-Host "✅ Fallback mechanism working correctly" -ForegroundColor Green
    } else {
        Write-Host "❌ Fallback mechanism failed" -ForegroundColor Red
    }

} catch {
    Write-Host "❌ Fallback test failed: $($_.Exception.Message)" -ForegroundColor Red
}
```

## 🎯 Complete Test Suite

```powershell
# run_all_tests.ps1
Write-Host "🧪 Starting PTS-IoT Migration Test Suite" -ForegroundColor Magenta
Write-Host "=======================================" -ForegroundColor Magenta

$testScripts = @(
    "test_existing_pts.ps1",
    "test_redis_connectivity.ps1",
    "test_protocol_handler.ps1",
    "test_data_integration.ps1",
    "test_hybrid_processing.ps1",
    "test_data_consistency.ps1",
    "test_fallback.ps1"
)

$results = @{}

foreach ($script in $testScripts) {
    Write-Host "`n🔧 Running $script..." -ForegroundColor Yellow
    try {
        & ".\$script"
        $results[$script] = "PASS"
    } catch {
        Write-Host "❌ $script FAILED: $($_.Exception.Message)" -ForegroundColor Red
        $results[$script] = "FAIL"
    }
}

# Performance test (optional, takes longer)
$runPerformanceTest = Read-Host "`nRun performance test? (y/N)"
if ($runPerformanceTest -eq "y" -or $runPerformanceTest -eq "Y") {
    Write-Host "`n🚀 Running performance test..." -ForegroundColor Yellow
    try {
        & ".\test_performance.ps1" -MessageCount 50 -ConcurrentThreads 3
        $results["test_performance.ps1"] = "PASS"
    } catch {
        Write-Host "❌ Performance test FAILED: $($_.Exception.Message)" -ForegroundColor Red
        $results["test_performance.ps1"] = "FAIL"
    }
}

# Summary
Write-Host "`n📋 Test Results Summary:" -ForegroundColor Magenta
Write-Host "========================" -ForegroundColor Magenta

$passCount = 0
$totalCount = $results.Count

foreach ($test in $results.GetEnumerator()) {
    $color = if ($test.Value -eq "PASS") { "Green"; $passCount++ } else { "Red" }
    Write-Host "$($test.Key): $($test.Value)" -ForegroundColor $color
}

Write-Host "`nOverall: $passCount/$totalCount tests passed" -ForegroundColor $(if ($passCount -eq $totalCount) { "Green" } else { "Yellow" })

if ($passCount -eq $totalCount) {
    Write-Host "✅ All tests passed! Ready for production migration." -ForegroundColor Green
} else {
    Write-Host "⚠️  Some tests failed. Please review and fix issues before proceeding." -ForegroundColor Yellow
}
```

## 📝 Test Checklist

### Pre-Migration ✅
- [ ] Existing PTS system operational
- [ ] Redis connectivity verified
- [ ] Database migrations applied
- [ ] Configuration files updated
- [ ] Test devices identified

### IoT Components ✅
- [ ] Protocol handler converts messages correctly
- [ ] Data integration service caches properly
- [ ] Message transformation preserves data integrity
- [ ] Error handling works as expected

### Migration Process ✅
- [ ] Hybrid processing routes correctly
- [ ] Fallback mechanism activates when needed
- [ ] Configuration changes take effect immediately
- [ ] Device-specific routing works

### Data Validation ✅
- [ ] Data appears in all storage layers
- [ ] Cache TTL settings working
- [ ] Database records created correctly
- [ ] Message logging captures processing method

### Performance ✅
- [ ] Response times acceptable under load
- [ ] Concurrent processing handles multiple devices
- [ ] Memory usage remains stable
- [ ] No data loss during high throughput

### Rollback ✅
- [ ] Immediate rollback to legacy processing
- [ ] No data corruption during rollback
- [ ] All devices continue functioning
- [ ] Monitoring shows system health

This comprehensive testing approach ensures your migration is safe, reliable, and maintains data integrity throughout the process.
