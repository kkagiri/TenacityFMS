import PageBreadcrumb from '@/components/PageBreadcrumb'
import ReactSelect from './components/Select'
import Select2 from './components/Select2'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Select" subtitle="Forms" />
      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <ReactSelect />
          <Select2 />
        </div>
      </div>
    </>
  )
}

export default Page
