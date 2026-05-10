import PageBreadcrumb from '@/components/PageBreadcrumb'
import AjaxTable from './components/AjaxTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Ajax" subtitle="DataTables" />
      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <AjaxTable />
        </div>
      </div>
    </>
  )
}

export default Page
