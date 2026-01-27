-- ===================================================================
-- GPSGate RabbitMQ Configuration Update
-- Generated: January 27, 2026
-- ===================================================================
-- This script updates the GPSGate provider configuration to include
-- RabbitMQ settings for real-time vehicle tracking integration
-- ===================================================================
--
-- Table: provider_configurations
-- Settings column: `settings` (LONGTEXT - no JSON functions available)
-- Name column: `name`
-- ===================================================================

-- ===================================================================
-- STEP 1: Check current GPSGate configuration
-- ===================================================================
SELECT
    id,
    name,
    display_name,
    is_enabled,
    settings as current_settings
FROM provider_configurations
WHERE name = 'GPSGate';

-- ===================================================================
-- STEP 2: Check if GPSGate provider exists, if not create it
-- ===================================================================
INSERT INTO provider_configurations (name, display_name, description, is_enabled, is_default, version, settings, priority, created_at, updated_at)
SELECT 'GPSGate', 'GPSGate Integration', 'GPSGate vehicle tracking integration with RabbitMQ', 1, 0, '1.0.0', '{}', 100, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM provider_configurations WHERE name = 'GPSGate');

SELECT '✅ Step 2: GPSGate provider exists or created' AS Progress;

-- ===================================================================
-- STEP 3: Update GPSGate configuration with RabbitMQ settings
-- ===================================================================
-- Since JSON functions are not available, we set the complete settings JSON
-- If you have existing settings you need to preserve, first run STEP 1 to see them,
-- then manually merge them into the JSON below before running this UPDATE

UPDATE provider_configurations
SET settings = '{
  "RabbitMQ": {
    "Host": "10.0.10.154",
    "Port": 5672,
    "VirtualHost": "/",
    "Username": "kkagiri",
    "Password": "Niwewe1000",
    "ExchangeName": "gpsgate",
    "QueueName": "fms-vehicle-tracking",
    "RoutingKeys": ["#"],
    "Enabled": true,
    "UseSsl": false,
    "SslServerName": "",
    "PrefetchCount": 10,
    "ReconnectDelaySeconds": 5,
    "SerializationType": "JSON"
  }
}',
updated_at = NOW()
WHERE name = 'GPSGate';

SELECT '✅ Step 3: GPSGate configuration updated with RabbitMQ settings' AS Progress;

-- ===================================================================
-- STEP 4: Verify the updated configuration
-- ===================================================================
SELECT
    id,
    name,
    display_name,
    is_enabled,
    settings as updated_settings
FROM provider_configurations
WHERE name = 'GPSGate';

-- ===================================================================
-- CONFIGURATION REFERENCE
-- ===================================================================
--
-- RabbitMQ Configuration Fields:
--
-- Host                   : RabbitMQ server hostname or IP (10.0.10.150)
-- Port                   : AMQP port (default: 5672, SSL: 5671)
-- VirtualHost            : RabbitMQ virtual host (default: /)
-- Username               : RabbitMQ authentication username (kkagiri)
-- Password               : RabbitMQ authentication password
-- ExchangeName           : Exchange name from GPSGate RabbitMQ plugin config
-- QueueName              : Queue name for FMS to consume
-- RoutingKeys            : Array of routing keys to bind to:
--                          - "#" : All messages
--                          - "Tracks.#" : All track messages
--                          - "Events.#" : All event messages
-- Enabled                : true/false - Enable RabbitMQ integration
-- UseSsl                 : true/false - Use SSL/TLS connection
-- PrefetchCount          : Number of messages to prefetch (performance tuning)
-- ReconnectDelaySeconds  : Seconds to wait before reconnection attempt
-- SerializationType      : "JSON" or "Protobuf" - Must match GPSGate setting
--
-- ===================================================================
-- GPSGate RabbitMQ Plugin Setup (in GPSGate):
--
-- 1. Site Admin (Legacy) > Plugins > Get More Plugins > Install RabbitMQ
-- 2. Integrations > RabbitMQ > Add
-- 3. Configure:
--    - Host: 10.0.10.150
--    - Port: 5672
--    - Virtual Host: /
--    - User/Password: kkagiri / Niwewe1000
--    - Exchange: gpsgate (topic exchange)
--    - Routing Key: # (all messages)
--    - Serializer: JSON
-- 4. Test connection
-- 5. Manage Applications > Enable RabbitMQ
-- 6. Assign _RabbitMQ privilege to users/roles
-- ===================================================================
