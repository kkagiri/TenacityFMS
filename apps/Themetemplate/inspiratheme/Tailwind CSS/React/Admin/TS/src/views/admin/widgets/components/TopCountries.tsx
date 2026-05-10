import ComponentCard from '@/components/cards/ComponentCard'
import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { Link } from 'react-router'
import { topCountriesData } from './data'

const TopCountries = () => {
  return (
    <ComponentCard title="Top 10 Countries" isCloseable isCollapsible isRefreshable>
      <div>
        {topCountriesData.map((country, idx) => (
          <div key={country.name} className={`flex items-center gap-2.5 ${idx !== topCountriesData.length - 1 ? 'mb-5' : ''}`}>
            <span className="text-sm font-medium italic text-default-400">{String(country.rank).padStart(2, '0')}.</span>
            <img src={country.image} alt={country.name} className="size-4 rounded" />
            <h5 className="font-medium">
              <a href="" className="hover:text-primary">
                {country.name}
              </a>
            </h5>
            <div className="ms-auto">
              <div className="flex items-center gap-5">
                <p className="font-medium">{country.visitors.toLocaleString()}</p>
                <p className={cn('badge badge-label text-2xs mb-0', country.className)}>
                  {country.change > 0 ? '+' : ''} {country.change}%
                </p>
              </div>
            </div>
          </div>
        ))}

        <div className="text-center mt-2.5">
          <Link to="" className="hover:text-primary underline font-semibold link-offset-3 flex items-center justify-center">
            View all Countries <Icon icon="world"></Icon>
          </Link>
        </div>
      </div>
    </ComponentCard>
  )
}

export default TopCountries
