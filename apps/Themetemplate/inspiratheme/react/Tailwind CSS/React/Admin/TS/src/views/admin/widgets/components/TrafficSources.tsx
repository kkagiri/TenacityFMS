import ComponentCard from '@/components/cards/ComponentCard'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { useEffect, useState } from 'react'
import { trafficSources } from './data'

const TrafficSources = () => {
  const getRandomNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  const LiveViews = () => {
    const [currentVisitors, setCurrentVisitors] = useState(() => getRandomNumber(8800, 9000))

    const updateLiveVisitors = () => {
      const change = getRandomNumber(-20, 20)
      setCurrentVisitors((prev) => Math.max(1000, prev + change))
    }

    useEffect(() => {
      const interval = setInterval(updateLiveVisitors, 1000)
      return () => clearInterval(interval)
    }, [])

    return (
      <div>
        <h3 className="mb-2.5 text-xl font-bold">
          <span data-target="8,975"> {currentVisitors.toLocaleString()}</span>
        </h3>
        <p className="mb-2.5 text-default-400 font-semibold">Right Now</p>
      </div>
    )
  }
  return (
    <ComponentCard title="Traffic Sources" isCloseable isCollapsible isRefreshable>
      <div>
        <div className="flex justify-between gap-base mb-2.5">
          <LiveViews />
          <div className="self-center">
            <ul className="leading-6">
              <li className="flex items-center gap-1.25">
                <Icon icon="caret-right-filled" className="text-lg align-middle text-primary"></Icon>
                <span className="text-default-400">Organic</span>
              </li>

              <li className="flex items-center gap-1.25">
                <Icon icon="caret-right-filled" className="text-lg align-middle text-success"></Icon>
                <span className="text-default-400">Direct</span>
              </li>

              <li className="flex items-center gap-1.25">
                <Icon icon="caret-right-filled" className="text-lg align-middle"></Icon>
                <span className="text-default-400">Campaign</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mb-5 h-5 w-full overflow-hidden rounded bg-default-200 flex">
          <div className="h-full bg-primary" style={{ width: '25%' }} role="progressbar" aria-valuenow={25} aria-valuemin={0} aria-valuemax={100}></div>
          <div className="h-full bg-success" style={{ width: '50%' }} role="progressbar" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100}></div>
          <div className="h-full bg-info" style={{ width: '15%' }} role="progressbar" aria-valuenow={25} aria-valuemin={100} aria-valuemax={100}></div>
        </div>

        <div className="table-wrapper whitespace-nowrap">
          <table className="table table-sm table-hover">
            <thead className="bg-light/25 align-middle">
              <tr className="uppercase text-2xs">
                <th className="text-default-400">URL</th>
                <th className="text-default-400 text-end">Views</th>
                <th className="text-default-400 text-end">Uniques</th>
              </tr>
            </thead>

            <tbody className="border-b border-default-300">
              {trafficSources.map((source, index) => (
                <tr key={index}>
                  <td className="underline">{source.url}</td>
                  <td className="text-end">{source.views}</td>
                  <td className="text-end">{source.uniques}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center mt-5">
          <Link to="" className="hover:text-primary underline underline-offset-4 font-semibold flex items-center gap-1.25 justify-end">
            View all Links <Icon icon="link" />
          </Link>
        </div>
      </div>
    </ComponentCard>
  )
}

export default TrafficSources
