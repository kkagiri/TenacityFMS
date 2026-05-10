import { cn, toPascalCase } from '@/utils/helpers'
import { Link } from 'react-router'
import { basicActivityData } from './data'

const BasicActivity = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Basic Activity Stream</h4>
      </div>

      <div className="card-body">
        {basicActivityData.map((activity, idx) => (
          <div className={cn('flex items-center gap-base', idx === 0 ? 'pb-2.5' : 'py-2.5')} key={idx}>
            <span className={cn('badge badge-label  text-white', activity.variant)}>{toPascalCase(activity.status)}</span>
            <span className="text-default-400">{activity.time}</span>
            <Link to="" className="hover:text-primary flex items-center gap-1.5 font-semibold">
              <img src={activity.user.image} alt="" className="size-4 rounded-full" />
              {activity.user.name}
            </Link>
            {activity.action}
          </div>
        ))}
      </div>
    </div>
  )
}
export default BasicActivity
