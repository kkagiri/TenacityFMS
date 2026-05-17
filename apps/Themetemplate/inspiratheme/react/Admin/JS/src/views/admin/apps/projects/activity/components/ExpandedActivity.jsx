import Icon from '@/components/wrappers/Icon'
import { Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'
import { Link } from 'react-router'
import { expandedActivityData } from './data'
export const ExpandedActivity = () => {
  return (
    <Card className="card-h-100">
      <CardHeader>
        <CardTitle as="h4">Expanded Activity Stream</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="timeline timeline-icon-bordered">
          {expandedActivityData.map((event, idx) => {
            return (
              <div className="timeline-item d-flex align-items-stretch" key={idx}>
                <div className="timeline-dot">
                  <Icon icon={event.icon} className={`fs-xl ${event.iconClassName}`} />
                </div>
                <div className="timeline-content ps-3 pb-3">
                  <div className="d-flex justify-content-between">
                    <h5 className="mb-1">
                      {event.title}
                      <span className={`badge badge-label ${event.badge.className} ms-2`}>{event.badge.label}</span>
                    </h5>
                    <span className="text-muted fs-xs">{event.time}</span>
                  </div>
                  <p className="mb-1 text-muted">{event.description}</p>
                  <div className="d-flex align-items-center gap-2">
                    <img src={event.user.image} alt={event.user.name} className="rounded-circle avatar-xxs" />
                    <Link to="" className="fw-semibold link-reset">
                      {event.user.name}
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardBody>
    </Card>
  )
}
export default ExpandedActivity
