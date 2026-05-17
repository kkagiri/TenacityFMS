import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { Card, CardBody } from 'react-bootstrap'
const ProductStats = ({ stat }) => {
  return (
    <Card className="mb-1">
      <CardBody>
        <a className="text-muted float-end mt-n1 fs-xl">
          <Icon icon="external-link" />
        </a>
        <h5 title={stat.title}>{stat.title}</h5>
        <div className="d-flex align-items-center gap-2 my-3">
          <div className="avatar-md flex-shrink-0">
            <span className={clsx('avatar-title fs-22 rounded-circle', stat.iconClassName)}>
              <Icon icon={stat.icon} />
            </span>
          </div>
          <h3 className="mb-0">
            {stat.prefix}
            {stat.value}
            {stat.suffix}
          </h3>
          <span className={clsx(stat.badgeClassName, 'badge fw-medium ms-2 fs-xs ms-auto')}>
            {stat.change > 0 ? '+' : ''}
            {stat.change} New
          </span>
        </div>

        <p className="mb-0">
          <span className={stat.bulletClassName}>
            <Icon icon="circle-filled" />
          </span>
          <span className="text-nowrap text-muted ms-1">{stat.metric}</span>
          <span className="float-end">
            <b>{stat.metricValue}</b>
          </span>
        </p>
      </CardBody>
    </Card>
  )
}
export default ProductStats
