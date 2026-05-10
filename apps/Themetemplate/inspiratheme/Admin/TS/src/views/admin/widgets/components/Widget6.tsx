import { CountUp } from '@/components/wrappers/CountUp'
import Icon from '@/components/wrappers/Icon'
import { Card, CardBody } from 'react-bootstrap'
import { Widget7Type } from './data'

const Widget6 = ({ item }: { item: Widget7Type }) => {
  const { count, variant, title, icon } = item

  return (
    <>
      <Card>
        <CardBody>
          <div className="avatar-xl mb-3">
            <span className={`avatar-title bg-${variant}-subtle text-${variant} rounded-circle fs-24 d-flex`}>
              <Icon icon={icon} className="d-flex" />
            </span>
          </div>
          <h3 className="mb-1">
            <CountUp prefix={count.prefix} suffix={count.suffix} end={count.value} duration={1} enableScrollSpy scrollSpyOnce />
          </h3>
          <p className="mb-0 text-muted">{title}</p>
        </CardBody>
      </Card>
    </>
  )
}

export default Widget6
