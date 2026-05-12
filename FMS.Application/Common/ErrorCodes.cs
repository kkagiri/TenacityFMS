using System;

namespace FMS.Application.Common {
    /// <summary>
    /// Centralized error code constants for FMS API
    /// Format: {DOMAIN}_{ACTION}_{REASON}
    /// </summary>
    public static class ErrorCodes {
        // ========== Authentication & Authorization ==========
        public const string AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED";
        public const string AUTH_TOKEN_INVALID = "AUTH_TOKEN_INVALID";
        public const string AUTH_UNAUTHORIZED = "AUTH_UNAUTHORIZED";
        public const string AUTH_PERMISSION_DENIED = "AUTH_PERMISSION_DENIED";
        public const string AUTH_CREDENTIALS_INVALID = "AUTH_CREDENTIALS_INVALID";
        public const string AUTH_USER_LOCKED = "AUTH_USER_LOCKED";
        public const string AUTH_USER_NOT_FOUND = "AUTH_USER_NOT_FOUND";

        // ========== Validation ==========
        public const string VALIDATION_FAILED = "VALIDATION_FAILED";
        public const string VALIDATION_REQUIRED_FIELD = "VALIDATION_REQUIRED_FIELD";
        public const string VALIDATION_INVALID_FORMAT = "VALIDATION_INVALID_FORMAT";
        public const string VALIDATION_OUT_OF_RANGE = "VALIDATION_OUT_OF_RANGE";
        public const string VALIDATION_DUPLICATE_ENTRY = "VALIDATION_DUPLICATE_ENTRY";

        // ========== Tank Management ==========
        public const string TANK_NOT_FOUND = "TANK_NOT_FOUND";
        public const string TANK_CREATE_FAILED = "TANK_CREATE_FAILED";
        public const string TANK_UPDATE_FAILED = "TANK_UPDATE_FAILED";
        public const string TANK_DELETE_FAILED = "TANK_DELETE_FAILED";
        public const string TANK_CAPACITY_INVALID = "TANK_CAPACITY_INVALID";
        public const string TANK_VOLUME_INVALID = "TANK_VOLUME_INVALID";
        public const string TANK_ALREADY_EXISTS = "TANK_ALREADY_EXISTS";
        public const string TANK_IN_USE = "TANK_IN_USE";
        public const string TANK_VOLUME_BELOW_MIN = "TANK_VOLUME_BELOW_MIN";
        public const string TANK_VOLUME_ABOVE_MAX = "TANK_VOLUME_ABOVE_MAX";

        // ========== Tank Stock ==========
        public const string TANK_STOCK_NOT_FOUND = "TANK_STOCK_NOT_FOUND";
        public const string TANK_STOCK_CREATE_FAILED = "TANK_STOCK_CREATE_FAILED";
        public const string TANK_STOCK_UPDATE_FAILED = "TANK_STOCK_UPDATE_FAILED";
        public const string TANK_STOCK_INSUFFICIENT = "TANK_STOCK_INSUFFICIENT";
        public const string TANK_STOCK_OVERFILL = "TANK_STOCK_OVERFILL";

        // ========== Fueling/Transactions ==========
        public const string FUELING_NOT_FOUND = "FUELING_NOT_FOUND";
        public const string FUELING_CREATE_FAILED = "FUELING_CREATE_FAILED";
        public const string FUELING_UPDATE_FAILED = "FUELING_UPDATE_FAILED";
        public const string FUELING_TRANSACTION_DUPLICATE = "FUELING_TRANSACTION_DUPLICATE";
        public const string FUELING_INVALID_AMOUNT = "FUELING_INVALID_AMOUNT";
        public const string FUELING_INSUFFICIENT_STOCK = "FUELING_INSUFFICIENT_STOCK";
        public const string FUELING_AUTHORIZATION_FAILED = "FUELING_AUTHORIZATION_FAILED";
        public const string FUELING_PUMP_ERROR = "FUELING_PUMP_ERROR";

        // ========== Vehicle Management ==========
        public const string VEHICLE_NOT_FOUND = "VEHICLE_NOT_FOUND";
        public const string VEHICLE_CREATE_FAILED = "VEHICLE_CREATE_FAILED";
        public const string VEHICLE_UPDATE_FAILED = "VEHICLE_UPDATE_FAILED";
        public const string VEHICLE_DELETE_FAILED = "VEHICLE_DELETE_FAILED";
        public const string VEHICLE_ALREADY_EXISTS = "VEHICLE_ALREADY_EXISTS";
        public const string VEHICLE_IN_USE = "VEHICLE_IN_USE";
        public const string VEHICLE_REGISTRATION_INVALID = "VEHICLE_REGISTRATION_INVALID";
        public const string VEHICLE_FUEL_TYPE_MISMATCH = "VEHICLE_FUEL_TYPE_MISMATCH";

