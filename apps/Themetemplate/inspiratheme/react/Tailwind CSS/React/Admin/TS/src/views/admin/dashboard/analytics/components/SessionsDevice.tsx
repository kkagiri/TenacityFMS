import ComponentCard from '@/components/cards/ComponentCard'
import ApexChart from '@/components/wrappers/ApexChart'
import { getDevicesChart } from './data'

const SessionsDevice = () => {
  return (
    <>
      <ComponentCard title="Sessions Device" bodyClassName="p-0" isCloseable isCollapsible isRefreshable>
        <div className="card-body pb-0">
          <ApexChart getOptions={getDevicesChart} series={getDevicesChart().series} type="bubble" height={223} />
        </div>
        <div className="card-body p-0">
          <div className="table-wrapper whitespace-nowrap">
            <table className="table table-hover mb-0">
              <thead className="bg-light/25 thead-sm">
                <tr className="uppercase text-2xs">
                  <th className="text-default-400">Device</th>
                  <th className="text-default-400">Sessions</th>
                  <th className="text-default-400">Change</th>
                  <th className="text-default-400 text-end">Traffic %</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <h5 className="text-sm">Mobile</h5>
                    <p className="text-2xs text-default-400">- Android / iOS</p>
                  </td>
                  <td>4620</td>
                  <td className="text-success">+3.4%</td>
                  <td className="text-end">58%</td>
                </tr>
                <tr>
                  <td>
                    <h5 className="text-sm">Desktop</h5>
                    <p className="text-2xs text-default-400">- Windows / Mac</p>
                  </td>
                  <td>2510</td>
                  <td className="text-success">+1.9%</td>
                  <td className="text-end">32%</td>
                </tr>
                <tr>
                  <td>
                    <h5 className="text-sm">Tablet</h5>
                    <p className="text-2xs text-default-400">- iPad / Android Tabs</p>
                  </td>
                  <td>820</td>
                  <td className="text-danger">-0.8%</td>
                  <td className="text-end">10%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ComponentCard>
    </>
  )
}

export default SessionsDevice
