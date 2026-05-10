import { CountUp } from '@/components/wrappers/CountUp'
import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
const RefundStatisticCard = ({ item }) => {
  const { icon, badgeClassName, iconClassName, title, change, value } = item
  return (
    <div className="card">
      <div className="card-body">
        <div className="mb-5 flex items-center gap-2.5">
          <div className={cn('size-9 flex items-center justify-center bg-primary rounded-full', iconClassName)}>
            <Icon icon={icon} className="size-5.5 text-white" />
          </div>
          <h3 className="text-xl">
            <CountUp start={0} end={value} duration={1} />
          </h3>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span>{title}</span>
          </div>
          <span className={cn('badge font-semibold', badgeClassName)}>
            {change > 0 ? '+' : ''}
            {change}%
          </span>
        </div>
      </div>
    </div>
  )
}
export default RefundStatisticCard
