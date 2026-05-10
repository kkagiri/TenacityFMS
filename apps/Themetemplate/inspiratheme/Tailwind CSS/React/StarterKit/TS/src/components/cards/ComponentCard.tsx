import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { useEffect, useState } from 'react'

type ComponentCardProps = {
  title: string
  badge?: React.ReactNode
  isCollapsible?: boolean
  isRefreshable?: boolean
  isCloseable?: boolean
  className?: string
  bodyClassName?: string
  titleClassName?: string
  actionClassName?: string
  children: React.ReactNode
}

const ComponentCard = ({ title, badge, isCollapsible, isRefreshable, isCloseable, className, bodyClassName, titleClassName, actionClassName, children }: ComponentCardProps) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const collapseId = `hs-collapse-${Math.random().toString(36).slice(2)}`

  useEffect(() => {
    import('preline/preline')
  }, [])

  const handleClose = () => {
    setIsVisible(false)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)

    setTimeout(() => {
      setIsRefreshing(false)
    }, 1500)
  }

  if (!isVisible) return null

  return (
    <div className={clsx('card relative', className)}>
      {/* Refresh Overlay */}
      {isRefreshing && (
        <div className="card-overlay absolute inset-0 z-20 flex items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-3 border-primary border-t-transparent"></div>
        </div>
      )}

      {/* Header */}
      <div className="card-header flex justify-between items-center">
        <h4 className={clsx('card-title', titleClassName)}>
          {title} {badge}
        </h4>

        <div className={clsx('flex gap-1', actionClassName)}>
          {isCollapsible && (
            <button className="size-6 hs-collapse-toggle flex justify-center items-center rounded-full bg-light hover:bg-primary/15 hover:text-primary" data-hs-collapse={`#${collapseId}`}>
              <Icon icon="chevron-up" className={clsx('hs-collapse-open:rotate-180 text-base')} />
            </button>
          )}

          {isRefreshable && (
            <button onClick={handleRefresh} className="size-6 flex justify-center items-center rounded-full bg-light hover:bg-primary/15 hover:text-primary">
              <Icon icon="refresh" className="text-base" />
            </button>
          )}

          {isCloseable && (
            <button onClick={handleClose} className="size-6 flex justify-center items-center rounded-full bg-light hover:bg-primary/15 hover:text-primary">
              <Icon icon="x" className="text-base" />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div id={collapseId} className={clsx('card-body overflow-hidden hs-collapse', 'transition-all duration-300', bodyClassName)}>
        {children}
      </div>
    </div>
  )
}

export default ComponentCard
