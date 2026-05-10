import { CountUp } from '@/components/wrappers/CountUp'
import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { Widget7Type } from './data'

const Widget6 = ({ item }: { item: Widget7Type }) => {
  const { count, className, title, icon } = item

  return (
    <>
      <div className="card">
        <div className="card-body">
          <div className="mb-5">
            <span className={cn('size-12 flex justify-center items-center  rounded-full', className)}>
              <Icon icon={icon} className="text-2xl"></Icon>
            </span>
          </div>
          <h3 className="mb-1.25 text-xl">
            <CountUp prefix={count.prefix} suffix={count.suffix} end={count.value} duration={1} enableScrollSpy scrollSpyOnce />
          </h3>
          <p className="text-default-400">{title}</p>
        </div>
      </div>
    </>
  )
}

export default Widget6
