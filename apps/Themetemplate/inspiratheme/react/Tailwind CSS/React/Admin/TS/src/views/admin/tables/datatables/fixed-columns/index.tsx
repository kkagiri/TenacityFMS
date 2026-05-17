import PageBreadcrumb from '@/components/PageBreadcrumb'
import Table from './components/Table'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Fixed Columns" subtitle="Datatables" />
      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <Table />
        </div>
      </div>
    </>
  )
}

export default Page
