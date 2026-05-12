using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace FMS.Domain.Entities.Util
{
    /// <summary>
    /// Helper class for enumerations
    /// </summary>
    public static class EnumerationHelper
    {
        /// <summary>
        /// Returns string description for enum value
        /// </summary>
        /// <param name="enumValue">Enum value</param>
        /// <returns>String description</returns>
        public static string GetEnumDescription(Enum enumValue)
        {
            string value = enumValue.ToString();
            FieldInfo field = enumValue.GetType().GetField(value);
            object[] objs = field.GetCustomAttributes(typeof(DescriptionAttribute), false);
            if (objs == null || objs.Length == 0)
                return value;
            DescriptionAttribute descriptionAttribute = (DescriptionAttribute)objs[0];
            return descriptionAttribute.Description;
        }
    }
}
