import PageBreadcrumb from '@/components/PageBreadcrumb'
import Gauges from './components/Gauges'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Gauge EChart" subtitle="Charts" />
      <div className="container-fluid">
        <div className="grid xl:grid-cols-2 gap-base">
          <Gauges />
        </div>
      </div>
    </>
  )
}

export default Page
