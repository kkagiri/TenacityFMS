import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import { META_DATA } from '@/config/constants'
import { Link } from 'react-router'

const Megamenu = () => {
  return (
    <div id="megamenu-header" className="topbar-item hs-dropdown relative inline-flex">
      <button className="topbar-link hs-dropdown-toggle btn px-4.25!" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
        Mega Menu
        <Icon icon="chevron-down" />
      </button>
      <div className="hs-dropdown-menu p-0 md:min-w-3xl" role="menu" aria-orientation="vertical" aria-labelledby="dropdown-menu">
        <SimpleBar style={{ maxHeight: 380 }}>
          <div className="bg-light/50 px-6 py-3 text-center">
            <h4 className="text-base font-semibold">
              Welcome to&nbsp;
              <span className="text-primary">{META_DATA.name}</span>
              &nbsp;Admin Theme.
            </h4>
          </div>
          <div className="grid md:grid-cols-3">
            {megaMenuData.map((item, idx) => (
              <div className="p-6" key={idx}>
                <h5 className="py-2 px-3.5 font-semibold mb-2 text-sm">{item.title}</h5>
                <ul className="list-unstyled megamenu-list">
                  {item.links.map((link, idx) => (
                    <li key={idx}>
                      <Link to={link.href} className="dropdown-item">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SimpleBar>
      </div>
    </div>
  )
}

export default Megamenu

type MegaMenuType = {
  title: string
  links: {
    label: string
    href: string
  }[]
}

const megaMenuData: MegaMenuType[] = [
  {
    title: 'Dashboard & Analytics',
    links: [
      { label: 'Sales Dashboard', href: '' },
      { label: 'Marketing Dashboard', href: '' },
      { label: 'Finance Overview', href: '' },
      { label: 'User Analytics', href: '' },
      { label: 'Traffic Insights', href: '' },
    ],
  },
  {
    title: 'Project Management',
    links: [
      { label: 'Task Overview', href: '' },
      { label: 'Kanban Board', href: '' },
      { label: 'Gantt Chart', href: '' },
      { label: 'Team Collaboration', href: '' },
      { label: 'Project Milestones', href: '' },
    ],
  },
  {
    title: 'User Management',
    links: [
      { label: 'User Profiles', href: '' },
      { label: 'Access Control', href: '' },
      { label: 'Role Permissions', href: '' },
      { label: 'Activity Logs', href: '' },
      { label: 'Security Settings', href: '' },
    ],
  },
]
