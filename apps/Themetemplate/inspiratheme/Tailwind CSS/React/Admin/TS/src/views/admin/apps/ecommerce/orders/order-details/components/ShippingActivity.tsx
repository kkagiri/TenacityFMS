import { cn } from '@/utils/helpers'
import { Link } from 'react-router'
import { shippingTimelineData } from './data'

const ShippingActivity = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Shipping Activity</h4>
      </div>
      <div className="card-body p-7.5">
        <div>
          {shippingTimelineData.map((item, idx) => (
            <div className="flex gap-x-base" key={idx}>
              <div className="w-15 text-end md:w-25">
                <span className="text-default-400">{item.time}</span>
              </div>
              <div className={cn('after:border-default-300 relative after:absolute after:start-1/2 after:top-4 after:bottom-0 after:w-px after:border-e -ms-px after:border-dashed last:after:hidden', idx === shippingTimelineData.length - 1 ? 'after:hidden' : '')}>
                <div className="relative z-10 flex items-center justify-center">
                  <div className={`size-3.5 rounded-full ${idx === 0 ? 'bg-light' : 'bg-success'}`} />
                </div>
              </div>
              <div className={`flex-1 ${idx === shippingTimelineData.length - 1 ? '' : 'pb-15'}`}>
                <h5 className="mb-1.25">{item.title}</h5>
                <p className="text-default-400 mb-1.25">{item.description}</p>
                <p className="text-default-400 mb-1.25 text-2xs">
                  Tracking No:
                  <Link to="" className="text-primary underline">
                    {item.trackingNo}
                  </Link>
                </p>
                <span className="text-xs font-semibold">By {item.trackingBy}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ShippingActivity
