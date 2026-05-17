import PageBreadcrumb from '@/components/PageBreadcrumb'
import AttributeTable from './components/AttributeTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Manage Attributes" subtitle="Ecommerce" />
      <div className="container">
        <AttributeTable />
      </div>
    </>
  )
}

export default Page
