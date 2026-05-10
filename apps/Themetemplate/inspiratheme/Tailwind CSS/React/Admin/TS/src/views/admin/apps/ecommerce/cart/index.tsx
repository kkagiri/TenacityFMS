import PageBreadcrumb from '@/components/PageBreadcrumb'
import OrderSummary from './components/OrderSummary'
import ShoppingCart from './components/ShoppingCart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Cart" subtitle="Ecommerce" />

      <div className="container">
        <div className="bg-info/10 border border-info/25 text-info mb-4 rounded px-4 py-3">
          <h6 className="text-xs mb-2.5">
            Buy <span className="text-warning font-bold">$250</span> more to get <span className="font-semibold">Free Shipping</span>
          </h6>
          <div className="bg-default-100 h-1 w-full overflow-hidden rounded-full">
            <div className="bg-warning h-1 w-[70%] transition-all" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-base">
          <div className="lg:col-span-2">
            <ShoppingCart />
          </div>
          <div>
            <div className="flex gap-base flex-col">
              <OrderSummary />
              <div className="card">
                <div className="card-header">
                  <h4 className="card-title">Apply Coupon Code</h4>
                </div>
                <div className="card-body">
                  <div className="rounded bg-warning/15 text-warning mb-4 px-4 py-2.5 text-xs">
                    Use&nbsp;
                    <span className="font-bold">ADMINPRO</span>&nbsp; to get 10% off.
                  </div>
                  <div className="input-group relative">
                    <input type="text" className="form-input" placeholder="Enter code" />
                    <button className="btn bg-primary absolute inset-y-0 end-0 rounded-s-none text-white" type="button">
                      Apply
                    </button>
                  </div>
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
