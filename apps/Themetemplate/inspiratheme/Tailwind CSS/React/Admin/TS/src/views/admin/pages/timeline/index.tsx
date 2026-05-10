import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { basicTimelineData, borderTimelineData, iconTimelineData, userTimelineData } from './components/data'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Timeline" subtitle="Pages" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Basic Timeline</h4>
          </div>
          <div className="card-body">
            <div>
              {basicTimelineData.map((item, idx) => (
                <div className="flex gap-x-base" key={idx}>
                  <div className="w-15 text-end md:w-25">
                    <span className="text-default-400">{item.time}</span>
                  </div>
                  <div className={cn('after:border-default-300 relative after:absolute after:start-1/2 after:top-3 after:bottom-0 after:w-px after:border-e -ms-px after:border-dashed last:after:hidden', idx === basicTimelineData.length - 1 ? 'after:hidden' : '')}>
                    <div className="relative z-10 flex items-center justify-center">
                      <div className={cn('ms-0.5 size-3.25 rounded-full', item.className)} />
                    </div>
                  </div>
                  <div className={`flex-1 ${idx != basicTimelineData.length - 1 ? 'pb-7.5' : ''}`}>
                    <h5 className="mb-1.25">{item.title}</h5>
                    <p className="text-default-400 mb-1.25">{item.description}</p>
                    <span className="text-primary font-semibold">By {item.author}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Timeline with Icons</h4>
          </div>
          <div className="card-body">
            <div>
              {iconTimelineData.map((item, idx) => (
                <div className="flex gap-x-base" key={idx}>
                  <div className="w-15 text-end md:w-25">
                    <span className="text-default-400">{item.time}</span>
                  </div>
                  <div className={cn('after:border-default-300 relative after:absolute after:start-1/2 after:top-3 after:bottom-0 after:w-px after:border-e -ms-px after:border-dashed last:after:hidden', idx === iconTimelineData.length - 1 ? 'after:hidden' : '')}>
                    <div className="relative z-10 flex items-center justify-center">
                      {item.className && item.icon && (
                        <div className={cn('flex size-7.5 items-center justify-center rounded-full', item.className)}>
                          <Icon icon={item.icon} className={cn('text-lg', item.iconClassName)} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`flex-1 ${idx != iconTimelineData.length - 1 ? 'pb-7.5' : ''}`}>
                    <h5 className="mb-1.25">{item.title}</h5>
                    <p className="text-default-400 mb-1.25">{item.description}</p>
                    <span className="text-primary font-semibold">By {item.author}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Timeline with Border</h4>
          </div>
          <div className="card-body">
            <div>
              {userTimelineData.map((item, idx) => (
                <div className="flex gap-x-base" key={idx}>
                  <div className="w-15 text-end md:w-25">
                    <span className="text-default-400">{item.time}</span>
                  </div>
                  <div className={cn('after:border-default-300 relative after:absolute after:start-1/2 after:top-3 after:bottom-0 after:w-px after:border-e -ms-px after:border-dashed last:after:hidden', idx === userTimelineData.length - 1 ? 'after:hidden' : '')}>
                    <div className="relative z-10 flex items-center justify-center">
                      {item.icon && (
                        <div className="border-default-300 flex size-7.5 items-center justify-center rounded-full border border-dashed">
                          <Icon icon={item.icon} className="text-default-400 text-lg" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`flex-1  ${idx != userTimelineData.length - 1 ? 'pb-7.5' : ''}`}>
                    <h5 className="mb-1.25">{item.title}</h5>
                    <p className="text-default-400 mb-1.25">{item.description}</p>
                    <span className="text-primary font-semibold">By {item.author}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Timeline with Users</h4>
          </div>
          <div className="card-body">
            <div>
              {borderTimelineData.map((item, idx) => (
                <div className="flex gap-x-base" key={idx}>
                  <div className={cn('after:border-default-300 relative after:absolute after:start-1/2 after:top-3 after:bottom-0 after:w-px after:border-e -ms-px after:border-dashed last:after:hidden', idx === borderTimelineData.length - 1 ? 'after:hidden' : '')}>
                    {item.image && (
                      <div className="relative z-10">
                        <img src={item.image} alt="avatar-1" className="size-7.5 rounded-full" />
                      </div>
                    )}
                  </div>
                  <div className={`flex-1 ${idx != borderTimelineData.length - 1 ? 'pb-7.5' : ''}`}>
                    <h5 className="mb-1.25">{item.title}</h5>
                    <p className="text-default-400 mb-1.25">{item.description}</p>
                    <span className="text-primary font-semibold">By {item.author}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
