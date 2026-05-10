import Icon from '@/components/wrappers/Icon'
import { menuItems } from '@/layouts/components/data'
import { cn } from '@/utils/helpers'
import { Fragment } from 'react'
import { Link, useLocation } from 'react-router'
const MenuItemWithChildren = ({ item, wrapperClass, togglerClass, level }) => {
  const menuLevel = level ?? 1
  const pathname = useLocation().pathname
  const isChildActive = (items) =>
    items.some((child) => {
      if (child.url && pathname.endsWith(child.url)) return true
      if (child.children) return isChildActive(child.children)
      return false
    })
  const isActive = isChildActive(item.children || [])
  const Tag = menuLevel > 1 ? 'div' : 'li'
  return (
    <Tag
      className={cn(wrapperClass, {
        active: isActive,
      })}
    >
      <div
        className={cn(
          'hs-dropdown ',
          menuLevel > 1
            ? '[--adaptive:none] [--is-collapse:true] [--strategy:static] lg:[--is-collapse:false] lg:[--strategy:absolute] lg:[--trigger:hover] relative'
            : '[--trigger:hover] [--adaptive:none] [--is-collapse:true] [--strategy:static] lg:[--adaptive:adaptive] lg:[--is-collapse:false] lg:[--strategy:fixed]'
        )}
      >
        <button
          className={cn(togglerClass, 'hs-dropdown-toggle', {
            active: isActive,
          })}
        >
          {item.icon && menuLevel < 2 && (
            <span className="menu-icon">
              <Icon icon={item.icon} />
            </span>
          )}

          <span className="menu-text">{item.label}</span>

          {item.badge && <span className={cn('badge', 'ms-auto', item.badge.className)}>{item.badge.text}</span>}

          <div className="menu-arrow ms-auto">
            <Icon icon="chevron-down" />
          </div>
        </button>

        <div className={cn('hs-dropdown-menu')}>
          {(item.children || []).map((child, idx) => (
            <Fragment key={idx}>{child.children ? <MenuItemWithChildren item={child} togglerClass="dropdown-item" level={menuLevel + 1} /> : <MenuItem item={child} linkClass="dropdown-item" level={menuLevel + 1} />}</Fragment>
          ))}
        </div>
      </div>
    </Tag>
  )
}
const MenuItem = ({ item, linkClass, wrapperClass, level }) => {
  const menuLevel = level ?? 1
  const pathname = useLocation().pathname
  const isActive = item.url && pathname.endsWith(item.url)
  const link = (
    <Link
      to={item.url ?? '/'}
      className={cn(linkClass, {
        'active': isActive,
      })}
    >
      {item.icon && menuLevel < 2 && (
        <span className="menu-icon">
          <Icon icon={item.icon} className="text-lg" />
        </span>
      )}
      {item.label}
      {item.badge && <span className={cn('badge', item.badge.className)}>{item.badge.text}</span>}
    </Link>
  )
  return menuLevel > 1 ? (
    link
  ) : (
    <li
      className={cn(wrapperClass, {
        'active': isActive,
      })}
    >
      {link}
    </li>
  )
}
const AppMenu = () => {
  return (
    <ul className="navbar-nav">
      {menuItems.map((item, idx) => (
        <Fragment key={idx}>{item.children ? <MenuItemWithChildren item={item} wrapperClass="nav-item" togglerClass="nav-link" /> : <MenuItem item={item} linkClass="nav-link" wrapperClass="nav-item" />}</Fragment>
      ))}
    </ul>
  )
}
export default AppMenu
