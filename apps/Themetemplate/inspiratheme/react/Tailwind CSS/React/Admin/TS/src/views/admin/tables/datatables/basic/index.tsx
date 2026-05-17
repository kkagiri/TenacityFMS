import PageBreadcrumb from '@/components/PageBreadcrumb'
import BasicTable from './components/BasicTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Basic" subtitle="DataTables" />

      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <BasicTable />
        </div>
      </div>
    </>
  )
}

export default Page
