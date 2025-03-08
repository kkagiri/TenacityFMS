using System;
using System.IO;
using System.Text.RegularExpressions;

class Program
{
    static void Main()
    {
        string configDir = "FMS.Persistence/EntityConfigurations";
        foreach (string file in Directory.GetFiles(configDir, "*Configuration.cs", SearchOption.AllDirectories))
        {
            try
            {
                string content = File.ReadAllText(file);
                if (!content.Contains("try") && (content.Contains("public void Configure") || content.Contains("public override void Configure")))
                {
                    // Add System using if not present
                    if (!content.Contains("using System;"))
                    {
                        content = Regex.Replace(content,
                            @"(using.*?\r?\n)+",
                            "$&using System;\r\n");
                    }

                    // Add try-catch block for both regular and override Configure methods
                    content = Regex.Replace(content,
                        @"(public (?:override )?void Configure\(EntityTypeBuilder<.*?> builder\)\s*{)((?:.|\n)*?)(}\s*}(?:\s*})?$)",
                        $"$1\n            try\n            {{$2\n            }}\n            catch (Exception ex)\n            {{\n                throw new Exception($\"Error configuring {Path.GetFileNameWithoutExtension(file)}: {{ex.Message}}\", ex);\n            }}\n        }}",
                        RegexOptions.Singleline);

                    File.WriteAllText(file, content);
                    Console.WriteLine($"Updated {Path.GetFileName(file)}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error processing {Path.GetFileName(file)}: {ex.Message}");
            }
        }
    }
}