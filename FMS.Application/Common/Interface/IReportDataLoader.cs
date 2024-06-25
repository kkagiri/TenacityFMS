using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Domain.Entities;

namespace FMS.Application.Common.Interface;

//T <summary>
/// 
/// </summary>o:Do check if this is doing anything 
public interface IReportDataLoader
{
    Task<List<Vehicleconsumption>> LoadVehicleConsumptionData();
}