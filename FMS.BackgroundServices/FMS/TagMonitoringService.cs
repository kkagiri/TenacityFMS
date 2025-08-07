//Cursor
using System;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common.Constants;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Services;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json; // For JSON serialization
using System.Collections.Generic;
using System.IO;
using FMS.Application.Features.Notification.DTOs;

namespace FMS.BackgroundServices.FMS {
    public class TagMonitoringService : BackgroundService {
        private readonly ILogger<TagMonitoringService> _logger;
        private readonly IServiceScopeFactory _serviceScopeFactory;
        private readonly IConfiguration _configuration;
        private readonly string _mappingFilePath = "FMS.BackgroundServices/FMS/GPSGATELocationMapping.json"; //Cursor
        private Dictionary<string, int> _tagMappings;
        private Dictionary<string, string> _locationTagMappings;

        public TagMonitoringService (ILogger<TagMonitoringService> logger, IServiceScopeFactory serviceScopeFactory, IConfiguration configuration) {
            _logger = logger;
            _serviceScopeFactory = serviceScopeFactory;
            _configuration = configuration;
            LoadMappings (); //Cursor
        }

        private void LoadMappings () //Cursor
        {
            if (!File.Exists (_mappingFilePath)) {
                _logger.LogError ($"Mapping file not found: {_mappingFilePath}");
                _tagMappings = new Dictionary<string, int> ();
                _locationTagMappings = new Dictionary<string, string> ();
                return;
            }
            var json = File.ReadAllText (_mappingFilePath);
            dynamic mappings = JsonConvert.DeserializeObject (json);
            _tagMappings = JsonConvert.DeserializeObject<Dictionary<string, int>> (mappings.TagMappings.ToString ());
            _locationTagMappings = JsonConvert.DeserializeObject<Dictionary<string, string>> (mappings.LocationTagMappings.ToString ());
        }

        protected override async Task ExecuteAsync (CancellationToken stoppingToken) {
            while (!stoppingToken.IsCancellationRequested) {
                var now = DateTime.Now;
                var nextRun = now.Date.AddHours (8); // 8:00 am today
                if (now > nextRun)
                    nextRun = nextRun.AddDays (1); // if past 8:00 am, schedule for next day
                var delay = nextRun - now;
                if (delay > TimeSpan.Zero)
                    await Task.Delay (delay, stoppingToken); //Cursor

                try {
                    using (var scope = _serviceScopeFactory.CreateScope ()) {
                        var context = scope.ServiceProvider.GetRequiredService<GpsdataContext> ();
                        var configs = await context.TagMonitoringConfigs
                            .Where (c => c.IsEnabled && c.Monitored)
                            .Include (c => c.Vehicle)
                            .ToListAsync (stoppingToken);

                        var gpsGateBaseUrl = _configuration["GpsGate:BaseUrl"];
                        var gpsGateToken = _configuration["GpsGate:Token"];
                        var applicationId = _configuration["ApplicationId"];

                        using var httpClient = new HttpClient ();
                        httpClient.DefaultRequestHeaders.Accept.Add (new MediaTypeWithQualityHeaderValue ("application/json"));
                        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue ("Bearer", gpsGateToken);

                        //Cursor - Get notification service for error reporting
                        var notificationService = scope.ServiceProvider.GetService<INotificationService> ();

                        foreach (var config in configs) {
                            var vehicle = config.Vehicle;
                            if (vehicle == null) continue;
                            var gpsGateUserId = vehicle.VehicleId; //Cursor

                            // 1. Get current status
                            var statusUrl = $"{gpsGateBaseUrl}/applications/{applicationId}/users/{gpsGateUserId}/status";
                            HttpResponseMessage statusResp;
                            try {
                                statusResp = await httpClient.GetAsync (statusUrl, stoppingToken);
                                if (!statusResp.IsSuccessStatusCode) {
                                    _logger.LogError ($"Failed to fetch status for vehicle {vehicle.VehicleId}");
                                    await LogTagChange (context, vehicle, "", config.TagName, "", "Error", "Failed to fetch status", stoppingToken);

                                    //Cursor - Send notification for API failure
                                    await SendTagMonitoringErrorNotificationAsync (notificationService, vehicle, "Failed to fetch status from GPS Gate API", stoppingToken);
                                    continue;
                                }
                            } catch (Exception ex) {
                                _logger.LogError (ex, $"Exception fetching status for vehicle {vehicle.VehicleId}");
                                await LogTagChange (context, vehicle, "", config.TagName, "", "Error", ex.Message, stoppingToken);

                                //Cursor - Send notification for exception
                                await SendTagMonitoringErrorNotificationAsync (notificationService, vehicle, ex.Message, stoppingToken);
                                continue;
                            }
                            dynamic status = JsonConvert.DeserializeObject (await statusResp.Content.ReadAsStringAsync ());
                            double lat = status.position.latitude;
                            double lon = status.position.longitude;

                            // 2. Reverse geocode
                            var geocodeUrl = $"{gpsGateBaseUrl}/applications/{applicationId}/reversegeocode?lon={lon}&lat={lat}";
                            string locationName = "";
                            try {
                                var geocodeResp = await httpClient.GetAsync (geocodeUrl, stoppingToken);
                                if (geocodeResp.IsSuccessStatusCode) {
                                    dynamic geocode = JsonConvert.DeserializeObject (await geocodeResp.Content.ReadAsStringAsync ());
                                    locationName = geocode.location.address;
                                }
                            } catch (Exception ex) {
                                _logger.LogError (ex, $"Exception in reverse geocoding for vehicle {vehicle.VehicleId}");
                            }

                            // 3. Map location to tag
                            string expectedTag = null;
                            if (!string.IsNullOrEmpty (locationName) && _locationTagMappings.TryGetValue (locationName, out expectedTag)) {
                                // 4. Compare/update tag
                                if (_tagMappings.TryGetValue (expectedTag, out int expectedTagId)) {
                                    // TODO: Get current tag for user (if needed)
                                    // For now, always try to add to expectedTagId
                                    var addUrl = $"{gpsGateBaseUrl}/applications/{applicationId}/tags/{expectedTagId}/users";
                                    var addBody = new { id = gpsGateUserId };
                                    var addContent = new StringContent (JsonConvert.SerializeObject (addBody), Encoding.UTF8, "application/json");
                                    var addResp = await httpClient.PostAsync (addUrl, addContent, stoppingToken);
                                    if (addResp.IsSuccessStatusCode) {
                                        await LogTagChange (context, vehicle, "", expectedTag, locationName, "TagChanged", "Tag updated due to location match", stoppingToken);

                                        //Cursor - Send success notification for tag change
                                        await SendTagChangeSuccessNotificationAsync (notificationService, vehicle, expectedTag, locationName, stoppingToken);
                                    } else {
                                        await LogTagChange (context, vehicle, "", expectedTag, locationName, "Error", "Failed to update tag", stoppingToken);

                                        //Cursor - Send error notification for tag update failure
                                        await SendTagMonitoringErrorNotificationAsync (notificationService, vehicle, "Failed to update tag in GPS Gate", stoppingToken);
                                    }
                                }
                            } else {
                                // No matching tag for location
                                await LogTagChange (context, vehicle, "", config.TagName, locationName, "NoMatch", "No matching tag for location", stoppingToken);
                            }
                        }
                    }
                } catch (Exception ex) {
                    _logger.LogError (ex, "Exception in TagMonitoringService main loop");
                }
            }
        }

