import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { Link } from 'react-router'
import { categoryData, sidebarMenuItemData } from './data'

const Sidebar = () => {
  return (
    <div className="card h-full">
      <div
        id="fileSidebaroffcanvas"
        className="hs-overlay hs-overlay-open:translate-x-0 rounded fixed start-0 top-0 bottom-0 z-50 h-full w-62.5 -translate-x-full transform bg-card transition-all duration-300 [--auto-close:lg] lg:static lg:end-auto lg:bottom-0 lg:block! lg:translate-x-0"
        role="dialog"
        tabIndex={-1}
        aria-label="Sidebar"
      >
        <div className="card-body h-full">
          <Link to="" className="btn w-full bg-danger text-white hover:bg-danger-hover">
            Upload Files
          </Link>

          <div className="mt-5">
            <div className="flex flex-col">
              {sidebarMenuItemData.map((item, idx) => (
                <Link to="" className={cn('hover:bg-default-100 font-medium flex items-center gap-2 rounded px-3 py-2 transition', { 'bg-default-100': idx === 0 })} key={idx}>
                  <div className="flex items-center space-x-2">
                    <Icon icon={item.icon} className="text-base align-middle text-default-700" />
                    <span className="align-middle">{item.name}</span>
                  </div>
                  {item.badge && <span className={cn('ms-auto badge text-2xs font-semibold', item.badge.className)}>{item.badge.label}</span>}
                </Link>
              ))}
            </div>

            <div className="mt-2.5">
              <div className="text-default-800 px-3 py-2 text-sm font-medium tracking-wider">Categories</div>

              {categoryData.map((item, idx) => (
                <Link to="" className="hover:bg-default-100 font-medium flex items-center gap-2 rounded px-3 py-2 transition" key={idx}>
                  <Icon icon={item.icon} className={cn('text-primary align-middle text-sm', item.iconClassName)} />
                  <span className="align-middle">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
