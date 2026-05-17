import { CountUp } from '@/components/wrappers/CountUp'
import Icon from '@/components/wrappers/Icon'
import { Card, CardBody, Col, Row } from 'react-bootstrap'
import { statCards } from './data'
const StatCards = () => {
  return (
    <Row className="row-cols-xxl-5 row-cols-md-3 row-cols-1 align-items-center">
      {statCards.map((card) => (
        <Col key={card.id} lg={card.id === 5 ? true : undefined} md={card.id === 5 ? 'auto' : undefined}>
          <Card>
            <CardBody>
              <a href="" className="text-muted float-end mt-n1 fs-xl">
                <Icon icon="external-link" />
              </a>
              <h5 title={card.title}>{card.title}</h5>
              <div className="d-flex align-items-center gap-2 my-3">
                <div className="avatar-md flex-shrink-0">
                  <span className="avatar-title text-bg-light rounded-circle fs-22">
                    <Icon icon={card.icon} />
                  </span>
                </div>
                <h3 className="mb-0">
                  <CountUp end={typeof card.value === 'number' ? card.value : 0} prefix={card.prefix} suffix={card.suffix} decimals={Number.isInteger(card.value) ? 0 : 2} enableScrollSpy scrollSpyOnce />
                </h3>
                <span className={`badge ${card.badgeVariant === 'light' ? 'text-bg-light' : `badge-soft-${card.badgeVariant}`} fw-medium ms-2 fs-xs ms-auto`}>{card.badgeText}</span>
              </div>
              <p className="mb-0">
                <span className={`text-${card.pointColor}`}>
                  <Icon icon="point-filled" />
                </span>
                <span className="text-nowrap text-muted">{card.description}</span>
                <span className="float-end">
                  <b>{card.total}</b>
                </span>
              </p>
            </CardBody>
          </Card>
        </Col>
      ))}
    </Row>
  )
}
export default StatCards
