import PageBreadcrumb from '@/components/PageBreadcrumb'
import ProductStockTable from './components/ProductStockTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Stocks" subtitle="Ecommerce" />

      <ProductStockTable />
    </>
  )
}

export default Page
