import { CountUp } from '@/components/wrappers/CountUp'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { Card, CardBody, Col } from 'react-bootstrap'

const Widget2 = () => {
  return (
    <>
      <Col>
        <Card>
          <CardBody>
            <a href="#!" className="text-muted float-end mt-n1 fs-xl">
              <Icon icon="external-link" />
            </a>
            <h5 title="Number of Tasks">My Tasks</h5>
            <div className="d-flex align-items-center gap-2 my-3">
              <div className="avatar-md flex-shrink-0">
                <span className="avatar-title text-bg-light rounded-circle fs-22">
                  <Icon icon="checklist" />
                </span>
              </div>
              <h3 className="mb-0">
                <CountUp start={0} end={124} duration={1} />
              </h3>
              <span className="badge badge-soft-primary fw-medium ms-2 fs-xs ms-auto">+3 New</span>
            </div>
            <p className="mb-0">
              <span className="text-primary">
                <Icon icon="point-filled" />
              </span>
              <span className="text-nowrap text-muted">Total Tasks</span>
              <span className="float-end">
                <b>12,450</b>
              </span>
            </p>
          </CardBody>
        </Card>
      </Col>
      <Col>
        <Card>
          <CardBody>
            <a href="#!" className="text-muted float-end mt-n1 fs-xl">
              <Icon icon="external-link" />
            </a>
            <h5 title="Number of Messages">Messages</h5>
            <div className="d-flex align-items-center gap-2 my-3">
              <div className="avatar-md flex-shrink-0">
                <span className="avatar-title text-bg-purple rounded-circle fs-22">
                  <Icon icon="message-circle" />
                </span>
              </div>
              <h3 className="mb-0">
                <CountUp start={0} end={69.5} duration={1} decimals={1} suffix="k" />
              </h3>
              <span className="badge badge-soft-secondary fw-medium ms-2 fs-xs ms-auto">+5 New</span>
            </div>
            <p className="mb-0">
              <span className="text-secondary">
                <Icon icon="point-filled" />
              </span>
              <span className="text-nowrap text-muted">Total Messages</span>
              <span className="float-end">
                <b>32.1M</b>
              </span>
            </p>
          </CardBody>
        </Card>
      </Col>
      <Col>
        <Card className="text-bg-primary">
          <CardBody>
            <a href="#!" className="text-white-50 float-end mt-n1 fs-xl">
              <Icon icon="external-link" />
            </a>
            <h5 title="Pending Approvals">Approvals</h5>
            <div className="d-flex align-items-center gap-2 my-3">
              <div className="avatar-md flex-shrink-0">
                <span className="avatar-title bg-white bg-opacity-20 rounded-circle fs-22">
                  <Icon icon="file-check" />
                </span>
              </div>
              <h3 className="mb-0">
                <CountUp start={0} end={32} duration={1} />
              </h3>
            </div>
            <p className="mb-0">
              <span className="text-nowrap text-white text-opacity-75">Total Approvals:</span>
              <span className="float-end">
                <b>
                  <CountUp start={0} end={1479} duration={1} decimals={0} />
                </b>
              </span>
            </p>
          </CardBody>
        </Card>
      </Col>
      <Col>
        <Card>
          <CardBody>
            <a href="#!" className="text-muted float-end mt-n1 fs-xl">
              <Icon icon="external-link" />
            </a>
            <h5 title="Total Clients">Clients</h5>
            <div className="d-flex align-items-center gap-2 my-3">
              <div className="avatar-md flex-shrink-0">
                <span className="avatar-title text-bg-info rounded-circle fs-22">
                  <Icon icon="users" />
                </span>
              </div>
              <h3 className="mb-0">
                <CountUp start={0} end={184} duration={1} />
              </h3>
              <span className="badge badge-soft-secondary fw-medium ms-2 fs-xs ms-auto">+4 New</span>
            </div>
            <p className="mb-0">
              <span className="text-secondary">
                <Icon icon="point-filled" />
              </span>
              <span className="text-nowrap text-muted">Total Clients</span>
              <span className="float-end">
                <b>9,835</b>
              </span>
            </p>
          </CardBody>
        </Card>
      </Col>
      <div className="col-lg col-md-auto">
        <Card className="bg-danger bg-opacity-10">
          <CardBody>
            <Link to="" className="text-muted float-end mt-n1 fs-xl">
              <Icon icon="external-link" />
            </Link>
            <h5 title="Revenue Generated">Revenue</h5>
            <div className="d-flex align-items-center gap-2 my-3">
              <div className="avatar-md flex-shrink-0">
                <span className="avatar-title text-bg-danger bg-opacity-90 rounded-circle fs-22">
                  <Icon icon="credit-card" />
                </span>
              </div>
              <h3 className="mb-0">
                $<CountUp start={0} end={125.5} duration={1} decimals={1} suffix="k" />
              </h3>
              <span className="badge badge-soft-danger fw-medium ms-2 fs-xs ms-auto">+1.5%</span>
            </div>
            <p className="mb-0">
              <span className="text-primary">
                <Icon icon="point-filled" />
              </span>
              <span className="text-nowrap text-muted">Total Revenue</span>
              <span className="float-end">
                <b>$12.5M</b>
              </span>
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  )
}

export default Widget2
