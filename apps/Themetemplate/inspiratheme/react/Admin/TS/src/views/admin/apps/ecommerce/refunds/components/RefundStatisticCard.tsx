import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { Card, CardBody } from 'react-bootstrap'
import { RefundStatType } from './data'

const RefundStatisticCard = ({ item }: { item: RefundStatType }) => {
  const { icon, badgeClassName, iconClassName, title, change, value } = item
  return (
    <Card className="mb-1">
      <CardBody>
        <div className="d-flex align-items-center gap-2 mb-3">
          <div className="avatar-md flex-shrink-0">
            <span className={clsx('avatar-title rounded-circle fs-22', iconClassName)}>
              <Icon icon={icon} />
            </span>
          </div>
          <h3 className="mb-0">{value}</h3>
        </div>
        <p className="mb-0">
          {title}
          <span className={clsx('float-end badge', badgeClassName)}>
            {change > 0 ? '+' : ''}
            {change}%
          </span>
        </p>
      </CardBody>
    </Card>
  )
}

export default RefundStatisticCard
