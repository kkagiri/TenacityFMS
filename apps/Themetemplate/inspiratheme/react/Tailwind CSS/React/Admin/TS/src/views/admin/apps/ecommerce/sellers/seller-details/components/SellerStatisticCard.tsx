import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { SellerStatType } from './data'

const SellerStatisticCard = ({ item }: { item: SellerStatType }) => {
  const { value, prefix, suffix, totalCount, subTitle, bulletClassName, iconClassName, title, icon } = item
  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h5 title="Number of Tasks" className="card-title text-sm">
            {title}
          </h5>
        </div>
        <div className="mt-5 mb-2.5 flex items-center gap-2.5">
          <div className={cn('size-9 flex items-center justify-center rounded-full', iconClassName)}>
            <Icon icon={icon} className="size-5.5 text-white" />
          </div>
          <h3 className="text-xl">
            {prefix}
            {value}
            {suffix}
          </h3>
        </div>
        <div className="text-default-400 flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <span className={cn('flex items-center gap-1', bulletClassName)}>
              <Icon icon="circle-filled" className="align-middle" />
            </span>
            <span>{subTitle}</span>
          </div>
          <span className="font-semibold text-default-800">{totalCount}</span>
        </div>
      </div>
    </div>
  )
}
export default SellerStatisticCard
