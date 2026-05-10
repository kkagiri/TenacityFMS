import PageBreadcrumb from '@/components/PageBreadcrumb'
import Charts from './components/Charts'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Bar EChart" subtitle="Charts" />
      <div className="container-fluid">
        <div className="grid xl:grid-cols-2 gap-base">
          <Charts />
        </div>
      </div>
    </>
  )
}

export default Page
