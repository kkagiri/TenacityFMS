using FMS.PTS.Common;
using FMS.PTS.DataStruct.enums;

namespace FMS.PTS.Util;

public class TTResultEx 
{
    public TTResult? Result { get; set; }    
 
    public List<IRequest>? RequestWithErrors {get;set;}
}