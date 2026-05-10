import ComponentCard from '@/components/cards/ComponentCard'
import Icon from '@/components/wrappers/Icon'
import CountUp from 'react-countup'
import { trafficTableData } from './data'

const TrafficSources = () => {
  return (
    <>
      <ComponentCard title="Traffic Sources" isCloseable isCollapsible isRefreshable>
        <div>
          <div className="flex justify-between gap-base mb-2.5">
            <div>
              <h3 className="mb-2.5 text-xl font-bold">
                <CountUp start={0} end={8975} duration={1} />
              </h3>
              <p className="mb-2.5 text-default-400 font-semibold">Right Now</p>
            </div>
            <div className="self-center">
              <ul className="leading-6">
                <li className="flex items-center gap-1.25">
                  <Icon icon="caret-right-filled" className="text-lg align-middle text-primary" />
                  <span className="text-default-400">Organic</span>
                </li>
                <li className="flex items-center gap-1.25">
                  <Icon icon="caret-right-filled" className="text-lg align-middle text-success" />
                  <span className="text-default-400">Direct</span>
                </li>
                <li className="flex items-center gap-1.25">
                  <Icon icon="caret-right-filled" className="text-lg align-middle" />
                  <span className="text-default-400">Campaign</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mb-5 h-5 w-full overflow-hidden rounded bg-default-200 flex">
            <div className="h-full bg-primary" style={{ width: '25%' }} role="progressbar" aria-valuenow={25} aria-valuemin={0} aria-valuemax={100} />
            <div className="h-full bg-success" style={{ width: '50%' }} role="progressbar" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100} />
            <div className="h-full bg-info" style={{ width: '15%' }} role="progressbar" aria-valuenow={25} aria-valuemin={100} aria-valuemax={100} />
          </div>
          <div className="table-wrapper whitespace-nowrap">
            <table className="table table-sm table-hover mb-0">
              <thead className="bg-light/25 thead-sm">
                <tr className="uppercase text-2xs">
                  <th className="text-default-400">URL</th>
                  <th className="text-default-400 text-end">Views</th>
                  <th className="text-default-400 text-end">Uniques</th>
                </tr>
              </thead>
              <tbody className="border-b border-default-300 thead-sm">
                {trafficTableData.map((item, idx) => (
                  <tr key={idx}>
                    <td className="underline">{item.url}</td>
                    <td className="text-end">{item.views}</td>
                    <td className="text-end">{item.uniques}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-center mt-5">
            <a href="" className="hover:text-primary underline underline-offset-4 font-semibold flex items-center gap-1.25 justify-end">
              View all Links
              <Icon icon="link" />
            </a>
          </div>
        </div>
      </ComponentCard>
    </>
  )
}

export default TrafficSources
