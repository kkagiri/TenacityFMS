import { CountUp } from '@/components/wrappers/CountUp'
import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { Widget4Type } from './data'

const Widget3 = ({ item }: { item: Widget4Type }) => {
  const { count, label, description, className, title, icon } = item

  return (
    <>
      <div className="card">
        <div className="card-header flex border-dashed justify-between items-center">
          <h5 className="card-title">{title}</h5>
          <span className={cn('badge', className)}> {label}</span>
        </div>
        <div className="card-body">
          <div className="flex justify-between items-center">
            <div className="">
              <span className="size-15 flex justify-center items-center rounded-full bg-dark text-white">
                <Icon icon={icon} className="size-8"></Icon>
              </span>
            </div>
            <div className="text-end">
              <h3 className="mb-2.5 font-normal text-xl">
                <CountUp end={count.value} prefix={count.prefix} suffix={count.suffix} duration={1} decimals={Number.isInteger(count.value) ? 0 : 2} enableScrollSpy scrollSpyOnce />
              </h3>
              <p className="text-default-400">{description}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Widget3
