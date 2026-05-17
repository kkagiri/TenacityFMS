import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { Widget1Type } from './data'

const Widget1 = ({ widget }: { widget: Widget1Type }) => {
  const { title, totalCount, count, variant, description, className, iconClassName } = widget
  return (
    <div className={cn('card border-0 shadow-none', className)}>
      <div className="card-body">
        <h5 title="Revenue Earned">{title}</h5>
        <div className="flex items-center gap-2.5 my-5">
          <div className="shrink-0">
            <span className={cn('text-white rounded-full size-9 flex justify-center items-center', iconClassName)}>
              <Icon icon={widget.icon} className="size-5.5"></Icon>
            </span>
          </div>
          <h3 className="text-xl">
            {count.prefix && count.prefix}
            {count.value}
            {count.suffix && count.suffix}
          </h3>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon icon="point-filled" className={`text-${variant}`} />
            <span className="text-nowrap text-default-400">{description}</span>
          </div>

          <span>
            <b>{totalCount}</b>
          </span>
        </div>
      </div>
    </div>
  )
}

export default Widget1
