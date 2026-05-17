import PageBreadcrumb from '@/components/PageBreadcrumb'
import PurchaseOrderTable from './components/PurchaseOrderTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Purchased Orders" subtitle="Ecommerce" />

      <PurchaseOrderTable />
    </>
  )
}

export default Page
