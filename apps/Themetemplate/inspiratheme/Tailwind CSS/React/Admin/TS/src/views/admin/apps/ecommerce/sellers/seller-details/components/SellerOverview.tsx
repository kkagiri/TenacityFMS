import ApexChart from '@/components/wrappers/ApexChart'
import { getSellerChartOptions } from './data'

const SellerOverview = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Seller Overview</h4>
      </div>
      <div className="card-body">
        <ApexChart getOptions={getSellerChartOptions} series={getSellerChartOptions().series} type="line" height={365} />
      </div>
    </div>
  )
}

export default SellerOverview
