import { cn } from '@/utils/helpers'
import { activityData } from './data'

const Activity = () => {
  return (
    <>
      {activityData.map((activity, idx) => (
        <div className={cn('border-default-300 flex gap-1.5 border-b border-dashed pb-6', idx === 0 ? 'pb-6' : 'py-5')} key={idx}>
          <div className="me-3 shrink-0">
            <img src={activity.user.image} className="size-9 rounded-full" alt="" />
          </div>
          <div className="text-default-400 grow">
            <span className="text-default-700 text-sm font-medium">{activity.user.name}</span>&nbsp;
            {activity.action}
            <p className={cn('text-default-400 text-xs', activity.message && 'mb-2.5')}>{activity.datetime}</p>
            {activity.message && <div className="bg-light/50 px-5 py-2.5">&quot;{activity.message}&quot;</div>}
          </div>
          <p className="text-default-400 text-xs">{activity.time}</p>
        </div>
      ))}

      <div className="flex items-center justify-center gap-3 p-3 md:p-5">
        <strong>Loading...</strong>
        <div className="text-danger inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" role="status" aria-label="loading">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    </>
  )
}
export default Activity
