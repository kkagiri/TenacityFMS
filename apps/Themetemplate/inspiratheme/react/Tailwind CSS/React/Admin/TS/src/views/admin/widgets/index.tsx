import PageBreadcrumb from '@/components/PageBreadcrumb'
import CommentCard from './components/CommentCard'
import { widget1Data, widget4Data, widget6Data, widget7Data } from './components/data'
import FileManageCard from './components/FileMangeCard'
import ProfileCard from './components/ProfileCard'
import SalesPerformanceOverview from './components/SalesPerformanceOverview'
import TodaySchedule from './components/TodaySchedule'
import TopCountries from './components/TopCountries'
import TrafficSources from './components/TrafficSources'
import Widget1 from './components/Widget1'
import Widget2 from './components/Widget2'
import Widget3 from './components/Widget3'
import Widget5 from './components/Widget5'
import Widget6 from './components/Widget6'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Widgets" subtitle="Pages" />

      <div className="card mb-5">
        <div className="card-body">
          <div className="grid xl:grid-cols-4 md:grids-cols-2 grid-cols-1 gap-base">
            {widget1Data.map((widget, idx) => (
              <Widget1 widget={widget} key={idx} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-3 grid-cols-1 gap-base mb-5">
        <SalesPerformanceOverview />

        <TrafficSources />

        <TopCountries />
      </div>

      <div className="grid xl:grid-cols-3 grid-cols-1 gap-base mb-5">
        <ProfileCard />

        <CommentCard />

        <div className="flex flex-col gap-base">
          <FileManageCard />

          <TodaySchedule />
        </div>
      </div>

      <div className="grid xl:grid-cols-5 md:grid-cols-3 grid-cols-1 gap-base mb-5">
        <Widget2 />
      </div>

      <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-base mb-5">
        {widget4Data.map((item, idx) => (
          <Widget3 item={item} key={idx} />
        ))}
      </div>

      <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-base mb-5">
        {widget6Data.map((item, idx) => (
          <Widget5 key={idx} item={item} />
        ))}
      </div>

      <div className="grid xl:grid-cols-6 md:grid-cols-3 grid-cols-1 gap-base">
        {widget7Data.map((item, idx) => (
          <Widget6 item={item} key={idx} />
        ))}
      </div>
    </>
  )
}

export default Page
