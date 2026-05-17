import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { Link } from 'react-router'
import { expandedActivityData } from './data'

export const ExpandedActivity = () => {
  return (
    <div className="card h-full">
      <div className="card-header">
        <h4 className="card-title">Expended Activity Stream</h4>
      </div>

      <div className="card-body">
        <div>
          {expandedActivityData.map((event, idx) => {
            return (
              <div className="flex gap-x-base" key={idx}>
                <div className={cn('after:border-default-300 relative after:absolute after:start-1/2 after:top-7 after:bottom-0 after:w-px after:border-e -ms-px after:border-dashed last:after:hidden', idx === 7 ? 'after:hidden' : '')}>
                  <div className="relative z-10 flex items-center justify-center">
                    <div className="border-default-300 flex size-7.5 items-center justify-center rounded-full border border-dashed">
                      <Icon icon={event.icon} className={cn(' text-lg', event.iconClassName)} />
                    </div>
                  </div>
                </div>

                <div className="flex-1 pb-5">
                  <div className="flex justify-between">
                    <h5 className="mb-1.25">
                      {event.title}
                      <span className={cn('badge badge-label ms-2.5', event.badge.className)}>{event.badge.label}</span>
                    </h5>
                    <span className="text-default-400 text-xs">{event.time}</span>
                  </div>
                  <p className="text-default-400 mb-1.25">{event.description}</p>
                  <div className="flex items-center gap-2.5">
                    <img src={event.user.image} alt="Natalie Brooks" className="size-4 rounded-full" />
                    <Link to="" className="hover:text-primary font-semibold">
                      {event.user.name}
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default ExpandedActivity
