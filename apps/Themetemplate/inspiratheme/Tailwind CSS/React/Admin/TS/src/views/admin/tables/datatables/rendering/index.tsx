import PageBreadcrumb from '@/components/PageBreadcrumb'
import RenderingTable from './components/RenderingTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Data Rendering" subtitle="DataTables" />
      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <RenderingTable />
        </div>
      </div>
    </>
  )
}

export default Page
