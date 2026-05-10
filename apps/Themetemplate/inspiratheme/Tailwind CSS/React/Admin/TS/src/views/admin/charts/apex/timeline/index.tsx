import PageBreadcrumb from '@/components/PageBreadcrumb'
import { AdvanceTimeLineChart, DistributedTimelineChart, GroupRowTimelineChart, MultiSeriesTimelineChart, TimeLineChart } from './components/TimeLineChart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Timeline Apexchart" subtitle="Charts" />
      <div className="container-fluid">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Basic Timeline</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <TimeLineChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Distributed Timeline</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <DistributedTimelineChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Multi Series Timeline</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <MultiSeriesTimelineChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Advanced Timeline</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <AdvanceTimeLineChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Multiple Series - Group Rows</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <GroupRowTimelineChart />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
