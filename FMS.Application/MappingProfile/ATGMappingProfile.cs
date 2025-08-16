using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.ModelsDTOs.ATG;
using FMS.Application.ModelsDTOs.FMS;
using FMS.Application.ModelsDTOs.PTS;
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