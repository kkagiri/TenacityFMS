uploadstatus format
First, the system receives an UploadStatus from the PTS device. This status message contains a Pumps object that can include four different types of status: Idle, Filling, EndOfTransaction, and Offline. Each status type contains arrays that are indexed in parallel, meaning the data at index [i] in each array relates to the same pump.

1. Initial Status Processing:
The UploadStatusCommandHandler first checks for any pending commands that need to be sent back to the device. This is crucial because it ensures any queued commands get priority processing. If there are pending commands, they are returned immediately and the status processing is deferred.
2. Idle Status Processing:
When processing IdleStatus, the system carefully handles parallel arrays according to the protocol:
    - Ids array (1-50) determines which pumps are idle
    - For each pump ID, the system checks the corresponding indices in:
        - NozzlesUp array (1-6) for lifted nozzles
        - Tags array (48 hex symbols) for presented tags
        - LastTransactions array for previous transaction data
        All these arrays must be processed together, maintaining index correlation.
3. Filling Status Processing:
The FillingStatus contains real-time transaction data with parallel arrays:
    - Ids array identifies which pumps are actively fueling
    - The system processes corresponding indices in:
        - Nozzles array (1-6) for active nozzle
        - FuelGradeIds (1-20) and Names (20 ASCII chars)
        - Transactions, Volumes, Amounts, and Prices
        Each array element at the same index relates to the same active transaction.
4. End of Transaction Processing:
The EndOfTransactionStatus follows the same structure as FillingStatus but represents completed transactions. The system:
    - Processes each pump ID in the Ids array
    - Records final transaction details
    - Clears authorization states
    - Updates transaction records
    sample

    "Type": "UploadStatus",
"Data": {
"ConfigurationId": "747a3fe2",
"DateTime": "2022-09-20T19:30:08",
"FirmwareDateTime": "2022-09-15T14:25:16",
"PtsStartupSeconds": 59,
"BatteryVoltage": 3023,
"CpuTemperature":37,
"PowerDownDetected": false,
"Pumps": {
"IdleStatus": {
"Ids": [1, 3],
"NozzlesUp": [1, 0],
"LastNozzles": [0, 0],
"LastTransactions": [0, 0],
"LastVolumes": [0.00, 0.00],
"LastAmounts": [0.00, 0.00],
"LastPrices": [1.11, 1.11],
"Requests": ["", ""]
},
"FillingStatus": {
"Ids": [2],
"Nozzles": [2],
"Transactions": [2996],
"Volumes": [43.80],
"Amounts": [45.99],
"Prices": [1.05]
},
"EndOfTransactionStatus": {},
"OfflineStatus": {
"Ids": [4]
},
"Users": ["","","admin",""]
},
"Probes": {
"OnlineStatus": {
"Ids": [1, 2],
"Errors": [2],
"CriticalHighProductAlarms": [],
"HighProductAlarms": [],
"LowProductAlarms": [],
"CriticalLowProductAlarms": [],
"HighWaterAlarms": [],
"TankLeakageAlarms": [],
"Measurements": [
[1, 1000.0, 10.0, 20.0, 20000, 100, 15000, 19900, 759.0, 15200.0],
[2, 2520.0, 50.0, 25.3, 25500, 500, 1000, 25500, 759.0, 25500.0]
]
},
"OfflineStatus": {
"Ids": [3]
}
},
"PriceBoards": {
"OnlineStatus": {},
"OfflineStatus": {
"Ids": [1]
}
},
"Readers": {
"OnlineStatus": {},
"OfflineStatus": {
"Ids": [1, 2, 3, 4],
"Tags": ["12345", "", "", "0400527ec4"]
}
},
"Gps": {
"Status": "Absent"
},
"FuelGrades":[{
"Id":1,
"Name":"Petrol",
"Price":27.50,
"ExpansionCoefficient":0.00110
},{
"Id":2,
"Name":"Diesel",
"Price":23.99,
"ExpansionCoefficient":0.00082
}]
}
