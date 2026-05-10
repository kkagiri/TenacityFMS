using System.Reflection;
var assembly = typeof(DevExpress.AspNetCore.Reporting.ReportDesigner.ReportDesignerController).Assembly;
var baseType = typeof(DevExpress.AspNetCore.Reporting.ReportDesigner.ReportDesignerController);
Console.WriteLine($\"Type: {baseType.FullName}\");
Console.WriteLine($\"IsAbstract: {baseType.IsAbstract}\");
Console.WriteLine($\"IsSealed: {baseType.IsSealed}\");
foreach(var attr in baseType.GetCustomAttributes(true)) {
    Console.WriteLine($\"Attribute: {attr.GetType().Name}\");
}
foreach(var method in baseType.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.DeclaredOnly)) {
    Console.WriteLine($\"Method: {method.Name}\");
}
