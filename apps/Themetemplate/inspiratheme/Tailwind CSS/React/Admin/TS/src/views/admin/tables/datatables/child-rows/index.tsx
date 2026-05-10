import PageBreadcrumb from '@/components/PageBreadcrumb'
import Example from './components/RowTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Child Row" subtitle="DataTables" />
      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <Example />
        </div>
      </div>
    </>
  )
}

export default Page
