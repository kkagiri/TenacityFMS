import PageBreadcrumb from '@/components/PageBreadcrumb'
import BillingDetails from './components/BillingDetails'
import CustomerDetails from './components/CustomerDetails'
import OrderSummary from './components/OrderSummary'
import ShippingActivity from './components/ShippingActivity'
import ShippingAddress from './components/ShippingAddress'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Order Details" subtitle="Ecommerce" />
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-base">
          <div className="space-y-base lg:col-span-3">
            <OrderSummary />
            <ShippingActivity />
          </div>
          <div className="space-y-base">
            <CustomerDetails />
            <ShippingAddress />
            <BillingDetails />
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
