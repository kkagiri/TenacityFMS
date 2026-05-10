import clsx from 'clsx'
import { Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'
import { Link } from 'react-router'
import { basicActivityData } from './data'
const BasicActivity = () => {
  return (
    <Card className="card-h-100">
      <CardHeader>
        <CardTitle as="h4">Basic Activity Stream</CardTitle>
      </CardHeader>
      <CardBody>
        {basicActivityData.map((activity, idx) => (
          <div className={clsx('d-flex gap-3 align-items-center', idx != 0 ? 'py-2' : 'pb-2')} key={idx}>
            <span className={`badge badge-label text-bg-${activity.variant}`}>{activity.status}</span>
            <span className="text-muted">{activity.time}</span>
            <Link to="/pages/profile" className="link-reset fw-semibold d-flex align-items-center gap-1">
              <img src={activity.user.image} alt={activity.user.name} className="rounded-circle avatar-xxs" />
              {activity.user.name}
            </Link>
            <span>{activity.action}</span>
          </div>
        ))}
      </CardBody>
    </Card>
  )
}
export default BasicActivity
