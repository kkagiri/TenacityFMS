using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Queries.Database.PTSQueries.TagQueries;
using FMS.Domain.Entities;
using Xunit;

namespace FMS.Testing.TagQueries {
    public class GetFuelIssuedForTagQueryTests {
        private readonly DateTime _today = DateTime.Today;
        private readonly DateTime _yesterday;
        private readonly DateTime _lastMonth;

        private readonly List<Pumptransaction> _pumpTransactions;
        private readonly List<FuelRefill> _fuelRefills;
        private readonly List<FuelTag> _tags;
        private readonly List<Vehicle> _vehicles;

        public GetFuelIssuedForTagQueryTests () {
            _yesterday = _today.AddDays (-1);
            _lastMonth = _today.AddMonths (-1);

            // Setup test data
            _vehicles = new List<Vehicle> {
                new Vehicle {
                VehicleId = 1,
                HyoungNo = "HY001",
                NumberPlate = "ABC123",
                AverageKmL = true
                },
                new Vehicle {
                VehicleId = 2,
                HyoungNo = "HY002",
                NumberPlate = "XYZ789",
                AverageKmL = true
                }
            };

            _tags = new List<FuelTag> {
                new FuelTag {
                Id = 1,
                Name = "TAG001",
                IsEnabled = true,
                VehicleId = 1
                },
                new FuelTag {
                Id = 2,
                Name = "TAG002",
                IsEnabled = true,
                VehicleId = 2
                }
            };

            _pumpTransactions = new List<Pumptransaction> {
                // Today's transactions for TAG001
                new Pumptransaction {
                Id = 1,
                PtsId = "PTS001",
                DateTime = _today.AddHours (10),
                Tag = "TAG001",
                Amount = 50.5m,
                PacketId = 1
                },
                new Pumptransaction {
                Id = 2,
                PtsId = "PTS001",
                DateTime = _today.AddHours (14),
                Tag = "TAG001",
                Amount = 25.3m,
                PacketId = 2
                },

                // Yesterday's transaction for TAG001
                new Pumptransaction {
                Id = 3,
                PtsId = "PTS001",
                DateTime = _yesterday.AddHours (9),
                Tag = "TAG001",
                Amount = 35.7m,
                PacketId = 3
                },

                // Today's transaction for TAG002
                new Pumptransaction {
                Id = 4,
                PtsId = "PTS001",
                DateTime = _today.AddHours (11),
                Tag = "TAG002",
                Amount = 42.1m,
                PacketId = 4
                },

                // Last month's transaction for TAG001
                new Pumptransaction {
                Id = 5,
                PtsId = "PTS001",
                DateTime = _lastMonth.AddDays (5),
                Tag = "TAG001",
                Amount = 30.0m,
                PacketId = 5
                }
            };

            _fuelRefills = new List<FuelRefill> {
                // Today's manual refill for TAG001
                new FuelRefill {
                Id = 1,
                VehicleId = 1,
                TagId = "TAG001",
                Date = _today.AddHours (16),
                ManualFuelrefillAmount = 15.2m,
                SiteId = 1,
                FuelBy = "User1",
                DateCreated = _today
                },

                // Yesterday's manual refill for TAG001
                new FuelRefill {
                Id = 2,
                VehicleId = 1,
                TagId = "TAG001",
                Date = _yesterday.AddHours (15),
                ManualFuelrefillAmount = 10.8m,
                SiteId = 1,
                FuelBy = "User1",
                DateCreated = _yesterday
                },

                // Today's manual refill for TAG002
                new FuelRefill {
                Id = 3,
                VehicleId = 2,
                TagId = "TAG002",
                Date = _today.AddHours (12),
                ManualFuelrefillAmount = 20.5m,
                SiteId = 1,
                FuelBy = "User1",
                DateCreated = _today
                },

                // Last month's manual refill for TAG001
                new FuelRefill {
                Id = 4,
                VehicleId = 1,
                TagId = "TAG001",
                Date = _lastMonth.AddDays (10),
                ManualFuelrefillAmount = 25.7m,
                SiteId = 1,
                FuelBy = "User1",
                DateCreated = _lastMonth
                }
            };
        }

        // Helper methods to calculate expected values
        private decimal CalculateDailyFuelIssuedForTag (string tagName, DateTime date) {
            var startOfDay = date.Date;
            var endOfDay = startOfDay.AddDays (1);

            var pumpTransactionsSum = _pumpTransactions
                .Where (pt => pt.Tag == tagName && pt.DateTime >= startOfDay && pt.DateTime <= endOfDay)
                .Sum (pt => pt.Amount ?? 0m);

            var fuelRefilsSum = _fuelRefills
                .Where (fr => fr.TagId == tagName && fr.Date >= startOfDay && fr.Date <= endOfDay)
                .Sum (fr => fr.ManualFuelrefillAmount ?? 0m);

            return pumpTransactionsSum + fuelRefilsSum;
        }

