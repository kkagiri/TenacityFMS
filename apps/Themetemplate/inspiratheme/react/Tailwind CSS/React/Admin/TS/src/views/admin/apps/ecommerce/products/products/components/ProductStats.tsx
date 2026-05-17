import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { Link } from 'react-router'
import CountUp from 'react-countup'
import type { StatType } from './data'

const ProductStats = ({ stat }: { stat: StatType }) => {
  const { bulletClassName, change, icon, iconClassName, metric, metricValue, title, value, prefix, suffix } = stat
  return (
    <div className="card">
      <div className="card-body">
        <div className="mb-2 flex items-center justify-between">
          <h5 title="Number of Tasks" className="card-title text-sm">
            {title}
          </h5>
          <Link to="" className="-mt-1.5">
            <Icon icon="external-link" className="text-default-400 text-lg" />
          </Link>
        </div>
        <div className="my-5 flex items-center gap-2.5">
          <div className={cn('size-9 flex items-center justify-center rounded-full  text-white', iconClassName)}>
            <Icon icon={icon} className="size-5.5 text-2xl" />
          </div>
          <h3 className="text-xl">
            <CountUp start={0} end={value} prefix={prefix ?? ''} duration={1} suffix={suffix ?? ''} decimals={Number.isInteger(value) ? 0 : 2} />
          </h3>
          <span className={cn('ms-auto badge py-0 text-xs font-medium', change > 0 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger')}>
            {change > 0 ? '+' : ''} {change} New
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className={cn('text-primary flex items-center gap-1', bulletClassName)}>
              <Icon icon="circle-filled" className="align-middle" />
            </span>
            <span className="text-default-400 text-sm">{metric}</span>
          </div>
          <span className="font-semibold">{metricValue}</span>
        </div>
      </div>
    </div>
  )
}

export default ProductStats
