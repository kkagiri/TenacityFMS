import PageBreadcrumb from '@/components/PageBreadcrumb'
import Table from './components/Table'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Datatables Select" subtitle="DataTables" />
      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <Table />
        </div>
      </div>
    </>
  )
}

export default Page
