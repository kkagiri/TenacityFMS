import { Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'
import { Link } from 'react-router'
import { shippingTimelineData } from '../data'
const ShippingActivity = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">Shipping Activity</CardTitle>
      </CardHeader>
      <CardBody className="p-4">
        <div className="timeline">
          {shippingTimelineData.map((item, idx) => (
            <div key={idx} className="timeline-item d-flex align-items-stretch">
              <div className="timeline-time pe-3 text-muted">{item.time ?? ''}</div>
              <div className={`timeline-dot ${idx === 0 ? 'bg-light' : 'bg-success'}`} />
              <div className={`timeline-content ps-3 ${idx != shippingTimelineData.length - 1 ? 'pb-5' : ''}`}>
                <h5 className="mb-1">{item.title}</h5>
                <p className="mb-1 text-muted">{item.description}</p>
                <p className="mb-1 text-muted fs-xxs">
                  Tracking No:{' '}
                  <Link to="" className="link-primary fw-semibold text-decoration-underline">
                    {item.trackingNo}
                  </Link>
                </p>
                <span className="fw-semibold fs-xxs">By {item.trackingBy}</span>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  )
}
export default ShippingActivity