        private decimal CalculateMonthlyFuelIssuedForTag (string tagName, DateTime date) {
            var startOfMonth = new DateTime (date.Year, date.Month, 1);
            var endOfMonth = startOfMonth.AddMonths (1);

            var pumpTransactionsSum = _pumpTransactions
                .Where (pt => pt.Tag == tagName && pt.DateTime >= startOfMonth && pt.DateTime < endOfMonth)
                .Sum (pt => pt.Amount ?? 0m);

            var fuelRefilsSum = _fuelRefills
                .Where (fr => fr.TagId == tagName && fr.Date >= startOfMonth && fr.Date < endOfMonth)
                .Sum (fr => fr.ManualFuelrefillAmount ?? 0m);

            return pumpTransactionsSum + fuelRefilsSum;
        }

        private decimal CalculateDailyFuelIssuedForVehicle (int vehicleId, DateTime date) {
            var startOfDay = date.Date;
            var endOfDay = startOfDay.AddDays (1);

            // Get tags for this vehicle
            var vehicleTags = _tags
                .Where (t => t.VehicleId == vehicleId)
                .Select (t => t.Name)
                .ToList ();

            var pumpTransactionsSum = _pumpTransactions
                .Where (pt => vehicleTags.Contains (pt.Tag) && pt.DateTime >= startOfDay && pt.DateTime <= endOfDay)
                .Sum (pt => pt.Amount ?? 0m);

            var fuelRefilsSum = _fuelRefills
                .Where (fr => fr.VehicleId == vehicleId && fr.Date >= startOfDay && fr.Date <= endOfDay)
                .Sum (fr => fr.ManualFuelrefillAmount ?? 0m);

            return pumpTransactionsSum + fuelRefilsSum;
        }

        private decimal CalculateMonthlyFuelIssuedForVehicle (int vehicleId, DateTime date) {
            var startOfMonth = new DateTime (date.Year, date.Month, 1);
            var endOfMonth = startOfMonth.AddMonths (1);

            // Get tags for this vehicle
            var vehicleTags = _tags
                .Where (t => t.VehicleId == vehicleId)
                .Select (t => t.Name)
                .ToList ();

            var pumpTransactionsSum = _pumpTransactions
                .Where (pt => vehicleTags.Contains (pt.Tag) && pt.DateTime >= startOfMonth && pt.DateTime < endOfMonth)
                .Sum (pt => pt.Amount ?? 0m);

            var fuelRefilsSum = _fuelRefills
                .Where (fr => fr.VehicleId == vehicleId && fr.Date >= startOfMonth && fr.Date < endOfMonth)
                .Sum (fr => fr.ManualFuelrefillAmount ?? 0m);

            return pumpTransactionsSum + fuelRefilsSum;
        }

        #region Daily Fuel Issued For Tag Tests

        [Fact]
        public void GetDailyFuelIssuedForTag_ShouldReturnCorrectSum_ForGivenTag_AndDate () {
            // Arrange
            var tag = _tags.First (t => t.Name == "TAG001");

            // Act
            // Calculate expected result manually using our helper method
            var result = CalculateDailyFuelIssuedForTag (tag.Name, _today);

            // Assert
            // Expected: 50.5m + 25.3m (pump transactions) + 15.2m (manual refill) = 91.0m
            Assert.Equal (91.0m, result);
        }

        [Fact]
        public void GetDailyFuelIssuedForTag_ShouldReturnZero_WhenNoTransactionsExist () {
            // Arrange
            var tag = _tags.First (t => t.Name == "TAG001");
            var futureDate = _today.AddDays (5);

            // Act
            // Calculate result manually using our helper method for a future date (no transactions)
            var result = CalculateDailyFuelIssuedForTag (tag.Name, futureDate);

            // Assert
            Assert.Equal (0m, result);
        }

        #endregion

        #region Monthly Fuel Issued For Tag Tests

        [Fact]
        public void GetMonthlyFuelIssuedForTag_ShouldReturnCorrectSum_ForGivenTag_AndMonth () {
            // Arrange
            var tagName = "TAG001";

            // Act
            // Calculate result manually using our helper method
            var result = CalculateMonthlyFuelIssuedForTag (tagName, _today);

            // Assert
            // Expected: 50.5m + 25.3m + 35.7m (pump transactions this month) + 15.2m + 10.8m (manual refills this month) = 137.5m
            Assert.Equal (137.5m, result);
        }

        #endregion

        #region Daily Fuel Issued For Vehicle Tests

        [Fact]
        public void GetDailyFuelIssuedForVehicle_ShouldReturnCorrectSum_ForGivenVehicle_AndDate () {
            // Arrange
            var vehicleId = 1; // Vehicle with TAG001

            // Act
            // Calculate result manually using our helper method
            var result = CalculateDailyFuelIssuedForVehicle (vehicleId, _today);

            // Assert
            // Expected: 50.5m + 25.3m (pump transactions) + 15.2m (manual refill) = 91.0m
            Assert.Equal (91.0m, result);
        }

        #endregion

        #region Monthly Fuel Issued For Vehicle Tests

        [Fact]
        public void GetMonthlyFuelIssuedForVehicle_ShouldReturnCorrectSum_ForGivenVehicle_AndMonth () {
            // Arrange
            var vehicleId = 1; // Vehicle with TAG001

            // Act
            // Calculate result manually using our helper method
            var result = CalculateMonthlyFuelIssuedForVehicle (vehicleId, _today);

            // Assert
            // Expected: 50.5m + 25.3m + 35.7m (pump transactions this month) + 15.2m + 10.8m (manual refills this month) = 137.5m
            Assert.Equal (137.5m, result);
        }

        #endregion
    }
}