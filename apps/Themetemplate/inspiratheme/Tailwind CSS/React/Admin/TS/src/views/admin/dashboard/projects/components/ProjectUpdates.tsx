import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { timelineEvents } from './data'

const ProjectUpdates = () => {
  return (
    <>
      <div className="card">
        <div className="card-header justify-between items-center">
          <h5 className="card-title">Latest Project Updates</h5>
          <span className="badge text-white bg-warning text-2xs"> 8 Notifications</span>
        </div>
        <div className="card-body">
          {timelineEvents.map((event, idx) => (
            <div className="flex gap-x-base" key={idx}>
              <div className="after:border-default-300 relative after:absolute after:start-1/2 after:top-8 after:bottom-0 after:w-px after:border-e -ms-px after:border-dashed last:after:hidden">
                <div className="relative z-10 flex items-center justify-center">
                  <div className="border-default-300 flex size-7.75 items-center justify-center rounded-full border border-dashed">
                    <Icon icon={event.icon} className={clsx('text-xl', event.iconColor)} />
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <h5 className="mb-1.25 text-sm">
                    {event.title} <span className={clsx('badge badge-label ms-2.5 text-[10px]', event.tagVariant)}>{event.tag}</span>
                  </h5>
                  <span className="text-default-400 text-2xs">{event.time}</span>
                </div>
                <p className="mb-1.25 text-default-400">{event.description}</p>
                <div className="flex items-center gap-2.5">
                  <img src={event.userImage} alt={event.userName} className="rounded-full size-4" width={16} height={16} />
                  <a href="" className="font-medium text-default-400">
                    {event.userName}
                  </a>
                </div>
                {event.hasDivider && <hr className="border-dashed border-t border-default-300 my-3" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default ProjectUpdates
