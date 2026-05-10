import PageBreadcrumb from '@/components/PageBreadcrumb'
import Example from './components/ColumnTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Show & Hide Columns" subtitle="Datatables" />
      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <Example />
        </div>
      </div>
    </>
  )
}

export default Page
