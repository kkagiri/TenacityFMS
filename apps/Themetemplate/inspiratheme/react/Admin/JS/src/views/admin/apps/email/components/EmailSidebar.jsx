import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { CardBody } from 'react-bootstrap'
import { Link } from 'react-router'
import SimpleBar from 'simplebar-react'
import { emailSidebarMenu, labels } from './data'
const EmailSidebar = () => {
  return (
    <SimpleBar className="card h-100 mb-0 rounded-end-0">
      <CardBody>
        <Link to="/apps/email/compose" className="btn btn-danger fw-medium w-100">
          Compose
        </Link>
        <div className="list-group list-group-flush list-custom mt-3">
          {emailSidebarMenu.map(({ badge, link, label, icon }, idx) => (
            <Link
              to={link}
              className={clsx('list-group-item list-group-item-action', {
                active: idx === 0,
              })}
              key={idx}
            >
              <Icon icon={icon} className="me-2 opacity-75 fs-lg align-middle" />
              <span className="align-middle">{label}</span>
              {badge && <span className={clsx('badge align-middle fs-xxs float-end', badge.className)}>{badge.text}</span>}
            </Link>
          ))}

          <div className="list-group-item mt-2">
            <span className="align-middle">Labels</span>
          </div>
          {labels.map(({ name, iconClassName }, idx) => (
            <Link to="" className="list-group-item list-group-item-action" key={idx}>
              <Icon icon="chart-donut" className={clsx('me-2 align-middle fs-sm', iconClassName)} />
              <span className="align-middle">{name}</span>
            </Link>
          ))}
        </div>
      </CardBody>
    </SimpleBar>
  )
}
export default EmailSidebar
