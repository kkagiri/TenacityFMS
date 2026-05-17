import { CountUp } from '@/components/wrappers/CountUp'
import EChart from '@/components/wrappers/EChart'
import { cn } from '@/utils/helpers'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { StatisticsWithChartType } from './data'

const getExtensions = (chartType: any) => {
  const map: any = {
    pie: PieChart,
    line: LineChart,
    bar: BarChart,
  }
  const chartExtension: any = map[chartType] ? [map[chartType]] : []
  return [...chartExtension, TooltipComponent, CanvasRenderer]
}

const StatisticWidgetChartRight = ({ item }: { item: StatisticsWithChartType }) => {
  const { count, chartHeight, chartOptions, chartWidth, badge, description, title, ChartType } = item
  return (
    <div className="card">
      <div className="card-header flex justify-between items-center border-0">
        <h5 className="card-title">{title}</h5>
        <span className={cn('badge', badge.className)}> {badge.text}</span>
      </div>
      <div className="card-body">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="mb-1.25 font-normal text-xl">
              <CountUp end={count.value} prefix={count.prefix} suffix={count.suffix} start={0} duration={1} />
            </h3>
            <p className="text-default-400">
              <span>{description}</span>
            </p>
          </div>
          {chartOptions() && <EChart extensions={getExtensions(ChartType)} getOptions={chartOptions} style={{ height: chartHeight, width: chartWidth }} />}
        </div>
      </div>
    </div>
  )
}

export default StatisticWidgetChartRight
