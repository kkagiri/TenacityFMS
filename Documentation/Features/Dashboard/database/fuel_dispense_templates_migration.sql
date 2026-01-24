-- ================================================================
-- Dashboard Widget Templates - Fuel Dispense Today Migration
-- Date: 2025-01-XX
-- Description: Add Fuel Dispense Today and related fuel management templates
-- ================================================================

USE `gpsdata`;

-- Insert Fuel Dispense Today template (BIG_STAT_CARD)
INSERT INTO `dashboard_widget_templates` (
    `WidgetType`,
    `Name`,
    `DisplayName`,
    `Description`,
    `Category`,
    `DataSource`,
    `ConfigurationJson`,
    `RequiredRole`,
    `RequiredPermissions`,
    `IsEnabled`,
    `CreatedAt`,
    `UpdatedAt`
) VALUES (
    'BIG_STAT_CARD',
    'fuel_dispense_today',
    'Fuel Dispense Today',
    'Shows total fuel dispensed today from pumps or manual refill',
    'fuel_management',
    'fuel_dispensed',
    '{"defaultMode":"daily_aggregated","defaultDatePreset":"today","aggregation":"sum","unit":"liters","showTrend":true,"showComparison":true,"defaultSettings":{"mode":"daily_aggregated","datePreset":"today","aggregation":"sum","granularity":"hour","unit":"liters","dataSource":"fuel_dispensed"}}',
    'User,Manager,Admin',
    'dashboard.view,fuel.view',
    1,
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE
    `DisplayName` = VALUES(`DisplayName`),
    `Description` = VALUES(`Description`),
    `ConfigurationJson` = VALUES(`ConfigurationJson`),
    `UpdatedAt` = NOW();

-- Insert Fuel Dispense Trend Chart template (CHART_LINE_TREND)
INSERT INTO `dashboard_widget_templates` (
    `WidgetType`,
    `Name`,
    `DisplayName`,
    `Description`,
    `Category`,
    `DataSource`,
    `ConfigurationJson`,
    `RequiredRole`,
    `RequiredPermissions`,
    `IsEnabled`,
    `CreatedAt`,
    `UpdatedAt`
) VALUES (
    'CHART_LINE_TREND',
    'fuel_dispense_trend_chart',
    'Fuel Dispense Trend',
    'Line chart showing fuel dispensed trend over time',
    'fuel_management',
    'fuel_dispensed',
    '{"chartType":"line","defaultMode":"daily_aggregated","defaultDatePreset":"last_7_days","aggregation":"sum","granularity":"day","unit":"liters","showDataPoints":true,"defaultSettings":{"mode":"daily_aggregated","datePreset":"last_7_days","aggregation":"sum","granularity":"day","unit":"liters","dataSource":"fuel_dispensed"}}',
    'User,Manager,Admin',
    'dashboard.view,fuel.view',
    1,
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE
    `DisplayName` = VALUES(`DisplayName`),
    `Description` = VALUES(`Description`),
    `ConfigurationJson` = VALUES(`ConfigurationJson`),
    `UpdatedAt` = NOW();

-- Insert Fuel Dispense by Site template (CHART_BAR_COMPARISON)
INSERT INTO `dashboard_widget_templates` (
    `WidgetType`,
    `Name`,
    `DisplayName`,
    `Description`,
    `Category`,
    `DataSource`,
    `ConfigurationJson`,
    `RequiredRole`,
    `RequiredPermissions`,
    `IsEnabled`,
    `CreatedAt`,
    `UpdatedAt`
) VALUES (
    'CHART_BAR_COMPARISON',
    'fuel_dispense_by_site',
    'Fuel Dispense by Site',
    'Bar chart comparing fuel dispensed across sites',
    'fuel_management',
    'fuel_dispensed',
    '{"chartType":"bar","defaultMode":"daily_aggregated","defaultDatePreset":"last_7_days","aggregation":"sum","groupBy":"site","unit":"liters","defaultSettings":{"mode":"daily_aggregated","datePreset":"last_7_days","aggregation":"sum","groupBy":"site","unit":"liters","dataSource":"fuel_dispensed"}}',
    'User,Manager,Admin',
    'dashboard.view,fuel.view',
    1,
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE
    `DisplayName` = VALUES(`DisplayName`),
    `Description` = VALUES(`Description`),
    `ConfigurationJson` = VALUES(`ConfigurationJson`),
    `UpdatedAt` = NOW();

-- ================================================================
-- Verification Query
-- ================================================================
SELECT
    `Id`,
    `Name`,
    `DisplayName`,
    `Category`,
    `WidgetType`,
    `DataSource`,
    `IsEnabled`
FROM `dashboard_widget_templates`
WHERE `Category` = 'fuel_management'
ORDER BY `Name`;
