import Icon from '@/components/wrappers/Icon'
import { toPascalCase } from '@/utils/helpers'
import clsx from 'clsx'
import { Card, CardBody, CardHeader, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, ProgressBar, Row } from 'react-bootstrap'
import { Link } from 'react-router'
const ProjectCard2 = ({ project }) => {
  const { icon, progress, members, status, title, updatedTime } = project
  return (
    <Card>
      <CardHeader className="bg-light-subtle border-light p-3">
        <div className="avatar-xl me-3">
          <span className="avatar-title text-bg-light rounded-circle">
            <Icon icon={icon} className="fs-24 text-muted" />
          </span>
        </div>

        <div>
          <h5 className="mb-1 d-flex align-items-center">
            <Link to="/apps/projects-details" className="link-reset">
              {title}
            </Link>
          </h5>

          <p className="text-muted mb-2 fs-xxs">Updated {updatedTime}</p>

          <span className={clsx('badge fs-xxs badge-label', status === 'in-progress' ? 'badge-soft-success' : status === 'pending-review' ? 'badge-soft-warning' : status === 'delayed' ? 'badge-soft-danger' : 'badge-soft-secondary')}>{toPascalCase(status)}</span>
        </div>

        <div className="ms-auto">
          <Dropdown>
            <DropdownToggle href="" className="btn btn-icon btn-ghost-light text-muted drop-arrow-none">
              <Icon icon="dots-vertical" className="fs-xl" />
            </DropdownToggle>

            <DropdownMenu className="dropdown-menu-end">
              <DropdownItem href="">
                <Icon icon="share" className="me-2" />
                Share
              </DropdownItem>

              <DropdownItem href="">
                <Icon icon="edit" className="me-2" />
                Edit
              </DropdownItem>

              <DropdownItem href="">
                <Icon icon="ban" className="me-2" />
                Block
              </DropdownItem>

              <DropdownItem className="text-danger" href="">
                <Icon icon="trash" className="me-2" />
                Delete
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </CardHeader>

      {/* Tasks + Files */}
      <CardBody>
        <Row>
          <Col sm={6}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <Icon icon="list-check" className="text-muted fs-lg" />

              <h5 className="fs-base mb-0 fw-medium">
                {project.task.completed}/{project.task.total}
                {project.task.new && <span className="badge bg-secondary ms-1">+{project.task.new} New</span>}
              </h5>
            </div>
          </Col>

          <Col sm={6}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <Icon icon="paperclip" className="text-muted fs-lg" />

              <h5 className="fs-base mb-0 fw-medium">{project.files} Files</h5>
            </div>
          </Col>
        </Row>

        {/* Comments + Date */}
        <Row>
          <Col sm={6}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <Icon icon="message" className="text-muted fs-lg" />

              <h5 className="fs-base mb-0 fw-medium">{project.comments} Comments</h5>
            </div>
          </Col>

          <Col sm={6}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <Icon icon="calendar-clock" className="text-muted fs-lg" />

              <h5 className="fs-base mb-0 fw-medium">{project.date}</h5>
            </div>
          </Col>
        </Row>

        {/* Members */}
        <p className="my-2 text-muted fw-semibold fs-xxs">Team Members:</p>
        <div className="avatar-group avatar-group-xs mb-3">
          {members.map((member, idx) => (
            <div className="avatar" key={idx}>
              <img src={member} alt="" className="rounded-circle avatar-xs" />
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="mt-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <p className="mb-0 text-muted fw-semibold fs-xxs">Progress</p>
            <p className="fw-semibold mb-0">{project.progress}%</p>
          </div>
          <ProgressBar variant={project.variant} now={progress} className="progress-sm" />
        </div>
      </CardBody>
    </Card>
  )
}
export default ProjectCard2
