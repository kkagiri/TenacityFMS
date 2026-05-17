import PageBreadcrumb from '@/components/PageBreadcrumb'
import { CountUp } from '@/components/wrappers/CountUp'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { productData } from './components/data'
import ProductCard from './components/ProductCard'
import ProductFilter from './components/ProductFilter'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Products Grid" subtitle="Ecommerce" />
      <div>
        <div className="card mb-2.5">
          <div className="card-body">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-start lg:hidden">
                  <button className="btn btn-icon border-default-300 border bg-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="productFillterOffcanvas" aria-label="Toggle navigation" data-hs-overlay="#productFillterOffcanvas">
                    <Icon icon="menu-4" className="text-default-600 size-6" />
                  </button>
                </div>
                <h3 className="text-lg">
                  <CountUp start={0} end={1025} duration={1} />
                  &nbsp;Products
                </h3>
              </div>
              <div className="flex items-center gap-2 md:ms-auto">
                <nav className="flex items-center gap-x-1" aria-label="Tabs" role="tablist" aria-orientation="horizontal">
                  <Link
                    to="/apps/ecommerce/products-grid"
                    className="hs-tab-active:bg-primary hs-tab-active:text-white bg-primary/15 text-primary hover:bg-primary btn btn-icon active size-9.25! hover:text-white"
                    id="contact-tab-1"
                    aria-selected="true"
                    data-hs-tab="#tabs-contact-1"
                    aria-controls="tabs-contact-1"
                    role="tab"
                  >
                    <Icon icon="apps" className="text-lg" />
                  </Link>
                  <Link
                    to="/apps/ecommerce/products"
                    className="hs-tab-active:bg-primary hs-tab-active:text-white bg-primary/15 text-primary hover:bg-primary btn btn-icon size-9.25! hover:text-white"
                    id="contact-tab-2"
                    aria-selected="false"
                    data-hs-tab="#tabs-contact-2"
                    aria-controls="#tabs-contact-2"
                    role="tab"
                  >
                    <Icon icon="list-check" className="text-lg" />
                  </Link>
                </nav>
                <Link to="/apps/ecommerce/product-add" className="btn bg-danger text-white hover:bg-danger-hover">
                  <Icon icon="plus" />
                  Add Product
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div>
            <div
              id="productFillterOffcanvas"
              className="hs-overlay hs-overlay-open:translate-x-0 fixed start-0 top-0 bottom-0 z-90 h-full w-80 -translate-x-full transform rounded-lg transition-all duration-300 [--auto-close:lg] lg:static lg:end-auto lg:bottom-0 lg:block! lg:w-full lg:translate-x-0"
              role="dialog"
              tabIndex={-1}
              aria-label="Sidebar"
            >
              <ProductFilter />
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-4">
              {productData.map((product, idx) => (
                <ProductCard key={idx} product={product} />
              ))}
            </div>
            <div className="my-5 flex flex-wrap items-center justify-center gap-2 md:justify-between">
              <span className="text-default-400 font-italic flex items-center gap-1">
                Last modification:
                <Icon icon="clock" />
                4:55 pm - 22.04.2025
              </span>
              <nav className="flex items-center gap-1.5" aria-label="Pagination">
                <button type="button" className="btn btn-icon border-default-300 hover:bg-default-100 hover:text-primary gap-x-1.5 border bg-card transition-all duration-300" aria-label="Previous">
                  <Icon icon="chevron-left" />
                </button>
                <button type="button" className="btn btn-icon bg-primary text-white hover:bg-primary-hover">
                  1
                </button>
                <button type="button" className="btn btn-icon border-default-300 hover:bg-default-100 hover:text-primary border bg-card transition-all duration-300">
                  2
                </button>
                <button type="button" className="btn btn-icon border-default-300 hover:bg-default-100 hover:text-primary border bg-card transition-all duration-300">
                  3
                </button>
                <button type="button" className="btn btn-icon border-default-300 hover:bg-default-100 hover:text-primary gap-x-1.5 border bg-card transition-all duration-300" aria-label="Next">
                  <Icon icon="chevron-right" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
