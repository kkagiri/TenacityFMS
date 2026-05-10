import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { Card, CardBody, Col, OverlayTrigger, ProgressBar, Row, Tooltip } from 'react-bootstrap'
import { widget2Data } from './data'
const SalesPerformanceOverview = () => {
  return (
    <Card>
      <CardBody className="p-0">
        <div className="p-3 bg-light-subtle border-bottom border-dashed">
          <Row>
            <Col>
              <h4 className="fs-sm mb-1">Would you like the full report?</h4>
              <small className="text-muted fs-xs mb-0">All 120 orders have been successfully delivered</small>
            </Col>
            <Col xs={'auto'} className="align-self-center">
              <OverlayTrigger overlay={<Tooltip>Download</Tooltip>}>
                <button type="button" className="btn btn-sm btn-default rounded-circle btn-icon">
                  <Icon icon="download" className="fs-xl" />
                </button>
              </OverlayTrigger>
            </Col>
          </Row>
        </div>
        <Row className="row-cols-xxl-2 row-cols-md-2 row-cols-1 g-1 p-1">
          {widget2Data.map((item, idx) => (
            <Col key={idx}>
              <Card className={clsx('rounded-0 border shadow-none border-dashed mb-0', item.variant ? `bg-opacity-10 bg-${item.variant} border-${item.variant}` : '')}>
                <CardBody>
                  <div className="mb-3 d-flex justify-content-between align-items-center">
                    <h5 className="fs-xl mb-0">
                      {item.count.prefix || ''}
                      {item.count.value}
                      {item.count.suffix && <small className="fs-6">{item.count.suffix}</small>}
                    </h5>
                    <span>
                      {item.percentage}%{item.percentageIcon && <Icon icon={item.percentageIcon} className={item.isPositive ? 'text-success' : 'text-danger'} />}
                    </span>
                  </div>
                  <p className="text-muted mb-2">
                    <span>{item.title}</span>
                  </p>
                  <ProgressBar now={item.percentage} className="progress-sm mb-0" variant={item.variant ? item.variant : 'primary'} />
                </CardBody>
              </Card>
            </Col>
          ))}
        </Row>

        <div className="text-center my-2">
          <a href="#" className="link-reset text-decoration-underline fw-semibold link-offset-3">
            View all Links <Icon icon="link" />
          </a>
        </div>
      </CardBody>
    </Card>
  )
}
export default SalesPerformanceOverview
