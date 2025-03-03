
using System;
using System.ComponentModel;
using System.Reflection;

public static class EnumExtensions
{
    public static string GetDescription(this Enum value)
    {
        // Get the field info for this enum value
        FieldInfo field = value.GetType().GetField(value.ToString());

        // Return default enum string if field not found
        if (field == null) return value.ToString();

        // Get the DescriptionAttribute
        DescriptionAttribute attribute = field.GetCustomAttribute<DescriptionAttribute>();

        // Return the description if attribute exists, otherwise return enum string
        return attribute?.Description ?? value.ToString();
    }
}

