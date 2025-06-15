sequenceDiagram
    participant BGService as AutomatedReconciliation<br/>BackgroundService
    participant ARService as AutomatedReconciliation<br/>Service
    participant PolicyEngine as PolicyEvaluation<br/>Engine
    participant RedisService as PolicyTrigger<br/>Service (Redis)
    participant DiscrepancyDetection as DiscrepancyDetection<br/>Service
    participant Orchestration as ReconciliationOrchestration<br/>Service
    participant TankVolumeService as TankVolumeHistory<br/>IntegrationService
    participant Context as GpsdataContext<br/>(Database)
    participant EventBus as MediatR<br/>(Events)

    Note over BGService: Background Service Timer<br/>Triggers Every 15 Minutes

    BGService->>ARService: ExecuteReconciliationCycleAsync()
    activate ARService

    ARService->>PolicyEngine: EvaluateAllPoliciesAsync()
    activate PolicyEngine

    PolicyEngine->>Context: Get Active Policies
    Context-->>PolicyEngine: ReconciliationPolicies[]

    loop For Each Active Policy
        PolicyEngine->>PolicyEngine: IsPolicyDueForExecution(policy)

        alt Policy is EventDriven
            PolicyEngine->>RedisService: HasPendingTriggersAsync(policyId)
            RedisService-->>PolicyEngine: bool (hasPendingTriggers)
        else Policy is Scheduled
            PolicyEngine->>Context: Get Last Execution Time
            Context-->>PolicyEngine: LastExecutionTime
            PolicyEngine->>PolicyEngine: Calculate if due based on frequency
        end

        alt Policy is Due
            PolicyEngine->>PolicyEngine: GetEligibleTanks(policy)
            PolicyEngine->>Context: Get Tanks matching scope
            Context-->>PolicyEngine: Tank[]
        end
    end

    PolicyEngine-->>ARService: PolicyEvaluationResult[]
    deactivate PolicyEngine

    loop For Each Policy Requiring Execution
        ARService->>ARService: ExecutePolicyAsync(policyResult)

        ARService->>DiscrepancyDetection: DetectDiscrepanciesAsync(policy, tanks)
        activate DiscrepancyDetection

        loop For Each Tank
            DiscrepancyDetection->>Context: Get Tank Volume History
            Context-->>DiscrepancyDetection: TankVolumeHistory[]

            DiscrepancyDetection->>DiscrepancyDetection: CalculateVariance(expected, actual)

            alt Significant Discrepancy Found
                DiscrepancyDetection->>EventBus: Publish DiscrepancyDetectedEvent
                EventBus-->>DiscrepancyDetection: Event Published
            end
        end

        DiscrepancyDetection-->>ARService: DetectedDiscrepancy[]
        deactivate DiscrepancyDetection

        alt Discrepancies Found
            ARService->>Orchestration: ExecuteReconciliationAsync(policyResult, discrepancies)
            activate Orchestration

            Orchestration->>Context: Create PolicyExecution Record
            Context-->>Orchestration: ExecutionId

            loop For Each Discrepancy
                Orchestration->>Orchestration: ProcessDiscrepancyAsync(discrepancy)

                Orchestration->>TankVolumeService: ReconcileTankCurrentStockAsync(tankId)
                activate TankVolumeService

                TankVolumeService->>Context: Get Tank Current Stock
                Context-->>TankVolumeService: Tank

                TankVolumeService->>Context: Get Latest Volume History
                Context-->>TankVolumeService: TankVolumeHistory

                alt Stock Reconciliation Needed
                    TankVolumeService->>Context: Update Tank.CurrentStock
                    TankVolumeService->>Context: Create Reconciliation VolumeHistory
                    Context-->>TankVolumeService: Success

                    Note over TankVolumeService: Trigger Event-Driven Policies<br/>if variance > threshold

                    TankVolumeService->>RedisService: TriggerTankVariancePolicyAsync()
                    RedisService->>RedisService: PublishPolicyTriggerAsync()
                end

                TankVolumeService-->>Orchestration: ReconciliationResult
                deactivate TankVolumeService

                Orchestration->>Context: Create DiscrepancyRecord
                Context-->>Orchestration: Saved
            end

            Orchestration->>Context: Update PolicyExecution Status
            Context-->>Orchestration: Updated

            Orchestration->>EventBus: Publish ReconciliationExecutionCompletedEvent
            EventBus-->>Orchestration: Event Published

            Orchestration-->>ARService: ReconciliationExecutionResult
            deactivate Orchestration
        end

        alt Event-Driven Policy
            ARService->>RedisService: MarkTriggersProcessedAsync(policyId)
            RedisService-->>ARService: Triggers Marked as Processed
        end
    end

    ARService->>PolicyEngine: UpdatePolicyExecutionTimesAsync()
    PolicyEngine->>Context: Update NextExecutionTime for policies
    Context-->>PolicyEngine: Updated

    ARService-->>BGService: AutomatedReconciliationCycleResult
    deactivate ARService

    Note over BGService: Log Cycle Results<br/>Wait for Next Interval