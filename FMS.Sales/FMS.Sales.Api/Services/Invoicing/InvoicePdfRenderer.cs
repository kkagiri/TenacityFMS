using System.Globalization;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using PuppeteerSharp;
using PuppeteerSharp.Media;

namespace FMS.Sales.Api.Services.Invoicing
{
    public sealed class InvoicePdfRenderer : IInvoicePdfRenderer
    {
        private readonly IPuppeteerBrowserPool _pool;

        public InvoicePdfRenderer(IPuppeteerBrowserPool pool)
        {
            _pool = pool;
        }

        public async Task<byte[]> RenderAsync(InvoicePdfModel model, CancellationToken cancellationToken)
        {
            var html = BuildHtml(model);

            var browser = await _pool.GetBrowserAsync(cancellationToken);
            await using var page = await browser.NewPageAsync();
            await page.SetContentAsync(html, new NavigationOptions
            {
                WaitUntil = new[] { WaitUntilNavigation.Networkidle0 },
            });

            return await page.PdfDataAsync(new PdfOptions
            {
                Format = PaperFormat.A4,
                PrintBackground = true,
                MarginOptions = new MarginOptions
                {
                    Top = "20mm",
                    Bottom = "20mm",
                    Left = "16mm",
                    Right = "16mm",
                },
            });
        }

        private static string BuildHtml(InvoicePdfModel m)
        {
            var ci = CultureInfo.InvariantCulture;
            var sb = new StringBuilder();
            sb.Append("<!DOCTYPE html><html><head><meta charset=\"utf-8\" />");
            sb.Append("<style>");
            sb.Append("body{font-family:Segoe UI,Arial,sans-serif;color:#313a46;font-size:12px;}");
            sb.Append("h1{font-size:20px;margin:0 0 4px;}");
            sb.Append(".muted{color:#676a6c;}");
            sb.Append(".grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0 24px;}");
            sb.Append("table{width:100%;border-collapse:collapse;margin-top:8px;}");
            sb.Append("th,td{padding:8px 10px;border-bottom:1px solid #e7e9eb;text-align:left;}");
            sb.Append("th{background:#f6f7fb;font-weight:600;}");
            sb.Append("td.num,th.num{text-align:right;}");
            sb.Append(".totals{margin-top:12px;width:280px;margin-left:auto;}");
            sb.Append(".totals td{padding:4px 8px;border:none;}");
            sb.Append(".totals tr.grand td{border-top:2px solid #313a46;font-weight:600;font-size:14px;}");
            sb.Append(".status{display:inline-block;padding:2px 10px;border-radius:10px;font-size:11px;background:#e7e9eb;}");
            sb.Append("</style></head><body>");

            sb.Append("<h1>Invoice ").Append(WebEncode(m.InvoiceNumber)).Append("</h1>");
            sb.Append("<div class=\"muted\">Status: <span class=\"status\">").Append(WebEncode(m.Status)).Append("</span></div>");

            sb.Append("<div class=\"grid\">");
            sb.Append("<div><strong>Billed to (tenant)</strong><br/>")
              .Append(m.TenantId).Append("</div>");
            sb.Append("<div><strong>Issued</strong> ").Append(m.IssuedAtUtc.ToString("yyyy-MM-dd", ci))
              .Append("<br/><strong>Due</strong> ").Append(m.DueAtUtc.ToString("yyyy-MM-dd", ci))
              .Append("<br/><strong>Period</strong> ").Append(m.PeriodStartUtc.ToString("yyyy-MM-dd", ci))
              .Append(" &rarr; ").Append(m.PeriodEndUtc.ToString("yyyy-MM-dd", ci))
              .Append("</div></div>");

            sb.Append("<table><thead><tr><th>Description</th><th class=\"num\">Qty</th><th class=\"num\">Unit</th><th class=\"num\">Amount</th></tr></thead><tbody>");
            foreach (var line in m.Lines)
            {
                sb.Append("<tr><td>").Append(WebEncode(line.Description)).Append("</td>")
                  .Append("<td class=\"num\">").Append(line.Quantity.ToString(ci)).Append("</td>")
                  .Append("<td class=\"num\">").Append(line.UnitPrice.ToString("N2", ci)).Append("</td>")
                  .Append("<td class=\"num\">").Append(line.Amount.ToString("N2", ci)).Append("</td></tr>");
            }
            sb.Append("</tbody></table>");

            sb.Append("<table class=\"totals\">");
            sb.Append("<tr><td>Subtotal</td><td class=\"num\">").Append(m.Subtotal.ToString("N2", ci)).Append(" ").Append(WebEncode(m.CurrencyCode)).Append("</td></tr>");
            sb.Append("<tr><td>Discount</td><td class=\"num\">-").Append(m.DiscountAmount.ToString("N2", ci)).Append("</td></tr>");
            sb.Append("<tr><td>Tax</td><td class=\"num\">").Append(m.TaxAmount.ToString("N2", ci)).Append("</td></tr>");
            sb.Append("<tr class=\"grand\"><td>Total</td><td class=\"num\">").Append(m.Total.ToString("N2", ci)).Append(" ").Append(WebEncode(m.CurrencyCode)).Append("</td></tr>");
            sb.Append("<tr><td>Paid</td><td class=\"num\">").Append(m.AmountPaid.ToString("N2", ci)).Append("</td></tr>");
            sb.Append("</table>");

            sb.Append("</body></html>");
            return sb.ToString();
        }

        private static string WebEncode(string s)
            => System.Net.WebUtility.HtmlEncode(s ?? string.Empty);
    }
}
