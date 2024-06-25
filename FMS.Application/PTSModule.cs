using Autofac;
using FMS.PTS;
namespace FMS.Application;

public class PTSModule: Module 
{
    protected override void Load(ContainerBuilder builder)
    {
        builder.RegisterType<PTSCommunicationService>().AsSelf().SingleInstance();
        builder.RegisterType<Device>().AsSelf().SingleInstance();
        
    }
}