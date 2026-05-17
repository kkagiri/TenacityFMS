import { CountUp } from '@/components/wrappers/CountUp'
import EChart from '@/components/wrappers/EChart'
import Icon from '@/components/wrappers/Icon'
import { META_DATA } from '@/config/constants'
import clsx from 'clsx'
import { LineChart, PieChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Suspense } from 'react'
import { activityItems, getProgressChartOptions, getRevenueChartOptions } from './data'

const WelcomeRevenueProgress = () => {
  return (
    <>
      <div className="grid xl:grid-cols-4 grid-cols-1">
        <div className="col-span-1">
          <div className="p-7.5 border-e border-dashed border-default-300">
            <h4 className="text-base mb-1.25">Welcome to {META_DATA.name.toUpperCase()}+ Admin Theme.</h4>
            <span className="text-default-400">
              You have <span className="text-primary font-semibold">42</span> messages and 6 notifications.
            </span>
            <ul className="mt-5">
              {activityItems.map((item, idx) => (
                <li className="flex justify-between items-center py-2.5" key={idx}>
                  <div>
                    <span className={clsx('badge size-6 me-3.25', item.className)}>
                      <span className="font-medium text-sm">{idx + 1}</span>
                    </span>
                    {item.text}
                  </div>
                  <span className="text-default-400">{item.time}</span>
                </li>
              ))}
            </ul>
            <div className="text-center mt-2.5">
              <a href="" className="btn bg-secondary text-white rounded-full hover:bg-secondary-hover">
                View Messages
              </a>
            </div>
          </div>
        </div>
        <div className="col-span-2">
          <div className="py-5 px-7.5 border-e border-dashed border-default-300">
            <div className="flex justify-between mb-5">
              <h4 className="card-title">Revenue</h4>
              <a href="" className="hover:text-primary underline font-semibold flex gap-1 items-center">
                View Reports <Icon icon="arrow-right" />
              </a>
            </div>
            <div className="grid grid-cols-2 gap-base text-center mb-5">
              <div className="col">
                <div className="bg-light/50 p-2.5">
                  <h5>
                    <span className="text-default-400">Total Revenue:</span>$ <CountUp start={0} end={40} duration={1} />M
                  </h5>
                </div>
              </div>
              <div className="col">
                <div className="bg-light/50 p-2.5">
                  <h5>
                    <span className="text-default-400">Total Orders:</span> <CountUp start={0} end={50.9} duration={1} decimals={2} />k
                  </h5>
                </div>
              </div>
            </div>
            <div dir="ltr" className="relative">
              <div className="py-2.5 px-5 rounded bg-light/30 border-dashed border border-default-300 text-primary z-10 absolute" style={{ top: '4.5%', left: '12%' }}>
                <p className="mb-2 uppercase text-2xs font-semibold">Growth Rate</p>
                <h4 className="text-lg font-bold text-primary flex gap-1">
                  89.24% <Icon icon="trending-up" />
                </h4>
              </div>
              <Suspense>
                <EChart extensions={[LineChart, TooltipComponent, CanvasRenderer]} getOptions={getRevenueChartOptions} style={{ height: 252 }} />
              </Suspense>
            </div>
          </div>
        </div>
        <div className="col-span-1">
          <div className="card-body">
            <h4 className="card-title mb-1.25">Project Progress</h4>
            <p className="text-default-400 text-xs">You have 21 projects with not completed task.</p>
            <div className="mt-7.5">
              <div dir="ltr">
                <EChart extensions={[PieChart, TooltipComponent, CanvasRenderer]} getOptions={getProgressChartOptions} style={{ height: 278 }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default WelcomeRevenueProgress