        private async Task LogTagChange (GpsdataContext context, Vehicle vehicle, string oldTag, string newTag, string location, string action, string note, CancellationToken token) {
            context.TagChangeLogs.Add (new TagChangeLog {
                VehicleId = vehicle.VehicleId,
                    Username = vehicle.HyoungNo,
                    OldTag = oldTag,
                    NewTag = newTag,
                    Location = location,
                    Timestamp = DateTime.UtcNow,
                    Action = action,
                    Note = note
            });
            await context.SaveChangesAsync (token);
        }

        //Cursor - Add notification methods for tag monitoring events
        private async Task SendTagMonitoringErrorNotificationAsync (INotificationService notificationService, Vehicle vehicle, string errorMessage, CancellationToken cancellationToken) {
            if (notificationService == null) return;

            try {
                var request = new CreateNotificationRequest {
                    Type = "Alert",
                    Category = "TagMonitoring",
                    Priority = "Medium",
                    Title = "Tag Monitoring Error",
                    Message = $"Tag monitoring error for vehicle {vehicle.HyoungNo}: {errorMessage}",
                    TriggerSource = "TagMonitoring",
                    TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy,
                    VehicleId = vehicle.VehicleId

                };

                await notificationService.CreateNotificationAsync (request, cancellationToken);
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to send tag monitoring error notification for vehicle {VehicleId}", vehicle.VehicleId);
            }
        }

        private async Task SendTagChangeSuccessNotificationAsync (INotificationService notificationService, Vehicle vehicle, string newTag, string location, CancellationToken cancellationToken) {
            if (notificationService == null) return;

            try {
                var request = new CreateNotificationRequest {
                    Type = "Info",
                    Category = "TagMonitoring",
                    Priority = "Low",
                    Title = "Tag Updated Successfully",
                    Message = $"Vehicle {vehicle.HyoungNo} tag updated to '{newTag}' based on location: {location}",
                    TriggerSource = "TagMonitoring",
                    TriggeredBy = SystemConstants.Defaults.SystemTriggeredBy,
                    VehicleId = vehicle.VehicleId

                };

                await notificationService.CreateNotificationAsync (request, cancellationToken);
            } catch (Exception ex) {
                _logger.LogError (ex, "Failed to send tag change success notification for vehicle {VehicleId}", vehicle.VehicleId);
            }
        }
    }
}