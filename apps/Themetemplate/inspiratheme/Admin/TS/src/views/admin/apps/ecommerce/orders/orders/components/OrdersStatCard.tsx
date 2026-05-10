import { CountUp } from '@/components/wrappers/CountUp'
import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { Card, CardBody } from 'react-bootstrap'
import { OrderStatType } from './data'

const OrdersStatCard = ({ item }: { item: OrderStatType }) => {
  return (
    <Card className="mb-1">
      <CardBody>
        <div className="d-flex align-items-center gap-2 mb-3">
          <div className="avatar-md flex-shrink-0">
            <span className={clsx('avatar-title  rounded-circle fs-22', item.className)}>
              <Icon icon={item.icon} />
            </span>
          </div>
          <h3 className="mb-0">
            <CountUp end={item.value} prefix={item.prefix} suffix={item.suffix} decimals={Number.isInteger(item.value) ? 0 : 2} />
          </h3>
        </div>
        <p className="mb-0">
          {item.title}
          <span className={clsx('float-end badge', item.badgeclassName)}>
            {item.change > 0 ? '+' : ''}
            {item.change}%
          </span>
        </p>
      </CardBody>
    </Card>
  )
}

export default OrdersStatCard
