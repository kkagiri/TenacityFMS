import Icon from '@/components/wrappers/Icon'
import { Card, CardBody } from 'react-bootstrap'
import { Widget1Type } from './data'

const Widget1 = ({ widget }: { widget: Widget1Type }) => {
  const { title, totalCount, count, variant, description } = widget
  return (
    <Card className={`border-0 bg-${variant} bg-opacity-10 shadow-none mb-0`}>
      <CardBody>
        <h5 title="Number of Orders">{title}</h5>
        <div className="d-flex align-items-center gap-2 my-3">
          <div className="avatar-md flex-shrink-0">
            <span className={`avatar-title text-bg-${variant} bg-opacity-90 rounded-circle fs-22`}>
              <Icon icon={widget.icon} />
            </span>
          </div>
          <h3 className="mb-0">
            {count.prefix && count.prefix}
            {count.value}
            {count.suffix && count.suffix}
          </h3>
        </div>
        <p className="mb-0">
          <span className={`text-${variant}`}>
            <Icon icon="point-filled" className="me-1" />
          </span>
          <span className="text-nowrap text-muted">{description}</span>
          <span className="float-end">
            <b>{totalCount}</b>
          </span>
        </p>
      </CardBody>
    </Card>
  )
}

export default Widget1
