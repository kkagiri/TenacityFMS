import PageBreadcrumb from '@/components/PageBreadcrumb'
import ProductViewsTable from './components/ProductViewsTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Product Views" subtitle="Ecommerce" />
      <div className="container">
        <ProductViewsTable />
      </div>
    </>
  )
}

export default Page
