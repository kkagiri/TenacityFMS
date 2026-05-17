import PageBreadcrumb from '@/components/PageBreadcrumb'
import { orderStatData } from './components/data'
import OrdersList from './components/OrdersList'
import OrdersStatCard from './components/OrdersStatCard'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Orders" subtitle="Ecommerce" />

      <div className="mb-1.25 grid grid-cols-1 gap-1.25 md:grid-cols-2 lg:grid-cols-5">
        {orderStatData.map((item, idx) => (
          <OrdersStatCard item={item} key={idx} />
        ))}
      </div>
      <OrdersList />
    </>
  )
}

export default Page
