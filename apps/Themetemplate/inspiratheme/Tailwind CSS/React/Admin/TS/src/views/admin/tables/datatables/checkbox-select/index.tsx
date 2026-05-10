import PageBreadcrumb from '@/components/PageBreadcrumb'
import Example from './components/SelectTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Checkbox Select" subtitle="DataTables" />
      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <Example />
        </div>
      </div>
    </>
  )
}

export default Page
