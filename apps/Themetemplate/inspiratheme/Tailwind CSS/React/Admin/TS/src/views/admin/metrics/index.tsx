import PageBreadcrumb from '@/components/PageBreadcrumb'
import { statisticCardData } from './components/data'
import OrdersCard from './components/OrdersCard'
import ProductsChart from './components/ProductsChart'
import ProfitOverviewChart from './components/ProfitOverviewChart'
import QuarterlyReports from './components/QuarterlyReports'
import StatisticCard from './components/StatisticCard'
import StatisticWidget from './components/StatisticWidget'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Metrics" subtitle="Pages" />
      <div className="container-fluid">
        <div className="grid xl:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-base mb-5">
          {statisticCardData.map((item, idx) => (
            <StatisticCard item={item} key={idx} />
          ))}
        </div>

        <StatisticWidget />

        <div className="grid xl:grid-cols-3 grid-cols-1 gap-base">
          <div className="col-span-1">
            <QuarterlyReports />
          </div>

          <div className="xl:col-span-2">
            <div className="grid xl:grid-cols-3 grid-cols-1 gap-base">
              <OrdersCard />

              <ProductsChart />

              <ProfitOverviewChart />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
