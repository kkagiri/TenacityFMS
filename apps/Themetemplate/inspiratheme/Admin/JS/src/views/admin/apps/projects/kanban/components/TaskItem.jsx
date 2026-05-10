import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { Card, CardBody, Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'react-bootstrap'
import { Link } from 'react-router'
const TaskItem = ({ item }) => {
  return (
    <Card className="mb-2 shadow border-light">
      <CardBody>
        <div className="d-flex align-items-center mb-2">
          <span className={clsx('badge p-1', `badge-soft-${item.category.variant}`)}>
            <Icon icon="circle-filled"></Icon> {item.category.name}
          </span>
          <div className="ms-auto">
            <Dropdown>
              <DropdownToggle className="btn btn-icon btn-sm btn-ghost-light text-muted drop-arrow-none">
                <Icon icon="dots-vertical" className="fs-xl" />
              </DropdownToggle>
              <DropdownMenu align="end">
                <DropdownItem>
                  <Icon icon="share" className="me-2" />
                  Share
                </DropdownItem>
                <DropdownItem>
                  <Icon icon="edit" className="me-2" />
                  Edit
                </DropdownItem>
                <DropdownItem>
                  <Icon icon="ban" className="me-2" />
                  Block
                </DropdownItem>
                <DropdownItem className="text-danger">
                  <Icon icon="trash" className="me-2" />
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
        <h5 className="mb-3">
          <Link to="" className="link-reset">
            {item.title}
          </Link>
        </h5>
        {item.image && (
          <div className="mb-3">
            <img src={item.image} alt="" className="rounded img-fluid" width={500} height={300} />
          </div>
        )}
        <div className="d-flex justify-content-between">
          <div className="avatar-group avatar-group-xs">
            {item.users.map((user, i) => (
              <div className="avatar" key={i}>
                <img src={user} alt="" className="rounded-circle avatar-xs" />
              </div>
            ))}
          </div>

          <div className="d-flex align-items-center gap-2">
            <Icon icon="calendar-clock" className="text-muted fs-lg" />
            <h5 className="fs-base mb-0 fw-medium">{item.date}</h5>
          </div>
        </div>

        {item.progress && (
          <div className="mt-3">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <p className="mb-0 text-muted fw-semibold fs-xxs">Progress</p>
              <p className="fw-semibold mb-0">{item.progress}%</p>
            </div>

            <div
              className="progress"
              style={{
                height: '5px',
              }}
            >
              <div
                className={`progress-bar bg-${item.category.variant}`}
                role="progressbar"
                style={{
                  width: `${item.progress}%`,
                }}
              />
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
export default TaskItem
