using FMS.Application.ModelsDTOs.NaftaATG;
using FMS.Persistence.DataAccess.Nafta;
using FMS.Persistence.DataAccess;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Threading;
using Microsoft.EntityFrameworkCore;
using FMS.Application.ModelsDTOs.FMS.Vehicle;

namespace FMS.Application.Queries.Database.NaftaATGQueries.CardDetailsQueries
{
    public class GetCardDetailbyCardIDQuery:IRequest<CardDetailsDTO>
    {
        public string CardID { get; set; }
    }

    public class GetCardDetailbyCardIDQueryHandler : IRequestHandler<GetCardDetailbyCardIDQuery, CardDetailsDTO>
    {
        private readonly NaftaContext _naftaContext;
        private readonly GpsdataContext _gpsContext;

        public GetCardDetailbyCardIDQueryHandler(NaftaContext naftaContext, GpsdataContext gpsContext)
        {
            _naftaContext = naftaContext;
            _gpsContext = gpsContext;
        }

        public async Task<CardDetailsDTO> Handle(GetCardDetailbyCardIDQuery request, CancellationToken cancellationToken)
        {

            try
            {
                var card = await _naftaContext.NaftaCardsTables.FirstOrDefaultAsync
                    (c => c.Cardcode == request.CardID, cancellationToken);


                if (card == null)
                {
                    return null;
                }

                var vehicle = await _gpsContext.Vehicles.Include(x=>x.VehicleType).
                             FirstOrDefaultAsync(v => v.HyoungNo == card.Holder, cancellationToken);

                var cardDetails = new CardDetailsDTO
                {
                    CardId = card.Cardcode,
                    Holder = card.Holder,
                    Vehicle = vehicle != null ? new VehicleDTO
                    {
                        HyoungNo = vehicle.HyoungNo,
                        VehicleId = vehicle.VehicleId,
                        VehicleTypeId = vehicle.VehicleTypeId,
                    } : null
                };

                return cardDetails;

            }catch (Exception ex)
            {
                throw;
            }

        }
    }
}
