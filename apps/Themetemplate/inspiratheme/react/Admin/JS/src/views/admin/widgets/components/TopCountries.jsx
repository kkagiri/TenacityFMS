import ComponentCard from '@/components/cards/ComponentCard'
import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { Link } from 'react-router'
import { topCountriesData } from './data'
const TopCountries = () => {
  return (
    <ComponentCard title="Top 10 Countries" isCloseable isCollapsible isRefreshable>
      {topCountriesData.map((country, idx) => (
        <div key={country.name} className={clsx('d-flex align-items-center gap-2', topCountriesData.length - 1 !== idx && 'mb-3')}>
          <span className="fs-sm fw-medium fst-italic text-muted">{String(country.rank).padStart(2, '0')}.</span>
          <img src={country.image} alt={country.name} className="avatar-xxs rounded" height={16} width={16} />
          <h5 className="mb-0 fw-medium">
            <a href="" className="link-reset">
              {country.name}
            </a>
          </h5>
          <div className="ms-auto">
            <div className="d-flex align-items-center gap-3">
              <p className="mb-0 fw-medium">{country.visitors.toLocaleString()}</p>
              <p className={clsx('badge badge-label fs-xxs', country.change > 0 ? 'badge-soft-success' : 'badge-soft-danger', 'mb-0')}>
                {country.change > 0 ? '+' : ''} {country.change}%
              </p>
            </div>
          </div>
        </div>
      ))}

      <div className="text-center mt-2">
        <Link to="/chat" className="link-reset text-decoration-underline fw-semibold link-offset-3">
          View all Countries <Icon icon="link" />
        </Link>
      </div>
    </ComponentCard>
  )
}
export default TopCountries
