import { CountUp } from '@/components/wrappers/CountUp'
import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
const Stat = ({ item, idx }) => {
  return (
    <>
      <div className={clsx('p-3 rounded m-1 border border-dashed', idx !== 0 && 'mt-xxl-0 ')}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h3 className="mb-1">
              <CountUp start={0} end={item.target} duration={2} suffix={item.suffix} decimals={2} />
              &nbsp;
              <span className={clsx('fs-base', item.trend.type === 'up' ? 'text-success' : 'text-danger')}>
                {item.change > 0 ? '+' : ''}
                {item.change}% <Icon icon={item.trend.icon} />
              </span>
            </h3>
            <p className="mb-0 text-muted">{item.label}</p>
          </div>
          <div className="avatar-xl">
            <span className="avatar-title text-bg-light rounded-circle">
              <Icon icon={item.icon} className="fs-2 text-muted" />
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
export default Stat
