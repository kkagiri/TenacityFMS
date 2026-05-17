import Icon from '@/components/wrappers/Icon'
import { Card, CardBody, CardHeader, CardTitle, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, ProgressBar, Row } from 'react-bootstrap'
import Button from 'react-bootstrap/Button'
const TeamCard = ({ team, idx }) => {
  return (
    <Card className="card-h-100">
      <CardHeader>
        <CardTitle as="h4" className="d-inline">
          IT-{(idx + 1).toString().padStart(2, '0')} - {team.name}
          {team.isNew && <span className="ms-2 badge badge-label text-bg-primary">New</span>}
        </CardTitle>
        <Dropdown className="ms-auto">
          <DropdownToggle
            as="a"
            className="text-muted fs-xl drop-arrow-none"
            style={{
              cursor: 'pointer',
            }}
          >
            <Icon icon="dots-vertical" />
          </DropdownToggle>
          <DropdownMenu align="end">
            <DropdownItem href="">
              <Icon icon="eye" className="me-2" />
              View
            </DropdownItem>
            <DropdownItem href="">
              <Icon icon="edit" className="me-2" />
              Edit
            </DropdownItem>
            <DropdownItem href="" className="text-danger">
              <Icon icon="trash" className="me-2" />
              Remove
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </CardHeader>
      <CardBody className="d-flex flex-column justify-content-between">
        <Row className="g-3">
          <Col md={6}>
            <p className="mb-2 text-muted">Total {team.members.length} members</p>
            <div className="avatar-group avatar-group-sm mb-3">
              {team.members.map((member, idx) => (
                <div className="avatar" key={idx}>
                  <img src={member} alt="" className="rounded-circle avatar-sm" />
                </div>
              ))}
            </div>
          </Col>
        </Row>
        <div className="mb-3">
          <h5 className="fs-base mb-2">About Team:</h5>
          <p className="text-muted">{team.description}</p>
        </div>
        <Row>
          {team.stats.map((stat, index) => (
            <Col xl={4} md={6} key={index}>
              <div className="d-flex gap-2 mb-3 mb-xl-0">
                <div className="avatar-sm flex-shrink-0">
                  <span className="avatar-title text-bg-light rounded-circle">
                    <Icon icon={stat.icon} className="fs-lg text-primary" />
                  </span>
                </div>

                <div>
                  <h6 className="mb-1 text-muted text-uppercase">{stat.name}</h6>

                  <p className="fw-medium mb-0">
                    {stat.count?.prefix}
                    {stat.count?.value}
                    {stat.count?.suffix}
                  </p>
                </div>
              </div>
            </Col>
          ))}
        </Row>

        <div className="my-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <p className="mb-0 text-muted fw-semibold fs-xs">{team.progress.label}</p>
            <p className="fw-semibold mb-0">{team.progress.value}%</p>
          </div>
          <ProgressBar now={team.progress.value} variant="primary" className="progress-md" />
        </div>

        <div className="d-flex justify-content-between align-items-center">
          <span className="text-muted fs-xs">
            <Icon icon="clock" className="me-1" />
            Updated {team.updatedTime}
          </span>
          <Button size="sm" className="rounded-pill" variant="primary">
            Details
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
export default TeamCard
