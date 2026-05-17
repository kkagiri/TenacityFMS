import PageBreadcrumb from '@/components/PageBreadcrumb'
import CustomerTable from './components/CustomerTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Customers" subtitle="Ecommerce" />
      <div className="container">
        <CustomerTable />
      </div>
    </>
  )
}

export default Page
