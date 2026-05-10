import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Link } from 'react-router'
import Organize from './components/Organize'
import Pricing from './components/Pricing'
import ProductImage from './components/ProductImage'
import ProductInformation from './components/ProductInformation'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Add Product" subtitle="Ecommerce" />
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-base">
          <div className="space-y-base lg:col-span-2">
            <ProductInformation />
            <ProductImage />
          </div>
          <div className="space-y-base">
            <Pricing />
            <Organize />
          </div>
        </div>
      </div>
      <div className="mt-7.5 mb-2.5 flex justify-center gap-2.5">
        <Link to="" className="btn bg-danger text-white hover:bg-danger-hover">
          Discard
        </Link>
        <Link to="" className="btn bg-secondary text-white hover:bg-secondary-hover">
          Save as Draft
        </Link>
        <Link to="" className="btn bg-success text-white">
          Publish
        </Link>
      </div>
    </>
  )
}

export default Page
