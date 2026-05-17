import PageBreadcrumb from '@/components/PageBreadcrumb'
import { sellerStatData } from './components/data'
import SellerContact from './components/SellerContact'
import SellerOverview from './components/SellerOverview'
import SellerProducts from './components/SellerProducts'
import SellerStatisticCard from './components/SellerStatisticCard'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Seller Details" subtitle="Ecommerce" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-base">
        <div>
          <SellerContact />
        </div>
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-base mb-base">
            {sellerStatData.map((item, idx) => (
              <SellerStatisticCard key={idx} item={item} />
            ))}
          </div>
          <SellerOverview />
          <h4 className="my-7.5 text-lg">My Products</h4>
          <SellerProducts />
        </div>
      </div>
    </>
  )
}

export default Page
