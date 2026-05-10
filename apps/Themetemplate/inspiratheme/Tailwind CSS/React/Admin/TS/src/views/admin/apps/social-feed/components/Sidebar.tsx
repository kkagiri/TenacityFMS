import user7 from '@/assets/images/users/user-7.jpg'
import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { Link } from 'react-router'
import { activityData, requestData, trendingData } from './data'

const Sidebar = () => {
  return (
    <div className="flex gap-base flex-col">
      <ActivityCard />
      <TrendingCard />
      <RequestsCard />
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Featured Video For You</h4>

          <div className="relative ms-auto">
            <div className="hs-dropdown relative inline-flex [--placement:bottom-right]">
              <button type="button" className="hs-dropdown-toggle" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
                <Icon icon="dots-vertical" className="text-default-400 text-base" />
              </button>

              <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
                <div className="space-y-0.5">
                  <a className="dropdown-item" href="">
                    Watch leter
                  </a>

                  <a className="dropdown-item" href="">
                    <Icon icon="trash" />
                    Report video
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card-body">
          <div className="relative w-full overflow-hidden rounded pt-[56.25%]">
            <iframe src="https://player.vimeo.com/video/357274789" allowFullScreen className="absolute start-0 top-0 h-full w-full rounded"></iframe>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar

const ActivityCard = () => {
  return (
    <div className="card">
      <div className="card-body">
        <div className="mb-base flex items-center justify-between">
          <h5>Activity</h5>
          <a href="" className="text-sm hover:text-primary">
            See all
          </a>
        </div>

        <div className="mb-5">
          <small className="text-default-400 uppercase">Stories About You</small>

          <div className="mt-2.5 flex items-center">
            <img src={user7} className="me-2.5 size-8 rounded-full" alt="mention" />
            <div>
              <strong>Mentions</strong>
              <br />
              <span className="text-default-400 text-2xs">3 stories mention you</span>
            </div>
          </div>
        </div>

        <span className="text-default-400 text-xs font-bold uppercase">New</span>

        <ul className="mt-2.5">
          {activityData.map((item, index) => (
            <li key={index} className="flex items-center py-1.25">
              <img src={item.user.image} alt={item.user.name} className="me-2.5 size-9 rounded-full" />

              <div className="grow">
                <strong>{item.user.name}</strong> {item.message}
                <br />
                <span className="text-xs text-default-400">{item.time}</span>
              </div>

              {item.image ? (
                <img src={item.image} alt="activity" className="h-8 w-8 rounded" />
              ) : (
                <div className="text-base text-primary">
                  <Icon icon="user-plus" />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const TrendingCard = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Trending</h4>

        <div className="relative ms-auto">
          <div className="hs-dropdown relative inline-flex [--placement:bottom-right]">
            <button type="button" className="hs-dropdown-toggle" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
              <Icon icon="dots-vertical" className="text-default-400 text-base" />
            </button>

            <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
              <div className="space-y-0.5">
                <Link className="dropdown-item" to="">
                  <Icon icon="refresh" />
                  Refresh Feed
                </Link>

                <Link className="dropdown-item" to="">
                  <Icon icon="settings" />
                  Manage Topics
                </Link>

                <Link className="dropdown-item" to="">
                  <Icon icon="alert-circle" />
                  Report issue
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card-body">
        {trendingData.map((item, idx) => (
          <div key={idx} className={cn('flex', { 'mb-base': idx !== trendingData.length - 1 })}>
            <div>
              <Icon icon="trending-up" className="text-primary me-3 mt-1.5 size-3.5"></Icon>
            </div>

            {item.href ? (
              <Link to={item.href} className="hover:text-primary">
                <strong>{item.title}</strong> {item.description}
              </Link>
            ) : (
              <Link to="" className="hover:text-primary">
                <strong>{item.title}</strong> {item.description}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const RequestsCard = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Requests</h4>
        <div className="relative ms-auto">
          <div className="hs-dropdown relative inline-flex [--placement:bottom-right]">
            <button type="button" className="hs-dropdown-toggle" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
              <Icon icon="dots-vertical" className="text-default-400 text-base" />
            </button>

            <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
              <div className="space-y-0.5">
                <Link className="dropdown-item" to="">
                  <Icon icon="check" />
                  Mark All as Read
                </Link>

                <Link className="dropdown-item" to="">
                  <Icon icon="trash" />
                  Clear All
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card-body">
        {requestData.map((item, idx) => (
          <div key={idx} className={`flex items-center justify-between ${idx !== requestData.length - 1 ? 'mb-5' : ''}`}>
            <div className="flex items-start">
              {item.image ? (
                <img src={item.image} alt={item.title} className="me-2.5 size-6 rounded-full" />
              ) : (
                <div>
                  <div className={cn('me-2.5 flex size-6 items-center justify-center rounded-full text-white', item.iconClassName)}>{item.icon && <Icon icon={item.icon} />}</div>
                </div>
              )}

              <div>
                <p className="mb-1.25">
                  <strong>{item.title}</strong> {item.description}
                  <span className={`badge ms-1.25 text-white ${item.badge.className}`}>{item.badge.label}</span>
                </p>
                <small className="text-default-400 text-xs">{item.time}</small>
              </div>
            </div>

            <button className="btn btn-sm px-1.5 py-0 border-default-300 hover:border-primary hover:text-primary">{item.action}</button>
          </div>
        ))}
      </div>
    </div>
  )
}
