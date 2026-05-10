import PageBreadcrumb from '@/components/PageBreadcrumb'
import EcomStats from './components/EcomStats'
import OrdersStatics from './components/OrdersStatics'
import ProductInventory from './components/ProductInventory'
import RecentOrders from './components/RecentOrders'
import TransactionsWorldwide from './components/TransactionsWorldwide'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="eCommerce" subtitle="Dashboard" />

      <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-base mb-5">
        <EcomStats />
      </div>

      <div className="card mb-5">
        <OrdersStatics />
      </div>

      <div className="grid xl:grid-cols-2 grid-cols-1 gap-base mb-5">
        <ProductInventory />

        <RecentOrders />
      </div>

      <TransactionsWorldwide />
    </>
  )
}

export default Page
