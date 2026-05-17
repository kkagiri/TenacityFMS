import PageBreadcrumb from '@/components/PageBreadcrumb'
import RefundStatisticCard from './components/RefundStatisticCard'
import RefundTable from './components/RefundTable'
import { refundStatData } from './components/data'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Refunds" subtitle="Ecommerce" />

      <div className="mb-1.25 grid grid-cols-1 gap-1.25 md:grid-cols-2 lg:grid-cols-5">
        {refundStatData.map((item, idx) => (
          <RefundStatisticCard key={idx} item={item} />
        ))}
      </div>
      <RefundTable />
    </>
  )
}

export default Page
