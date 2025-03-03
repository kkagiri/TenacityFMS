using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Application.Infrastructure.ErrorCodes.Common
{
    public enum PtsErrorCode
    {
        [Description("No error")]
        NO_ERROR = 0,
        [Description("Request not found")]
        JSONPTS_ERROR_NOT_FOUND = 1,
        [Description("Invalid JSON request")]
        INVALID_JSON_REQUEST = 2,
        [Description("No data")]
        NO_DATA = 3,
        [Description("No data for response")]
        NO_DATA_FOR_RESPONSE = 4,
        [Description("JSON request is too long")]
        JSON_REQUEST_IS_TOO_LONG = 5,
        [Description("Access forbidden")]
        JSONPTS_ERROR_NO_PERMISSIONS = 6,
        [Description("No SD found")]
        JSONPTS_ERROR_NO_SD_FOUND = 7,
        [Description("Power down detected")]
        JSONPTS_ERROR_POWER_DOWN_DETECTED = 8,
        [Description("SD is not mounted")]
        JSONPTS_ERROR_SD_NOT_MOUNTED = 9,
        [Description("File upload process running")]
        JSONPTS_ERROR_FILE_UPLOAD_PROCESS_RUNNING = 10,
        [Description("SD error")]
        JSONPTS_ERROR_SD_ERROR = 11,
        [Description("No calibration chart found")]
        JSONPTS_ERROR_NO_CALIBRATION_CHART_FOUND_ERROR = 12,
        [Description("Could not check file")]
        JSONPTS_ERROR_COULD_NOT_CHECK_FILE = 13,
        [Description("Could not delete file")]
        JSONPTS_ERROR_COULD_NOT_DELETE_FILE = 14,
        [Description("Incorrect pumps configuration")]
        JSONPTS_ERROR_INCORRECT_PUMPS_CONFIGURATION = 15,
        [Description("Incorrect probes configuration")]
        JSONPTS_ERROR_INCORRECT_PROBES_CONFIGURATION = 16,
        [Description("Could not get datetime")]
        JSONPTS_ERROR_COULD_NOT_GET_DATETIME = 17,
        [Description("Could not get pump number")]
        JSONPTS_ERROR_COULD_NOT_GET_PUMP_NUMBER = 18,
        [Description("Could not get pump transaction number")]
        JSONPTS_ERROR_COULD_NOT_GET_PUMP_TRANSACTION_NUMBER = 19,
        [Description("Pump number is out of range")]
        JSONPTS_ERROR_PUMP_NUMBER_OUT_OF_RANGE = 20,
        [Description("Pump transaction number is out of range")]
        JSONPTS_ERROR_PUMP_TRANSACTION_NUMBER_OUT_OF_RANGE = 21,
        [Description("Pump transaction not found")]
        JSONPTS_ERROR_PUMP_TRANSACTION_NOT_FOUND = 22,
        [Description("Tank number is out of range")]
        JSONPTS_ERROR_TANK_NUMBER_OUT_OF_RANGE = 23,
        [Description("Could not get tank number")]
        JSONPTS_ERROR_COULD_NOT_GET_TANK_NUMBER = 24,
        [Description("Could not get transaction number")]
        JSONPTS_ERROR_COULD_NOT_GET_TRANSACTION_NUMBER = 25,
        [Description("Transaction number is out of range")]
        JSONPTS_ERROR_TRANSACTION_NUMBER_OUT_OF_RANGE = 26,
        [Description("Transaction number does not match")]
        JSONPTS_ERROR_TRANSACTION_NUMBER_NOT_MATCH = 27,
        [Description("Transaction number already exist")]
        JSONPTS_ERROR_TRANSACTION_NUMBER_ALREADY_EXIST = 28,
        [Description("Could not get nozzle number")]
        JSONPTS_ERROR_COULD_NOT_GET_NOZZLE_NUMBER = 29,
        [Description("Could not get fuel grade Id")]
        JSONPTS_ERROR_COULD_NOT_GET_FUEL_GRADE_ID = 30,
        [Description("Could not get nozzle number and fuel grade Id")]
        JSONPTS_ERROR_COULD_NOT_GET_NOZZLE_NUMBER_FUEL_GRADE_ID = 31,
        [Description("Could not get nozzle number from fuel grade Id")]
        JSONPTS_ERROR_COULD_NOT_GET_NOZZLE_NUMBER_FROM_GRADE_ID = 32,
        [Description("Nozzle number is out of range")]
        JSONPTS_ERROR_NOZZLE_NUMBER_OUT_OF_RANGE = 33,
        [Description("Could not get type")]
        JSONPTS_ERROR_COULD_NOT_GET_TYPE = 34,
        [Description("Could not get name")]
        JSONPTS_ERROR_COULD_NOT_GET_NAME = 35,
        [Description("Type is out of range")]
        JSONPTS_ERROR_TYPE_OUT_OF_RANGE = 36,
        [Description("Could not get dose value")]
        JSONPTS_ERROR_COULD_NOT_GET_DOSE_VALUE = 37,
        [Description("Could not get price value")]
        JSONPTS_ERROR_COULD_NOT_GET_PRICE_VALUE = 38,
        [Description("Duplicated authorization request")]
        JSONPTS_ERROR_DUPLICATED_AUTHORIZATION_REQUEST = 39,
        [Description("Pump is busy by other user")]
        JSONPTS_ERROR_PUMP_BUSY_OTHER_USER = 40,
        [Description("Pump is busy with other request being executed")]
        JSONPTS_ERROR_PUMP_BUSY_OTHER_REQUEST_EXECUTED = 41,
        [Description("Pump is busy with filling")]
        JSONPTS_ERROR_PUMP_BUSY_FILLING = 42,
        [Description("Pump is not in filling process")]
        JSONPTS_ERROR_PUMP_NOT_IN_FILLING_PROCESS = 43,
        [Description("Could not get state value")]
        JSONPTS_ERROR_COULD_NOT_GET_STATE_VALUE = 44,
        [Description("State value is out of range")]
        JSONPTS_ERROR_STATE_VALUE_OUT_OF_RANGE = 45,
        [Description("User does not match")]
        JSONPTS_ERROR_USER_NOT_MATCH = 46,
        [Description("Date is out of range")]
        JSONPTS_ERROR_DATE_OUT_OF_RANGE = 47,
        [Description("Time is out of range")]
        JSONPTS_ERROR_TIME_OUT_OF_RANGE = 48,
        [Description("Could not get height value")]
        JSONPTS_ERROR_COULD_NOT_GET_HEIGHT = 49,
        [Description("Could not get probe number")]
        JSONPTS_ERROR_COULD_NOT_GET_PROBE_NUMBER = 50,
        [Description("Probe number is out of range")]
        JSONPTS_ERROR_PROBE_NUMBER_OUT_OF_RANGE = 51,
        [Description("Pump is not configured")]
        JSONPTS_ERROR_PUMP_IS_NOT_CONFIGURED = 52,
        [Description("Restore of configuration failed")]
        JSONPTS_ERROR_RESTORE_CONFIGURATION_FAILED = 53,
        [Description("Configuration file not found")]
        JSONPTS_ERROR_CONFIGURATION_FILE_NOT_FOUND = 54,
        [Description("Calibration chart for tank is not configured")]
        JSONPTS_ERROR_CALIBRATION_CHART_NOT_CONFIGURED = 55,
        [Description("Tank is not configured")]
        JSONPTS_ERROR_TANK_NOT_CONFIGURED = 56,
        [Description("Pump fuel grade does not correspond to the tank fuel")]
        JSONPTS_ERROR_PUMP_GRADE_NOT_CORRESPOND_TANK = 57,
        [Description("Incorrect tanks configuration")]
        JSONPTS_ERROR_INCORRECT_TANKS_CONFIGURATION = 58,
        [Description("Not inited")]
        INIT_ERROR = 1000,
        [Description("Network error")]
        NETWORK_ERROR = 1001,
        [Description("Timed out")]
        TIMEOUT_ERROR = 1002,
        [Description("HTTP response code is wrong")]
        RESPONSE_CODE_ERROR = 1003,
        [Description("Authorization error")]
        UNAUTHORIZED_ERROR = 1004,
        [Description("Protocol error")]
        PROTOCOL_ERROR = 1005,
        [Description("JSON parse error")]
        JSON_PARSE_ERROR = 1006,
        [Description("At last one request in sequence was failed")]
        AT_LAST_ONE_REQUEST_IN_SEQUENCE_FAILED_ERROR = 1007,
        [Description("Unknown error")]
        UNKNOWN_ERROR = 1008
    }
}

