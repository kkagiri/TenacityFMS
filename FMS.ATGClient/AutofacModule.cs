using Autofac;
using FMS.PTS;

namespace FMS.ATGClient
{
    public class AutofacModule:Module
    {
        protected override void Load(ContainerBuilder builder)
        {
            builder.RegisterType<Device>().SingleInstance();           
        }
    }
}
