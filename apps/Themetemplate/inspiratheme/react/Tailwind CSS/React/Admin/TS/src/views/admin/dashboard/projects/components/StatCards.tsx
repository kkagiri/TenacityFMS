import { CountUp } from '@/components/wrappers/CountUp'
import Icon from '@/components/wrappers/Icon'
import { statCards } from './data'

const StatCards = () => {
  return (
    <>
      <div className="grid xl:grid-cols-5 md:grid-cols-3 grid-cols-1 gap-base mb-5">
        {statCards.map((card, idx) => (
          <div className="card" key={idx}>
            <div className="card-body">
              <a href="" className="text-default-400 float-end -mt-1.25 text-xl">
                <Icon icon="external-link" />
              </a>
              <h5 title="Number of Tasks">{card.title}</h5>
              <div className="flex items-center gap-2.5 my-5">
                <div className="shrink-0">
                  <span className="size-9 text-default-600 bg-light flex justify-center items-center rounded-full">
                    <Icon icon={card.icon} className="size-6" />
                  </span>
                </div>
                <h3 className="text-xl text-default-800">
                  <CountUp end={typeof card.value === 'number' ? card.value : 0} prefix={card.prefix} suffix={card.suffix} decimals={Number.isInteger(card.value) ? 0 : 2} enableScrollSpy scrollSpyOnce />
                </h3>
                <span className={`badge ${card.badgeVariant} font-medium text-xs! ms-auto`}> {card.badgeText}</span>
              </div>
              <p className="flex gap-1">
                <span className={`text-${card.pointColor}`}>
                  {' '}
                  <Icon icon="point-filled" />
                </span>
                <span className="text-nowrap text-default-400 flex-1">{card.description}</span>
                <span className="float-end">
                  <b>{card.total}</b>
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default StatCards
