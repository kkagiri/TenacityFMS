using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.ATG;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.TankManagement.PumpTransaction {
    public class GetPumpTransactionQuery : IRequest<FMSResponse<IEnumerable<PumpTransactionDto>>> {
        public int? TankId { get; set; }
        public int? VehicleId { get; set; }
        public string? PtsId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool? ProcessedOnly { get; set; }
    }

    public class GetPumpTransactionQueryHandler : IRequestHandler<GetPumpTransactionQuery, FMSResponse<IEnumerable<PumpTransactionDto>>> {
        private readonly GpsdataContext _context;

        public GetPumpTransactionQueryHandler (GpsdataContext context) {
            _context = context;
        }

        public async Task<FMSResponse<IEnumerable<PumpTransactionDto>>> Handle (GetPumpTransactionQuery request, CancellationToken cancellationToken) {
            try {
                // Validate request
                List<string> validationErrors = ValidateRequest (request);
                if (validationErrors.Any ()) {
                    return FMSResponse<IEnumerable<PumpTransactionDto>>.ValidationFailed (validationErrors);
                }

                IQueryable<Domain.Entities.Pumptransaction> query = _context.Pumptransactions.AsNoTracking ();

                // Apply filters
                if (request.TankId.HasValue) {
                    query = query.Where (pt => pt.TankId == request.TankId.Value);
                }

                if (request.VehicleId.HasValue) {
                    query = query.Where (pt => pt.VehicleId == request.VehicleId.Value);
                }

                if (!string.IsNullOrEmpty (request.PtsId)) {
                    query = query.Where (pt => pt.PtsId == request.PtsId);
                }

                if (request.StartDate.HasValue) {
                    query = query.Where (pt => pt.DateTime >= request.StartDate.Value);
                }

                if (request.EndDate.HasValue) {
                    query = query.Where (pt => pt.DateTime <= request.EndDate.Value);
                }

                if (request.ProcessedOnly.HasValue) {
                    query = query.Where (pt => pt.HasBeenProcessed == request.ProcessedOnly.Value);
                }

                List<PumpTransactionDto> result = await query
                    .Include (pt => pt.Tank)
                    .Include (pt => pt.Vehicle)
                    .Select (pt => new PumpTransactionDto {
                        PtsId = pt.PtsId,
                            PacketId = pt.PacketId,
                            DateTimeStart = pt.DateTimeStart ?? DateTime.MinValue,
                            DateTime = pt.DateTime,
                            Pump = pt.Pump ?? 0,
                            Nozzle = pt.Nozzle ?? 0,
                            FuelGradeId = pt.FuelGradeId,
                            FuelGradeName = pt.FuelGradeName,
                            Transaction = pt.Transaction ?? 0,
                            Volume = pt.Volume ?? 0,
                            TCVolume = pt.Tcvolume,
                            Price = pt.Price,
                            Amount = pt.Amount ?? 0,
                            TotalVolume = pt.TotalVolume,
                            TotalAmount = pt.TotalAmount,
                            Tag = pt.Tag,
                            UserId = pt.UserId,
                            ConfigurationId = pt.ConfigurationId,
                            TankId = pt.TankId,
                            TankName = pt.Tank != null ? pt.Tank.Name : null,
                            VehicleId = pt.VehicleId,
                            VehicleName = pt.Vehicle != null ? pt.Vehicle.HyoungNo : null,
                            VehicleNumberPlate = pt.Vehicle != null ? pt.Vehicle.NumberPlate : null,
                            HasBeenProcessed = pt.HasBeenProcessed
                    })
                    .OrderByDescending (pt => pt.DateTime)
                    .ToListAsync (cancellationToken);

                return FMSResponse<IEnumerable<PumpTransactionDto>>.Success (result, $"Retrieved {result.Count} pump transactions successfully");
            } catch (Exception ex) {
                return FMSResponse<IEnumerable<PumpTransactionDto>>.SystemError ($"Error retrieving pump transactions: {ex.Message}");
            }
        }

        private List<string> ValidateRequest (GetPumpTransactionQuery request) {
            List<string> errors = new List<string> ();

            // Validate date range
            if (request.StartDate.HasValue && request.EndDate.HasValue && request.StartDate > request.EndDate) {
                errors.Add ("Start date cannot be greater than end date");
            }

            // Validate PtsId format if provided
            if (!string.IsNullOrEmpty (request.PtsId) && request.PtsId.Length > 100) {
                errors.Add ("PTS ID cannot exceed 100 characters");
            }

            // Validate that at least one filter is provided to prevent returning all records
            if (!request.TankId.HasValue &&
                !request.VehicleId.HasValue &&
                string.IsNullOrEmpty (request.PtsId) &&
                !request.StartDate.HasValue &&
                !request.EndDate.HasValue) {
                errors.Add ("At least one filter parameter must be provided");
            }

            return errors;
        }
    }
}