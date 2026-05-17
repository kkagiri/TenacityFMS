import PageBreadcrumb from '@/components/PageBreadcrumb'
import { BasicTreemap, ColorRangeTreemap, DistributedTreemap, MultipleTreemap } from './components/TreeMapChart'

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Treemap ApexCharts" subtitle="Charts" />
      <div className="container-fluid">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Basic Treemap</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <BasicTreemap />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Treemap Multiple Series</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <MultipleTreemap />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Distributed Treemap</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <DistributedTreemap />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Color Range Treemap</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <ColorRangeTreemap />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
