import { CountUp } from '@/components/wrappers/CountUp'
import EChart from '@/components/wrappers/EChart'
import { generateRandomEChartData, getColor } from '@/utils/helpers'
import clsx from 'clsx'
import { EChartsOption } from 'echarts'
import { PieChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { cardData } from './data'

export const getEchartOptions = (): EChartsOption => {
  const productData = generateRandomEChartData(['A', 'B', 'C'])

  return {
    tooltip: { show: false },
    series: [
      {
        type: 'pie',
        radius: ['65%', '100%'],
        label: { show: false },
        labelLine: { show: false },
        data: productData.map((item, index) => ({
          value: item.value,
          itemStyle: {
            color: index === 0 ? getColor('primary') : index === 1 ? getColor('secondary') : '#bbcae14d',
          },
        })),
      },
    ],
  }
}

const EcomStats = () => {
  return (
    <>
      {cardData.map((item, index) => (
        <div className="card" key={index}>
          <div className="card-header flex border-dashed justify-between items-center">
            <h5 className="card-title">{item.title}</h5>
            <span className={clsx('badge', item.badgeColor)}> {item.badgeText}</span>
          </div>
          <div className="card-body">
            <div className="flex justify-between items-center">
              <EChart extensions={[PieChart, TooltipComponent, CanvasRenderer]} getOptions={getEchartOptions} style={{ height: 60, width: 60 }} />
              <div className="text-end">
                <h3 className="mb-2.5 font-normal text-xl">
                  {item?.prefix}
                  <CountUp duration={1} decimals={Number.isInteger(item.targetValue) ? 0 : 2} end={item.targetValue} enableScrollSpy scrollSpyOnce />
                  {item?.suffix}
                </h3>
                <p className="text-default-400">
                  <span>{item.metric}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

export default EcomStats
