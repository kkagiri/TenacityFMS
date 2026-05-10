import PageBreadcrumb from '@/components/PageBreadcrumb'
import Example from './components/ColumnTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Column Searching" subtitle="DataTables" />
      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <Example />
        </div>
      </div>
    </>
  )
}

export default Page
