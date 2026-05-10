import ComponentCard from '@/components/cards/ComponentCard'
import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { Link } from 'react-router'
import { topCountriesData } from './data'
const TopCountries = () => {
  return (
    <>
      <ComponentCard title="Top 10 Countries" isCloseable isCollapsible isRefreshable>
        {topCountriesData.map((item, idx) => (
          <div key={idx} className={clsx('d-flex align-items-center gap-2', idx === topCountriesData.length - 1 ? '' : 'mb-3')}>
            <span className="fs-sm fw-medium fst-italic text-muted">{String(item.rank).padStart(2, '0')}.</span>
            <img src={item.image} alt={item.name} className="avatar-xxs rounded" />
            <h5 className="mb-0 fw-medium">
              <a href="" className="link-reset">
                {item.name}
              </a>
            </h5>
            <div className="ms-auto">
              <div className="d-flex align-items-center gap-3">
                <p className="mb-0 fw-medium">{item.visitors}</p>
                <p className={clsx('badge badge-label fs-xxs mb-0', item.change > 0 ? 'badge-soft-success' : item.change < 0 ? 'badge-soft-danger' : 'badge-soft-warning')}>
                  {item.change > 0 ? '+' : ''} {item.change}%
                </p>
              </div>
            </div>
          </div>
        ))}

        <div className="text-center mt-2">
          <Link to="" className="link-reset text-decoration-underline fw-semibold link-offset-3">
            View all Countries <Icon icon="world" />
          </Link>
        </div>
      </ComponentCard>
    </>
  )
}
export default TopCountries
