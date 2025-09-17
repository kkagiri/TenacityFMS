using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.ATG;
using FMS.Application.Features.FMS;
using FMS.Application.Features.PTS;
using FMS.Domain.Entities;

namespace FMS.Application.MappingProfile {
    public class ATGMappingProfile : Profile {
        public ATGMappingProfile () {
            CreateMap<InTankDeliveryDto, Intankdelivery> ().ReverseMap ();
            //CreateMap<Pumptransaction, PumpTransactionDto>().ReverseMap();
            CreateMap<PTSAlertRecord, AlertRecordDTO> ().ReverseMap (); //Cursor: Using the correct class name AlertRecord

        }
    }
}