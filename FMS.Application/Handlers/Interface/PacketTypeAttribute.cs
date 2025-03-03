using System;

namespace FMS.Application.Handlers.Interface
{
    [AttributeUsage(AttributeTargets.Class, Inherited = false, AllowMultiple = false)]
    public sealed class PacketTypeAttribute : Attribute
    {
        public string Type { get; }

        public PacketTypeAttribute(string type)
        {
            Type = type;
        }
    }
}