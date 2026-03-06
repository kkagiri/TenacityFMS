# Site Details Filtering System

## Overview
The Site Details Filtering System provides comprehensive filtering capabilities for sites in the Tank Stock Dashboard, allowing users to filter sites based on their operational status, issue severity, and tank health metrics.

## Features

### 1. Site Filter Categories

#### Sites with Issues
- **Purpose**: Shows sites that have at least one tank with any type of issue
- **Criteria**: Sites containing tanks with negative stock, over capacity, low stock, or inactive status
- **Visual Indicator**: Orange badge with issue count
- **Use Case**: Quick identification of sites requiring attention

#### Critical Sites
- **Purpose**: Shows sites with critical severity issues requiring immediate attention
- **Criteria**: Sites with tanks having negative stock or over capacity issues
- **Visual Indicator**: Red badge and red border highlighting
- **Use Case**: Emergency response and urgent maintenance prioritization

#### Warning Sites
- **Purpose**: Shows sites with moderate issues that need monitoring
- **Criteria**: Sites with low stock alerts or other non-critical issues
- **Visual Indicator**: Yellow badge and yellow border highlighting
- **Use Case**: Preventive maintenance and stock monitoring

#### Healthy Sites
- **Purpose**: Shows sites with no detected issues
- **Criteria**: All tanks within normal operational parameters
- **Visual Indicator**: Green badge and green border highlighting
- **Use Case**: Confirming system stability and identifying optimal sites

#### Sites with Tanks
- **Purpose**: Shows only sites that contain tanks
- **Criteria**: Sites that have at least one tank configured
- **Visual Indicator**: Indigo badge with tank count
- **Use Case**: Filtering out empty sites or administrative locations without physical tanks

#### All Sites
- **Purpose**: Shows all sites regardless of status
- **Criteria**: No filtering applied
- **Visual Indicator**: Blue badge with total count
- **Use Case**: Complete overview of all operations

### 2. Interactive Site Cards

#### Site Information Display
- **Site Name**: Primary identifier for each site
- **Tank Count**: Total number of tanks at the site
- **Fill Rate**: Overall capacity utilization percentage
- **Stock Level**: Total fuel stock in liters
- **System Status Indicator**: Color-coded status (green/yellow/red)

#### Issue Indicators
- **Negative Stock Icon**: Red minus icon for tanks below zero
- **Over Capacity Icon**: Red exclamation for tanks exceeding limits
- **Low Stock Icon**: Yellow warning for tanks below threshold
- **Inactive Icon**: Gray pause icon for non-operational tanks

#### Site Actions Menu Integration
- **Meatball Menu**: Three-dot menu for site-specific actions
- **Actions Available**:
  - Opening Stock
  - Closing Stock
  - Transfer
  - Delivery
  - Manual Refill
  - Stock Reconciliation

### 3. Filter Panel Controls

#### Expandable Interface
- **Collapsed State**: Shows active filter count and filtered site count
- **Expanded State**: Full filter controls with descriptions and counts
- **Toggle Mechanism**: Click header to expand/collapse

#### Quick Action Buttons
- **Show All Sites**: Resets all filters to display all sites
- **Sites with Tanks**: Shows only sites that contain tanks
- **Issues Only**: Applies filter to show only sites with critical or warning issues

#### Dynamic Filter Counts
- **Real-time Updates**: Filter badges show current counts for each category
- **Context Awareness**: Counts update based on current tank data and anomaly detection

## Recovery Instructions

If files are accidentally deleted by `git clean -fd`, here's how to recover:

### 1. Check What Was Deleted
```powershell
# The git clean command removes untracked files
# Check what files are missing
git status
```

### 2. Recover from Stash (if available)
```powershell
# Check if there are any stashes
git stash list

# Recover from stash if available
git stash apply stash@{0}
```

### 3. Recover from Previous Commits
```powershell
# Check recent commits
git log --oneline -10

# Recover specific files from previous commits
git checkout HEAD~1 -- "path/to/file"
```

### 4. Recreate Missing Components
If files were never committed, they need to be recreated:

- **SiteDetailsWithFilter.js**: Main filtering component
- **SiteActionsMenu.js**: Site actions popup menu
- **SiteActionsMenu.scss**: Styles for actions menu
- **Documentation files**: Project documentation

### 5. Prevention
To prevent future data loss:

```powershell
# Always commit important changes before cleaning
git add .
git commit -m "Save work in progress"

# Use safer clean commands
git clean -n  # Preview what will be deleted
git clean -i  # Interactive mode
```

## Technical Implementation

### Component Structure
```
SiteDetailsWithFilter.js
├── Filter State Management
├── Site Metrics Calculation
├── Filter Application Logic
├── Site Card Rendering
└── Actions Menu Integration
```

### Key Dependencies
- **tankIssueMetrics.js**: Issue calculation utilities (may need recreation)
- **SiteActionsMenu.js**: Site-specific action handling (recreated)
- **DevExtreme Components**: CheckBox, Button for filter controls
- **PropTypes**: Type checking for component props

### State Management
```javascript
const [filters, setFilters] = useState({
  sitesWithIssues: false,
  criticalSites: false,
  warningSites: false,
  healthySites: false,
  sitesWithTanks: false,
  allSites: true
});
```

This documentation serves as both a feature guide and recovery instructions for the Site Details Filtering System.
