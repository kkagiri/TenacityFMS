import PageBreadcrumb from '@/components/PageBreadcrumb'
import SellerTable from './components/SellerTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Sellers" subtitle="Ecommerce" />
      <div className="container">
        <SellerTable />
      </div>
    </>
  )
}

export default Page
