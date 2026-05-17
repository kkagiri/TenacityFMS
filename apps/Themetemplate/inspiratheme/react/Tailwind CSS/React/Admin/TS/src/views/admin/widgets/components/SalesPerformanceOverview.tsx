import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { widget2Data } from './data'

const SalesPerformanceOverview = () => {
  return (
    <div className="card">
      <div className="p-5 bg-light/20 border-b border-dashed border-default-300">
        <div className="flex justify-between items-center">
          <div className="col">
            <h4 className="text-sm mb-1.25">Would you like the full report?</h4>
            <small className="text-default-400 text-xs">All 120 orders have been successfully delivered</small>
          </div>
          <div className="ms-auto">
            <div className="hs-tooltip [--placement:top] inline-block">
              <button type="button" className="hs-tooltip-toggle size-7.75 flex justify-center items-center rounded-full border border-default-300 text-default-700 hover:bg-default-50 hover:border-default-400 focus:outline-hidden">
                <Icon icon="download" className="text-xl"></Icon>
                <span
                  className="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible opacity-0 transition-opacity inline-block absolute invisible z-10 py-1 px-2 bg-default-800 border border-tooltip-line text-xs font-medium text-body-bg rounded-md shadow-2xs"
                  role="tooltip"
                >
                  Download
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-1.25 grid md:grid-cols-2 grid-cols-1 gap-1.25">
        {widget2Data.map((item, idx) => (
          <div key={idx} className={cn('card rounded-none border shadow-none border-dashed mb-0', item.className)}>
            <div className="card-body">
              <div className="mb-5 flex justify-between items-center">
                <h5 className="text-lg">
                  {item.count.prefix || ''}
                  {item.count.value}
                  {item.count.suffix && <small className="text-2xs">{item.count.suffix}</small>}
                </h5>
                <span className="flex items-center">
                  {item.percentage}%<Icon icon={item.percentageIcon} className={item.isPositive ? 'text-success' : 'text-danger'}></Icon>
                </span>
              </div>
              <p className="text-default-400 mb-2.5">
                <span>{item.title}</span>
              </p>
              <div className={cn('w-full rounded-full h-1.25 mb-1.25', item.progressBg)}>
                <div className={cn('h-1.25 rounded-full', item.progressClassName)} role="progressbar" style={{ width: `${item.percentage}%` }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center my-2.5">
        <a href="" className="hover:text-primary underline font-semibold link-offset-3 flex items-center justify-center">
          View all Links <Icon icon="link"></Icon>
        </a>
      </div>
    </div>
  )
}

export default SalesPerformanceOverview
