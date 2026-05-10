import PageBreadcrumb from '@/components/PageBreadcrumb'
import RowAdd from './components/RowAdd'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Add Rows" subtitle="DataTables" />
      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <RowAdd />
        </div>
      </div>
    </>
  )
}

export default Page
