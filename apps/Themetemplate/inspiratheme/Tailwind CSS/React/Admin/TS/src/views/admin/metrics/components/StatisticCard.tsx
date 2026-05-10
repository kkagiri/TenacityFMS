import { CountUp } from '@/components/wrappers/CountUp'
import EChart from '@/components/wrappers/EChart'
import { cn } from '@/utils/helpers'
import { PieChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { getStatisticChartOptions, StatisticCardType } from './data'

const StatisticCard = ({ item }: { item: StatisticCardType }) => {
  const { metric, count, title, badgeText, badgeColor } = item
  return (
    <div className="card">
      <div className="card-header flex border-b border-default-300 border-dashed justify-between items-center">
        <h5 className="card-title">{title}</h5>
        <span className={cn('badge', badgeColor)}> {badgeText}</span>
      </div>

      <div className="card-body">
        <div className="flex justify-between items-center">
          <EChart extensions={[PieChart, TooltipComponent, CanvasRenderer]} getOptions={getStatisticChartOptions} style={{ height: 60, width: 60 }} />
          <div className="text-end">
            <h3 className="mb-2.5 font-normal text-xl">
              <CountUp duration={1} prefix={count.prefix} suffix={count.suffix} end={count.value} decimals={Number.isInteger(count.value) ? 0 : 2} enableScrollSpy scrollSpyOnce />
            </h3>
            <p className="text-default-400">
              <span>{metric}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StatisticCard
