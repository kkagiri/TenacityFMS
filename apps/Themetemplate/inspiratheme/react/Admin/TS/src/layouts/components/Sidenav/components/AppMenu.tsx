import Icon from '@/components/wrappers/Icon'
import { menuItems } from '@/layouts/components/data'
import type { MenuItemType } from '@/types'
import { scrollToElement } from '@/utils/layout'
import clsx from 'clsx'
import { Link } from 'react-router'
import { useLocation } from 'react-router'
import { Fragment, useCallback, useEffect, useState } from 'react'
import { Collapse } from 'react-bootstrap'

const MenuItemWithChildren = ({ item, openMenuKey, setOpenMenuKey, level = 0 }: { item: MenuItemType; openMenuKey: string | null; setOpenMenuKey: (key: string | null) => void; level?: number }) => {
  const pathname = useLocation().pathname
  const isTopLevel = level === 0
  const [localOpen, setLocalOpen] = useState(false)
  const [didAutoOpen, setDidAutoOpen] = useState(false)

  const isChildActive = useCallback((children: MenuItemType[] = []): boolean => children.some((child) => (child.url && pathname.startsWith(child.url)) || (child.children && isChildActive(child.children))), [pathname])

  const isActive = (item.url && pathname.startsWith(item.url)) || isChildActive(item.children)

  const isOpen = isTopLevel ? openMenuKey === item.slug : localOpen

  useEffect(() => {
    if (isActive && !didAutoOpen) {
      if (isTopLevel) {
        setOpenMenuKey(item.slug)
      } else {
        setLocalOpen(true)
      }
      setDidAutoOpen(true)
    }
  }, [isActive, didAutoOpen, isTopLevel, item.slug, setOpenMenuKey])

  const toggleOpen = (e: React.MouseEvent) => {
    if (item.children?.length) e.preventDefault()
    if (isTopLevel) {
      setOpenMenuKey(isOpen ? null : item.slug)
    } else {
      setLocalOpen((prev) => !prev)
    }
  }

  return (
    <li
      className={clsx('side-nav-item', {
        active: isActive,
      })}
    >
      <Link to={item.url ?? '#'} onClick={toggleOpen} className={clsx('side-nav-link', isActive && 'active')} aria-expanded={isOpen}>
        {item.icon && isTopLevel && (
          <span className="menu-icon">
            <Icon icon={item.icon} />
          </span>
        )}

        <span className="menu-text">{item.label}</span>
        {item.badge ? <span className={clsx('badge', item.badge.className)}>{item.badge.text}</span> : <span className="menu-arrow" />}
      </Link>

      <Collapse in={isOpen}>
        <div>
          <ul className="sub-menu">
            {(item.children || []).map((child) => (child.children ? <MenuItemWithChildren key={child.slug} item={child} openMenuKey={openMenuKey} setOpenMenuKey={setOpenMenuKey} level={level + 1} /> : <MenuItem key={child.slug} item={child} level={level + 1} />))}
          </ul>
        </div>
      </Collapse>
    </li>
  )
}

const MenuItem = ({ item, level = 0 }: { item: MenuItemType; level?: number }) => {
  const pathname = useLocation().pathname
  const isTopLevel = level === 0
  const isActive = item.url && pathname.startsWith(item.url)

  return (
    <li className={clsx('side-nav-item', isActive && 'active')}>
      <Link to={item.url ?? '/'} className={clsx('side-nav-link', isActive && 'active', item.isDisabled && 'disabled', item.isSpecial && 'special-menu')}>
        {item.icon && isTopLevel && (
          <span className="menu-icon">
            <Icon icon={item.icon} />
          </span>
        )}
        <span className="menu-text">{item.label}</span>
        {item.badge && <span className={clsx('badge', item.badge.className)}>{item.badge.text}</span>}
      </Link>
    </li>
  )
}

const AppMenu = () => {
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null)
  const scrollToActiveLink = () => {
    const activeItem: HTMLAnchorElement | null = document.querySelector('.side-nav-link.active')
    if (activeItem) {
      const simpleBarContent = document.querySelector('#sidenav .simplebar-content-wrapper')
      if (simpleBarContent) {
        const offset = activeItem.offsetTop - window.innerHeight * 0.4
        scrollToElement(simpleBarContent, offset, 500)
      }
    }
  }
  useEffect(() => {
    setTimeout(scrollToActiveLink, 150)
  }, [])

  return (
    <ul className="side-nav">
      {menuItems.map((item, idx) => (
        <Fragment key={idx}>
          {item.isTitle && <li className="side-nav-title">{item.label}</li>}
          {(item.children || [item]).map((item, idx) => (
            <Fragment key={idx}>{item.children ? <MenuItemWithChildren key={item.slug} item={item} openMenuKey={openMenuKey} setOpenMenuKey={setOpenMenuKey} /> : <MenuItem key={item.slug} item={item} />}</Fragment>
          ))}
        </Fragment>
      ))}
    </ul>
  )
}

export default AppMenu
