import usFlag from '@/assets/images/flags/us.svg'
import user3 from '@/assets/images/users/user-3.jpg'
import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import { META_DATA } from '@/config/constants'
import { cn } from '@/utils/helpers'
import { Link } from 'react-router'
import { categoryData, profileMainMenuData } from './data'

const SocialProfile = () => {
  return (
    <div className="card overflow-hidden lg:top-22 lg:sticky">
      <div
        id="outlookSidebaroffcanvas"
        className="hs-overlay hs-overlay-open:translate-x-0 fixed start-0 top-0 bottom-0 z-50 lg:z-10 hidden h-full lg:min-w-auto min-w-75 -translate-x-full transform bg-card transition-all duration-300 [--auto-close:lg] lg:static lg:end-auto lg:bottom-0 lg:block! lg:translate-x-0"
        role="dialog"
        tabIndex={-1}
        aria-label="Sidebar"
      >
        <SimpleBar className="card-body h-full">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src={user3} alt="avatar" className="size-10.5 rounded" />
              <div>
                <h5 className="flex items-center">
                  <Link to="" className="hover:text-primary">
                    {META_DATA.username}
                  </Link>
                  <img src={usFlag} alt="US" className="ms-2.5 size-4 rounded-full" />
                </h5>
                <p className="text-default-400">Content Creator</p>
              </div>
            </div>

            <div className="relative ms-auto">
              <div className="hs-dropdown relative inline-flex [--placement:bottom-right]">
                <button type="button" className="hs-dropdown-toggle" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
                  <Icon icon="dots-vertical" className="text-default-400 size-6"></Icon>
                </button>

                <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
                  <a className="dropdown-item" href="">
                    View Profile
                  </a>
                  <a className="dropdown-item" href="">
                    Send message
                  </a>
                  <a className="dropdown-item" href="">
                    Copy Profile Link
                  </a>
                  <div className="border-default-300 my-3 border-t"></div>
                  <a className="dropdown-item" href="">
                    Edit Profile
                  </a>
                  <a className="dropdown-item text-danger" href="">
                    Block user
                  </a>
                  <a className="dropdown-item text-danger" href="">
                    Report user
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div>
            {profileMainMenuData.map((item, idx) => (
              <Link key={idx} to={item.href} className={cn('flex w-full items-center gap-2.25 rounded px-3 py-2 font-semibold hover:bg-default-100 focus:bg-default-100', { 'active bg-default-100': idx === 0 })}>
                <Icon icon={item.icon} className="text-base"></Icon>

                {item.label}

                {item.badge && <span className={`badge ms-auto ${item.badge.className}`}>{item.badge.label}</span>}
              </Link>
            ))}

            <div className="list-group-item mt-3 px-3.5 py-2.25">
              <span className="align-middle">Categories</span>
            </div>

            {categoryData.map((item, idx) => (
              <Link key={idx} to={item.href} className="flex w-full items-center gap-2.25 rounded px-3 py-2 font-semibold hover:bg-default-100 focus:bg-default-100">
                <Icon icon="tag" className={cn('text-base', item.iconClassName)} />
                {item.label}
              </Link>
            ))}
          </div>
        </SimpleBar>
      </div>
    </div>
  )
}

export default SocialProfile
