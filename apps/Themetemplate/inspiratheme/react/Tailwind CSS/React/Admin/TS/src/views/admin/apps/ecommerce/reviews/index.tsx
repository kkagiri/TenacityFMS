import PageBreadcrumb from '@/components/PageBreadcrumb'
import ProductReviews from './components/ProductReviews'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Reviews" subtitle="Ecommerce" />
      <div className="container">
        <ProductReviews />
      </div>
    </>
  )
}

export default Page
