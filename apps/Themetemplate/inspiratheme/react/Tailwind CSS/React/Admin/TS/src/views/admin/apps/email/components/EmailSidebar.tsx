import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import { cn } from '@/utils/helpers'
import { Link } from 'react-router'
import { emailSidebarMenu, labels } from './data'

const EmailSidebar = () => {
  return (
    <div className="card h-full">
      <div className="card-header mb-4 flex items-center gap-2 text-start lg:hidden">
        <button className="btn btn-icon border-default-300 rounded border">
          <Icon icon="menu-4" className="text-default-600 size-6" aria-haspopup="dialog" aria-expanded="false" aria-controls="emailSidebaroffcanvas" aria-label="Toggle navigation" data-hs-overlay="#emailSidebaroffcanvas" />
        </button>
      </div>
      <div
        id="emailSidebaroffcanvas"
        className="hs-overlay hs-overlay-open:translate-x-0 rounded fixed start-0 top-0 bottom-0 z-50 hidden bg-card h-full w-56.5 -translate-x-full transform transition-all duration-300 [--auto-close:lg] lg:static lg:end-auto lg:bottom-0 lg:block! lg:translate-x-0"
        role="dialog"
        tabIndex={-1}
        aria-label="Sidebar"
      >
        <SimpleBar className="card-body h-[calc(100vh-200px)]">
          <Link to="/apps/email/compose" className="btn w-full bg-danger text-white hover:bg-danger-hover">
            Compose
          </Link>
          <div className="mt-5">
            <div className="flex flex-col">
              {emailSidebarMenu.map((item, idx) => (
                <a
                  key={idx}
                  href={item.link}
                  className={cn('hover:bg-default-100 flex items-center justify-between rounded-lg px-3.5 py-2.25 font-medium transition', {
                    'bg-default-50': idx === 0,
                  })}
                >
                  <div className="flex items-center space-x-2">
                    <Icon icon={item.icon} className="text-base align-middle" />
                    <span className="align-middle">{item.label}</span>
                  </div>
                  {item.badge?.text && <span className={cn('badge text-2xs text-danger', item.badge.className)}>{item.badge.text}</span>}
                </a>
              ))}
            </div>

            <div className="mt-2.5">
              <div className="text-default-800 px-3 py-2 text-sm font-medium tracking-wider">Labels</div>
              {labels.map((item, idx) => (
                <a href="" className="hover:bg-default-100 font-medium flex items-center gap-2 rounded px-3 py-2 transition" key={idx}>
                  <Icon icon="chart-donut" className={cn('align-middle text-sm', item.iconClassName)} />
                  <span className="align-middle">{item.name}</span>
                </a>
              ))}
            </div>
          </div>
        </SimpleBar>
      </div>
    </div>
  )
}

export default EmailSidebar
