import { CountUp } from '@/components/wrappers/CountUp'
import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { Card, CardBody } from 'react-bootstrap'
import { SellerStatType } from './data'

const SellerStatisticCard = ({ item }: { item: SellerStatType }) => {
  const { value, prefix, suffix, totalCount, subTitle, bulletClassName, iconClassName, cardBgColor, title, icon } = item
  return (
    <Card className={clsx('border-0 bg-opacity-10', cardBgColor)}>
      <CardBody>
        <h5 title="Number of Tasks">{title}</h5>

        <div className="d-flex align-items-center gap-2 my-3">
          <div className="avatar-md flex-shrink-0">
            <span className={clsx('avatar-title  bg-opacity-90 rounded-circle fs-22', iconClassName)}>{icon && <Icon icon={icon} className="d-flex align-items-center" />}</span>
          </div>
          <h3 className="mb-0">
            <CountUp prefix={prefix} suffix={suffix} end={value} duration={1} decimals={Number.isInteger(item.value) ? 0 : 1} enableScrollSpy scrollSpyOnce />
          </h3>
        </div>
        <p className="mb-0">
          <span className={bulletClassName}>
            <Icon icon="circle-filled" />
          </span>
          <span className="text-nowrap text-muted"> {subTitle}</span>
          <span className="float-end">
            <b>{totalCount}</b>
          </span>
        </p>
      </CardBody>
    </Card>
  )
}
export default SellerStatisticCard
