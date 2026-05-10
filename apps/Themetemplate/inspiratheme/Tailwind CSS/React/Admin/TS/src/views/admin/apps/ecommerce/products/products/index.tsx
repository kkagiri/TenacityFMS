import PageBreadcrumb from '@/components/PageBreadcrumb'
import { statData } from './components/data'
import ProductsListing from './components/ProductsListing'
import ProductStats from './components/ProductStats'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Products" subtitle="Ecommerce" />

      <div className="mb-1.25 grid grid-cols-1 gap-1.25 md:grid-cols-2 lg:grid-cols-5">
        {statData.map((stat, idx) => {
          return <ProductStats key={idx} stat={stat} />
        })}
      </div>
      <ProductsListing />
    </>
  )
}

export default Page
