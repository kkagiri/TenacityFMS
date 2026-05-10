import ComponentCard from '@/components/cards/ComponentCard'
import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { topCountriesData } from './data'

const TopCountries = () => {
  return (
    <>
      <ComponentCard title="Top 10 Countries" isCloseable isCollapsible isRefreshable>
        <div>
          {topCountriesData.map((item, idx) => (
            <div className={clsx('flex items-center gap-2.5', idx === topCountriesData.length - 1 ? '' : 'mb-5')} key={idx}>
              <span className="text-sm font-medium italic text-default-400">{String(item.rank).padStart(2, '0')}.</span>
              <img src={item.image} alt={item.name} className="size-4 rounded" />
              <h5 className="font-medium">
                <a href="" className="hover:text-primary">
                  {item.name}
                </a>
              </h5>
              <div className="ms-auto">
                <div className="flex items-center gap-5">
                  <p className="font-medium">{item.visitors}</p>
                  <p className={clsx('badge badge-label text-2xs mb-0', item.change > 0 ? 'bg-success/15 text-success' : item.change < 0 ? 'bg-danger/15 text-danger' : 'bg-warning/15 text-warning')}>
                    {item.change > 0 ? '+' : ''} {item.change}%
                  </p>
                </div>
              </div>
            </div>
          ))}
          <div className="text-center mt-2.5">
            <a href="/apps/chat" className="hover:text-primary underline font-semibold link-offset-3 flex items-center justify-center gap-1">
              View all Countries <Icon icon="world" />
            </a>
          </div>
        </div>
      </ComponentCard>
    </>
  )
}

export default TopCountries
