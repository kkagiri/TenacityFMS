using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FMS.Application.Features.FMS;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Auth;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Queries.GPSGATEServer.GetconsumptionReport {
    public class GetConsumptionReportQuery : IRequest<List<VehicleConsumptionInfoDTO>> {
        public GetConsumptionReportQuery (GPSGateConections conn, int fuelConsumptionReportId, DateTime from, DateTime to) {
            this.conn = conn;
            FuelConsumptionReportId = fuelConsumptionReportId;
            From = from;
            To = to;
        }

        public GPSGateConections conn { get; set; }

        public int? FuelConsumptionReportId { get; set; }

        public DateTime From { get; set; }

        public DateTime To { get; set; }
    }
}