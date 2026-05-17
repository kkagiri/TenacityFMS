import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import BillingInfo from './components/BillingInfo'
import InvoiceDetail from './components/InvoiceDetail'
import OrderSummary from './components/OrderSummary'
import PaymentInfo from './components/PaymentInfo'
import ShippingInfo from './components/ShippingInfo'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Checkout" subtitle="Ecommerce" />
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-base">
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-body">
                <div data-hs-stepper>
                  <ul className="relative grid grid-cols-1 gap-1.5 md:grid-cols-4">
                    <li className="active" data-hs-stepper-nav-item='{"index": 1}'>
                      <a href="" className="hs-stepper-active:bg-light/50 hs-stepper-success:bg-success/10 hs-stepper-success:border-success hs-stepper-success:text-success px-4 py-2.5 flex items-center justify-center gap-2.5 rounded border border-dashed border-default-300">
                        <Icon icon="user-circle" className="text-2xl" />
                        <span className="text-md block font-semibold">Billing Info</span>
                      </a>
                    </li>
                    <li data-hs-stepper-nav-item='{"index": 2}'>
                      <a href="" className="hs-stepper-active:bg-light/50 hs-stepper-success:bg-success/10 hs-stepper-success:border-success hs-stepper-success:text-success px-4 py-2.5 flex items-center justify-center gap-2.5 rounded border border-dashed border-default-300">
                        <Icon icon="truck" className="text-2xl" />
                        <span className="text-md block font-semibold">Shipping Info</span>
                      </a>
                    </li>
                    <li data-hs-stepper-nav-item='{"index": 3}'>
                      <a href="" className="hs-stepper-active:bg-light/50 hs-stepper-success:bg-success/10 hs-stepper-success:border-success hs-stepper-success:text-success px-4 py-2.5 flex items-center justify-center gap-2.5 rounded border border-dashed border-default-300">
                        <Icon icon="credit-card" className="text-2xl" />
                        <span className="text-md block font-semibold">Payment Info</span>
                      </a>
                    </li>
                    <li data-hs-stepper-nav-item='{"index": 4}'>
                      <a href="" className="hs-stepper-active:bg-light/50 hs-stepper-success:bg-success/10 hs-stepper-success:border-success hs-stepper-success:text-success px-4 py-2.5 flex items-center justify-center gap-2.5 rounded border border-dashed border-default-300">
                        <Icon icon="checks" className="text-2xl" />
                        <span className="text-md block font-semibold">Finish</span>
                      </a>
                    </li>
                  </ul>
                  <div className="pt-base">
                    <div data-hs-stepper-content-item='{"index": 1}' style={{ display: 'none' }}>
                      <BillingInfo />
                    </div>
                    <div data-hs-stepper-content-item='{"index": 2}' style={{ display: 'none' }}>
                      <ShippingInfo />
                    </div>
                    <div data-hs-stepper-content-item='{"index": 3}' style={{ display: 'none' }}>
                      <PaymentInfo />
                    </div>
                    <div data-hs-stepper-content-item='{"index": 4}' style={{ display: 'none' }}>
                      <InvoiceDetail />
                    </div>
                    <div className="mt-5 flex flex-wrap items-center justify-between">
                      <button type="button" className="btn bg-secondary text-white hover:bg-secondary-hover" data-hs-stepper-back-btn>
                        <Icon icon="arrow-left"></Icon>
                        Back
                      </button>
                      <button type="button" className="btn bg-primary text-white hover:bg-primary-hover" data-hs-stepper-next-btn>
                        Next
                        <Icon icon="arrow-right"></Icon>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-base">
            <OrderSummary />
            <div className="card">
              <div className="card-body">
                <p className="text-default-400">
                  🎉 Congratulations! You’ve earned&nbsp;
                  <span className="text-success font-bold">239 bonus points</span> !
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
