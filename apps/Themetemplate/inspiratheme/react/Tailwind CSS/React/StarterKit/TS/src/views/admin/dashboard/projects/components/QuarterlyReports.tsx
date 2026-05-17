import ComponentCard from '@/components/cards/ComponentCard'
import EChart from '@/components/wrappers/EChart'
import { PieChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getPieEchartOptions, quarterlyReports } from './data'

const QuarterlyReports = () => {
  return (
    <>
      <ComponentCard title="Quarterly Reports" badge={<span className="badge text-white bg-primary">IN+</span>} bodyClassName="p-0" isCloseable isCollapsible isRefreshable>
        <div className="p-0">
          <div className="table-wrapper whitespace-nowrap">
            <table className="table table-hover">
              <thead className="bg-light/25 thead-sm">
                <tr className="uppercase text-2xs">
                  <th className="text-default-400">Quarter</th>
                  <th className="text-default-400">Revenue</th>
                  <th className="text-default-400">Expense</th>
                  <th className="text-default-400">Margin</th>
                  <th className="text-default-400">•••</th>
                </tr>
              </thead>
              <tbody>
                {quarterlyReports.map((report, idx) => (
                  <tr key={idx}>
                    <td>
                      <h5 className="text-sm mb-1.25 font-normal">{report.quarter}</h5>
                      <span className="text-default-400 text-xs">{report.period}</span>
                    </td>
                    <td>{report.revenue}</td>
                    <td>{report.expense}</td>
                    <td>{report.margin}</td>
                    <td style={{ width: 60 }}>
                      <div dir="ltr">
                        <EChart extensions={[PieChart, TooltipComponent, CanvasRenderer]} getOptions={getPieEchartOptions} style={{ height: 30, width: 30 }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ComponentCard>
    </>
  )
}

export default QuarterlyReports