        // ========== Device/PTS ==========
        public const string DEVICE_NOT_FOUND = "DEVICE_NOT_FOUND";
        public const string DEVICE_CONNECTION_FAILED = "DEVICE_CONNECTION_FAILED";
        public const string DEVICE_CONNECTION_TIMEOUT = "DEVICE_CONNECTION_TIMEOUT";
        public const string DEVICE_COMMUNICATION_ERROR = "DEVICE_COMMUNICATION_ERROR";
        public const string DEVICE_OFFLINE = "DEVICE_OFFLINE";
        public const string DEVICE_NOT_RESPONDING = "DEVICE_NOT_RESPONDING";
        public const string DEVICE_CONFIGURATION_ERROR = "DEVICE_CONFIGURATION_ERROR";
        public const string DEVICE_FIRMWARE_ERROR = "DEVICE_FIRMWARE_ERROR";

        // ========== Pump Control ==========
        public const string PUMP_NOT_FOUND = "PUMP_NOT_FOUND";
        public const string PUMP_CONTROL_FAILED = "PUMP_CONTROL_FAILED";
        public const string PUMP_ALREADY_IN_USE = "PUMP_ALREADY_IN_USE";
        public const string PUMP_NOT_AUTHORIZED = "PUMP_NOT_AUTHORIZED";
        public const string PUMP_MALFUNCTION = "PUMP_MALFUNCTION";
        public const string PUMP_EMERGENCY_STOP = "PUMP_EMERGENCY_STOP";

        // ========== Delivery Management ==========
        public const string DELIVERY_NOT_FOUND = "DELIVERY_NOT_FOUND";
        public const string DELIVERY_CREATE_FAILED = "DELIVERY_CREATE_FAILED";
        public const string DELIVERY_UPDATE_FAILED = "DELIVERY_UPDATE_FAILED";
        public const string DELIVERY_DUPLICATE = "DELIVERY_DUPLICATE";
        public const string DELIVERY_INVALID_DATE = "DELIVERY_INVALID_DATE";
        public const string DELIVERY_QUANTITY_MISMATCH = "DELIVERY_QUANTITY_MISMATCH";

        // ========== Reconciliation ==========
        public const string RECONCILIATION_NOT_FOUND = "RECONCILIATION_NOT_FOUND";
        public const string RECONCILIATION_CREATE_FAILED = "RECONCILIATION_CREATE_FAILED";
        public const string RECONCILIATION_UPDATE_FAILED = "RECONCILIATION_UPDATE_FAILED";
        public const string RECONCILIATION_ALREADY_EXISTS = "RECONCILIATION_ALREADY_EXISTS";
        public const string RECONCILIATION_VARIANCE_EXCEEDED = "RECONCILIATION_VARIANCE_EXCEEDED";
        public const string RECONCILIATION_CALCULATION_ERROR = "RECONCILIATION_CALCULATION_ERROR";

        // ========== User Management ==========
        public const string USER_NOT_FOUND = "USER_NOT_FOUND";
        public const string USER_CREATE_FAILED = "USER_CREATE_FAILED";
        public const string USER_UPDATE_FAILED = "USER_UPDATE_FAILED";
        public const string USER_DELETE_FAILED = "USER_DELETE_FAILED";
        public const string USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS";
        public const string USER_EMAIL_INVALID = "USER_EMAIL_INVALID";
        public const string USER_EMAIL_ALREADY_TAKEN = "USER_EMAIL_ALREADY_TAKEN";
        public const string USER_PASSWORD_INVALID = "USER_PASSWORD_INVALID";

        // ========== Role Management ==========
        public const string ROLE_NOT_FOUND = "ROLE_NOT_FOUND";
        public const string ROLE_CREATE_FAILED = "ROLE_CREATE_FAILED";
        public const string ROLE_UPDATE_FAILED = "ROLE_UPDATE_FAILED";
        public const string ROLE_DELETE_FAILED = "ROLE_DELETE_FAILED";
        public const string ROLE_ALREADY_EXISTS = "ROLE_ALREADY_EXISTS";
        public const string ROLE_IN_USE = "ROLE_IN_USE";

        // ========== Site Management ==========
        public const string SITE_NOT_FOUND = "SITE_NOT_FOUND";
        public const string SITE_CREATE_FAILED = "SITE_CREATE_FAILED";
        public const string SITE_UPDATE_FAILED = "SITE_UPDATE_FAILED";
        public const string SITE_DELETE_FAILED = "SITE_DELETE_FAILED";
        public const string SITE_ACCESS_DENIED = "SITE_ACCESS_DENIED";

        // ========== Task Management ==========
        public const string TASK_NOT_FOUND = "TASK_NOT_FOUND";
        public const string TASK_CREATE_FAILED = "TASK_CREATE_FAILED";
        public const string TASK_UPDATE_FAILED = "TASK_UPDATE_FAILED";
        public const string TASK_DELETE_FAILED = "TASK_DELETE_FAILED";
        public const string TASK_INVALID_STATUS = "TASK_INVALID_STATUS";
        public const string TASK_ASSIGNMENT_FAILED = "TASK_ASSIGNMENT_FAILED";

        // ========== Notification Management ==========
        public const string NOTIFICATION_NOT_FOUND = "NOTIFICATION_NOT_FOUND";
        public const string NOTIFICATION_SEND_FAILED = "NOTIFICATION_SEND_FAILED";
        public const string NOTIFICATION_INVALID_RECIPIENT = "NOTIFICATION_INVALID_RECIPIENT";

