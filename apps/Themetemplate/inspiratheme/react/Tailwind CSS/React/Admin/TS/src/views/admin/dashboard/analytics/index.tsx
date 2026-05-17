import PageBreadcrumb from '@/components/PageBreadcrumb'
import AnalyticsOverview from './components/AnalyticsOverview'
import SessionsDevice from './components/SessionsDevice'
import Stat from './components/Stat'
import TopCountries from './components/TopCountries'
import TopPerformance from './components/TopPerformance'
import TrafficSources from './components/TrafficSources'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Analytics" subtitle="Dashboard" />
      <div className="card mb-5">
        <div className="card-body p-0">
          <div className="grid xl:grid-cols-4 grid-cols-1 gap-0">
            <div className="flex flex-col xl:order-1 order-2">
              <Stat />
            </div>

            <div className="xl:col-span-3 border-s border-default-300 border-dashed xl:order-2 order-1">
              <AnalyticsOverview />
            </div>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-3 grid-cols-1 gap-base mb-5">
        <SessionsDevice />
        <TrafficSources />
        <TopCountries />
      </div>

      <TopPerformance />
    </>
  )
}

export default Page
