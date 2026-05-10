import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Chart1, Chart2, Chart3, Chart4, Chart5, Chart6, Chart7, Chart8, Spark1, Spark2, Spark3 } from './components/SparkLineChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Sparkline Apexcharts" subtitle="Charts" />
      <div className="container-fluid">
        <div className="card">
          <div className="card-body">
            <div dir="ltr">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-base">
                <Spark1 />
                <Spark2 />
                <Spark3 />
              </div>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead className="thead-sm bg-light/25 text-xs uppercase">
                <tr>
                  <th>Total Value</th>
                  <th>Percentage of Portfolio</th>
                  <th>Last 10 days</th>
                  <th>Volume</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>$32,554</td>
                  <td>15%</td>
                  <td>
                    <Chart1 />
                  </td>
                  <td>
                    <Chart5 />
                  </td>
                </tr>
                <tr>
                  <td>$23,533</td>
                  <td>7%</td>
                  <td>
                    <Chart2 />
                  </td>
                  <td>
                    <Chart6 />
                  </td>
                </tr>
                <tr>
                  <td>$54,276</td>
                  <td>9%</td>
                  <td>
                    <Chart3 />
                  </td>
                  <td>
                    <Chart7 />
                  </td>
                </tr>
                <tr>
                  <td>$11,533</td>
                  <td>2%</td>
                  <td>
                    <Chart4 />
                  </td>
                  <td>
                    <Chart8 />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
