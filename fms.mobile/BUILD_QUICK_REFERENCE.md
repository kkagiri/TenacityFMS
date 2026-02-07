# Build Script Quick Reference

## Problem Solved
If you cancel a build after version increment, the version is already bumped but no APK was created. This guide shows how to rebuild without incrementing again.

## Build Commands

### 1. Normal Build (Increment + Build)
```powershell
.\build-release.ps1                    # Increments patch version (1.2.8 → 1.2.9)
.\build-release.ps1 -IncrementType minor  # Increments minor version (1.2.8 → 1.3.0)
.\build-release.ps1 -IncrementType major  # Increments major version (1.2.8 → 2.0.0)
```

### 2. Build WITHOUT Incrementing (Use After Cancel)
```powershell
.\build-release.ps1 -SkipVersionIncrement
```

## Typical Workflow

### Scenario 1: Successful Build
```
Step 1: Version incremented (1.2.8 → 1.2.9)
Step 2: Build completes successfully ✅
Result: APK created with version 1.2.9
```

### Scenario 2: Cancelled Build (Your Issue)
```
Step 1: Version incremented (1.2.8 → 1.2.9) ✅
Step 2: Build started...
You press Ctrl+C or Y to cancel ❌
Result: No APK, but version is now 1.2.9

FIX: Run this command:
.\build-release.ps1 -SkipVersionIncrement
```

## What Changed in the Script

1. **Added usage documentation** at the top of the script
2. **Better error handling** - Shows helpful message when build fails/cancels
3. **Automatic tip display** - When build fails, reminds you about `-SkipVersionIncrement`
4. **Proper exit codes** - Script returns error code on failure

## Files Updated by Version Increment

When version is incremented, these files are updated:
- `version.json`
- `package.json`
- `android/app/build.gradle`
- `src/config/appVersion.js`

## Tips

- ✅ **DO** use `-SkipVersionIncrement` if you cancelled a build
- ✅ **DO** use `-SkipVersionIncrement` if you need to rebuild the same version
- ❌ **DON'T** manually edit version files (use the scripts)
- ❌ **DON'T** increment version multiple times without building

## Quick Recovery from Mistakes

### If you accidentally incremented twice:
1. Check current version: `cat version.json`
2. Manually edit `version.json` to correct version
3. Run: `.\scripts\sync-version.ps1` (if exists)
4. Build: `.\build-release.ps1 -SkipVersionIncrement`

### If you want to check current version without building:
```powershell
Get-Content version.json | ConvertFrom-Json
```