        // ========== Report Generation ==========
        public const string REPORT_GENERATION_FAILED = "REPORT_GENERATION_FAILED";
        public const string REPORT_INVALID_PARAMETERS = "REPORT_INVALID_PARAMETERS";
        public const string REPORT_NO_DATA = "REPORT_NO_DATA";
        public const string REPORT_EXPORT_FAILED = "REPORT_EXPORT_FAILED";

        // ========== System Errors ==========
        public const string SYSTEM_ERROR = "SYSTEM_ERROR";
        public const string SYSTEM_DATABASE_ERROR = "SYSTEM_DATABASE_ERROR";
        public const string SYSTEM_CONFIGURATION_ERROR = "SYSTEM_CONFIGURATION_ERROR";
        public const string SYSTEM_SERVICE_UNAVAILABLE = "SYSTEM_SERVICE_UNAVAILABLE";

        // ========== Network Errors ==========
        public const string NETWORK_ERROR = "NETWORK_ERROR";
        public const string NETWORK_TIMEOUT = "NETWORK_TIMEOUT";
        public const string NETWORK_CONNECTION_LOST = "NETWORK_CONNECTION_LOST";
        public const string NETWORK_HOST_UNREACHABLE = "NETWORK_HOST_UNREACHABLE";

        // ========== Business Logic ==========
        public const string BUSINESS_RULE_VIOLATION = "BUSINESS_RULE_VIOLATION";
        public const string BUSINESS_OPERATION_NOT_ALLOWED = "BUSINESS_OPERATION_NOT_ALLOWED";
        public const string BUSINESS_STATE_INVALID = "BUSINESS_STATE_INVALID";
        public const string BUSINESS_CONSTRAINT_VIOLATION = "BUSINESS_CONSTRAINT_VIOLATION";

        // ========== Data Integrity ==========
        public const string DATA_INTEGRITY_VIOLATION = "DATA_INTEGRITY_VIOLATION";
        public const string DATA_CONSTRAINT_VIOLATION = "DATA_CONSTRAINT_VIOLATION";
        public const string DATA_FOREIGN_KEY_VIOLATION = "DATA_FOREIGN_KEY_VIOLATION";
        public const string DATA_CONCURRENCY_ERROR = "DATA_CONCURRENCY_ERROR";

        // ========== Helper Methods ==========

        /// <summary>
        /// Gets a user-friendly message for an error code
        /// </summary>
        public static string GetFriendlyMessage (string errorCode) {
            return errorCode switch {
                // Authentication & Authorization
                AUTH_TOKEN_EXPIRED => "Your session has expired. Please log in again.",
                AUTH_TOKEN_INVALID => "Invalid authentication token.",
                AUTH_UNAUTHORIZED => "You are not authorized to access this resource.",
                AUTH_PERMISSION_DENIED => "You do not have permission to perform this action.",
                AUTH_CREDENTIALS_INVALID => "Invalid username or password.",
                AUTH_USER_LOCKED => "Your account has been locked. Please contact support.",

                // Tank Management
                TANK_NOT_FOUND => "The specified tank was not found.",
                TANK_CAPACITY_INVALID => "Invalid tank capacity specified.",
                TANK_VOLUME_BELOW_MIN => "Tank volume is below minimum threshold.",
                TANK_VOLUME_ABOVE_MAX => "Tank volume exceeds maximum capacity.",
                TANK_IN_USE => "Cannot delete tank as it is currently in use.",

                // Fueling
                FUELING_INSUFFICIENT_STOCK => "Insufficient fuel stock available.",
                FUELING_TRANSACTION_DUPLICATE => "This fueling transaction already exists.",
                FUELING_PUMP_ERROR => "Pump control error occurred.",

                // Device
                DEVICE_CONNECTION_TIMEOUT => "Device connection timed out.",
                DEVICE_OFFLINE => "Device is currently offline.",
                DEVICE_NOT_RESPONDING => "Device is not responding.",

                // System
                SYSTEM_ERROR => "An unexpected system error occurred.",
                SYSTEM_DATABASE_ERROR => "A database error occurred.",
                SYSTEM_SERVICE_UNAVAILABLE => "The service is temporarily unavailable.",

                // Default
                _ => "An error occurred while processing your request."
            };
        }

        /// <summary>
        /// Checks if an error code is a client error (4xx)
        /// </summary>
        public static bool IsClientError (string errorCode) {
            return errorCode?.StartsWith ("VALIDATION_") == true ||
                errorCode?.StartsWith ("AUTH_") == true ||
                errorCode?.Contains ("_NOT_FOUND") == true ||
                errorCode?.Contains ("_INVALID") == true ||
                errorCode?.Contains ("_DUPLICATE") == true;
        }

        /// <summary>
        /// Checks if an error code is a server error (5xx)
        /// </summary>
        public static bool IsServerError (string errorCode) {
            return errorCode?.StartsWith ("SYSTEM_") == true ||
                errorCode?.StartsWith ("NETWORK_") == true ||
                errorCode?.StartsWith ("DEVICE_") == true;
        }
    }
}
