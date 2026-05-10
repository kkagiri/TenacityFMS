using Npgsql;
try {
  var b = new NpgsqlConnectionStringBuilder("Host=localhost;Port=5432;Database=tenacy_fms;Username=postgres;Password=Yummy2030!");
  System.Console.WriteLine($"OK Host={b.Host} User={b.Username}");
} catch (System.Exception ex) {
  System.Console.WriteLine($"FAIL: {ex.Message}");
  if (ex.InnerException != null) System.Console.WriteLine($"INNER: {ex.InnerException.GetType().Name}: {ex.InnerException.Message}");
}
