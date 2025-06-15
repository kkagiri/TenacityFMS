// using System.Threading;
// using System.Threading.Tasks;
// using FMS.Domain.Entities;

// namespace FMS.Application.Communication.Redis;

// //Cursor - Extension methods for common policy trigger scenarios
// public static class PolicyTriggerExtensions
// {
//     /// <summary>
//     /// Trigger reconciliation policies when tank variance exceeds thresholds
//     /// </summary>
//     public static async Task TriggerTankVariancePolicyAsync(
//         this IPolicyTriggerService policyTriggerService,
//         int policyId,
//         int tankId,
//         decimal varianceAmount,
//         decimal variancePercentage,
//         CancellationToken cancellationToken = default)
//     {
//         var metadata = new
//         {
//             TankId = tankId,
//             VarianceAmount = varianceAmount,
//             VariancePercentage = variancePercentage,
//             TriggerType = "TankVariance"
//         };

//         await policyTriggerService.PublishPolicyTriggerAsync( policyId,  $"Tank {tankId} variance detected: {varianceAmount:F2}L ({variancePercentage:F1}%)",  metadata, cancellationToken);
//     }

//     /// <summary>
//     /// Trigger reconciliation policies after fuel delivery
//     /// </summary>
//     public static async Task TriggerPostDeliveryPolicyAsync(
//         this IPolicyTriggerService policyTriggerService,
//         int policyId,
//         int deliveryId,
//         int tankId,
//         decimal deliveredAmount,
//         CancellationToken cancellationToken = default)
//     {
//         var metadata = new
//         {
//             DeliveryId = deliveryId,
//             TankId = tankId,
//             DeliveredAmount = deliveredAmount,
//             TriggerType = "PostDelivery"
//         };

//         await policyTriggerService.PublishPolicyTriggerAsync(
//             policyId,
//             $"Post-delivery reconciliation required for tank {tankId} after delivery {deliveryId}",
//             metadata,
//             cancellationToken);
//     }

//     /// <summary>
//     /// Trigger reconciliation policies when tank reading anomalies are detected
//     /// </summary>
//     public static async Task TriggerAnomalyDetectionPolicyAsync(
//         this IPolicyTriggerService policyTriggerService,
//         int policyId,
//         int tankId,
//         string anomalyType,
//         string anomalyDescription,
//         CancellationToken cancellationToken = default)
//     {
//         var metadata = new
//         {
//             TankId = tankId,
//             AnomalyType = anomalyType,
//             AnomalyDescription = anomalyDescription,
//             TriggerType = "AnomalyDetection"
//         };

//         await policyTriggerService.PublishPolicyTriggerAsync(
//             policyId,
//             $"Anomaly detected in tank {tankId}: {anomalyType}",
//             metadata,
//             cancellationToken);
//     }

//     /// <summary>
//     /// Trigger reconciliation policies on demand/manual request
//     /// </summary>
//     public static async Task TriggerManualPolicyAsync(
//         this IPolicyTriggerService policyTriggerService,
//         int policyId,
//         string requestedBy,
//         string reason,
//         CancellationToken cancellationToken = default)
//     {
//         var metadata = new
//         {
//             RequestedBy = requestedBy,
//             Reason = reason,
//             TriggerType = "Manual"
//         };

//         await policyTriggerService.PublishPolicyTriggerAsync(
//             policyId,
//             $"Manual reconciliation requested by {requestedBy}: {reason}",
//             metadata,
//             cancellationToken);
//     }
// }