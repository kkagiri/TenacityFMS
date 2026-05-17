import Icon from '@/components/wrappers/Icon'
import { formatBytes } from '@/utils/helpers'
import clsx from 'clsx'
import { Button, Card, CardBody } from 'react-bootstrap'
import { Link } from 'react-router'
import { fileData, teamMemberData } from './data'
const Sidebar = () => {
  return (
    <Card className="card-h-100 rounded-0 rounded-end">
      <CardBody className="p-0">
        <div className="p-3 border-bottom border-dashed">
          <h5 className="mb-2">Status</h5>
          <div className="app-search">
            <select className="form-select form-control my-1 my-md-0">
              <option>Status</option>
              <option selected value="On Track">
                On Track
              </option>
              <option value="Delayed">Delayed</option>
              <option value="At Risk">At Risk</option>
              <option value="Completed">Completed</option>
            </select>
            <Icon icon="calendar-clock" className="app-search-icon text-muted" />
          </div>
        </div>

        <div className="p-3 border-bottom border-dashed">
          <div className="d-flex mb-3 justify-content-between align-items-center">
            <h5 className="mb-0">Team Members:</h5>
            <Button variant="light" size="sm" className="btn-icon rounded-circle">
              <Icon icon="plus" />
            </Button>
          </div>

          {teamMemberData.map((member, idx) => (
            <div
              className={clsx('d-flex justify-content-between align-items-center', {
                'pb-2': idx !== teamMemberData.length - 1,
              })}
              key={idx}
            >
              <div className="d-flex align-items-center py-1 gap-2">
                <div className="avatar avatar-sm">
                  <img src={member.image} alt="avatar-3" className="img-fluid rounded-circle" />
                </div>
                <div>
                  <h5 className="text-nowrap mb-0 lh-base">
                    <Link to="/pages/profile" className="link-reset">
                      {member.name}
                    </Link>
                  </h5>
                  <p className="text-muted fs-xxs mb-0">{member.role}</p>
                </div>
              </div>
              <div>
                <Link to="" className="btn btn-sm btn-icon btn-default" title="Message">
                  <Icon icon="message" className="fs-lg text-muted" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="px-3 pt-3 border-bottom border-dashed">
          <div className="d-flex mb-3 justify-content-between align-items-center">
            <h5 className="mb-0">Files:</h5>
            <Link to="" className="btn btn-light btn-sm btn-icon rounded-circle">
              <Icon icon="plus" />
            </Link>
          </div>

          {fileData.map(({ name, size, icon }, idx) => (
            <div className="d-flex justify-content-between align-items-center pb-2" key={idx}>
              <div className="d-flex align-items-center py-1 gap-2">
                <div className="flex-shrink-0 avatar-md bg-light bg-opacity-50 text-muted rounded-2">
                  <span className="avatar-title">
                    <Icon icon={icon} className="fs-xl" />
                  </span>
                </div>
                <div className="flex-grow-1">
                  <h5 className="mb-1 fs-base">
                    <Link to="" className="link-reset">
                      {name}
                    </Link>
                  </h5>
                  <p className="text-muted mb-0 fs-xs">{formatBytes(size)}</p>
                </div>
              </div>
              <div>
                <Button variant="default" size="sm" className="btn-icon" title="Download">
                  <Icon icon="download" className="fs-lg" />
                </Button>
              </div>
            </div>
          ))}

          <div className="d-flex align-items-center justify-content-center gap-2 p-3">
            <strong>Loading...</strong>
            <div className="spinner-border spinner-border-sm text-danger" role="status" aria-hidden="true"></div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
export default Sidebar
