
import { toPascalCase } from '@/utils/helpers'
import { Link } from 'react-router'
import CountUp from 'react-countup'
import { Widget6Type } from './data'

const Widget5 = ({ item }: { item: Widget6Type }) => {
  const { title, progress, status, description } = item

  return (
    <>
      <div className="card">
        <div className="card-body">
          <div>
            <Link to="" className="hover:text-primary uppercase font-semibold">
              {title}
            </Link>
            <div className="py-2">
              <span className="text-lg font-bold me-2.5">
                <CountUp end={progress} duration={1} decimals={Number.isInteger(progress) ? 0 : 2} />%
              </span>
              <span className="font-semibold text-default-400 text-sm">{toPascalCase(status)}</span>
            </div>
          </div>
          <div className="w-full bg-success/25 rounded-full h-2">
            <div className="bg-success h-2 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="mt-2.5 text-default-400">{description}</div>
        </div>
      </div>
    </>
  )
}

export default Widget5
