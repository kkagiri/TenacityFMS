import PageBreadcrumb from '@/components/PageBreadcrumb'
import ProductDetails from './components/ProductDetails'
import ProductDisplay from './components/ProductDisplay'
import ProductReviews from './components/ProductReviews'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Product Details" subtitle="Ecommerce" />
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-base">
            <div>
              <ProductDisplay />
            </div>
            <div className="lg:col-span-2">
              <div className="md:p-7.5">
                <ProductDetails />
                <div className="mt-10 md:mt-15">
                  <ProductReviews />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
