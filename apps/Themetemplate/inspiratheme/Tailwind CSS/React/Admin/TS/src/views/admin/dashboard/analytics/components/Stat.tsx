import { CountUp } from '@/components/wrappers/CountUp'
import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { statsData } from './data'

const Stat = () => {
  return (
    <>
      {statsData.map((item, idx) => (
        <div className={clsx('p-5 rounded border border-default-300 border-dashed', idx === 0 ? 'm-1.25' : 'mt-0 m-1.25')} key={idx}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="mb-1.25 text-xl flex gap-1">
                <CountUp start={0} end={item.target} duration={2} suffix={item.suffix} decimals={2} />
                <span className={clsx('text-sm flex items-center gap-1', item.trend.type === 'up' ? 'text-success' : 'text-danger')}>
                  {item.change > 0 ? '+' : ''}
                  {item.change}% <Icon icon={item.trend.icon} />
                </span>
              </h3>
              <p className="text-default-400">{item.label}</p>
            </div>
            <div>
              <span className="size-12 flex justify-center items-center bg-light rounded-full">
                <Icon icon={item.icon} className="text-2xl text-default-400" />
              </span>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

export default Stat
