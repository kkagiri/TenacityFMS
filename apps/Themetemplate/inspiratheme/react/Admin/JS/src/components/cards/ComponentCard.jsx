import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { useState } from 'react'
import { Card, CardBody, CardHeader, CardTitle, Collapse } from 'react-bootstrap'
const ComponentCard = ({ title, isCloseable, isCollapsible, isRefreshable, className, bodyClassName, children }) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const handleClose = () => {
    setIsVisible(false)
  }
  const handleToggle = () => {
    setIsCollapsed(!isCollapsed)
  }

  // Simulate a refresh action
  // In a real-world scenario, you would fetch new data here
  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setIsRefreshing(false)
    }, 1500)
  }
  if (!isVisible) return null
  return (
    <Card className={clsx(isCollapsed && 'card-collapse', className)}>
      {isRefreshing && (
        <div className="card-overlay d-flex align-items-center justify-content-center">
          <div className="spinner-border text-primary" />
        </div>
      )}

      <CardHeader className="justify-content-between align-items-center">
        <CardTitle>{title}</CardTitle>
        <div className="card-action">
          {isCollapsible && (
            <span className="card-action-item" onClick={handleToggle}>
              <Icon
                icon="chevron-up"
                style={{
                  rotate: isCollapsed ? '180deg' : '0deg',
                }}
              />
            </span>
          )}
          {isRefreshable && (
            <span className="card-action-item" onClick={handleRefresh}>
              <Icon icon="refresh" />
            </span>
          )}
          {isCloseable && (
            <span className="card-action-item" onClick={handleClose}>
              <Icon icon="x" />
            </span>
          )}
        </div>
      </CardHeader>

      {isCollapsible ? (
        <Collapse in={!isCollapsed}>
          <CardBody className={bodyClassName}>{children}</CardBody>
        </Collapse>
      ) : (
        <CardBody className={bodyClassName}>{children}</CardBody>
      )}
    </Card>
  )
}
export default ComponentCard
