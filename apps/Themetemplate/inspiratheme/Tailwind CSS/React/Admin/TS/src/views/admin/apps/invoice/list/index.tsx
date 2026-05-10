import PageBreadcrumb from '@/components/PageBreadcrumb'
import InvoiceList from './components/InvoiceList'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Invoices list" subtitle="Invoices" />

      <InvoiceList />
    </>
  )
}

export default Page
