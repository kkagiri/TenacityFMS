import { CountUp } from '@/components/wrappers/CountUp'
import Icon from '@/components/wrappers/Icon'
import { Widget4Type } from './data'

const Widget3 = ({ item }: { item: Widget4Type }) => {
  const { count, label, description, variant, title, icon } = item

  return (
    <>
      <div className="card">
        <div className="card-header d-flex border-dashed justify-content-between align-items-center">
          <h5 className="card-title">{title}</h5>
          <span className={`badge badge-soft-${variant}`}>{label}</span>
        </div>
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center">
            <div className="avatar fs-60 avatar-img-size flex-shrink-0">
              <span className="avatar-title text-bg-dark rounded-circle fs-32 d-flex">
                <Icon icon={icon} className="d-flex" />
              </span>
            </div>
            <div className="text-end">
              <h3 className="mb-2 fw-normal">
                <CountUp end={count.value} prefix={count.prefix} suffix={count.suffix} duration={1} enableScrollSpy scrollSpyOnce />
              </h3>
              <p className="mb-0 text-muted">{description}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Widget3
