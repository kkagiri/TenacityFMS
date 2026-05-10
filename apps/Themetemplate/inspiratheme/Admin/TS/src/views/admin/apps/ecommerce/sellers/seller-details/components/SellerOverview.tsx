import ApexChart from '@/components/wrappers/ApexChart'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { getSellerChartOptions, sellerStatData } from './data'
import SellerStatisticCard from './SellerStatisticCard'

const SellerOverview = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">Seller Overview</CardTitle>
      </CardHeader>
      <CardBody>
        <Row className="row-cols-xxl-4 row-cols-md-2 row-cols-1 g-3 align-items-center">
          {sellerStatData.map((item, idx) => (
            <Col key={idx}>
              <SellerStatisticCard item={item} />
            </Col>
          ))}
        </Row>
        <ApexChart getOptions={getSellerChartOptions} series={getSellerChartOptions().series} type="line" height={370} />
      </CardBody>
    </Card>
  )
}

export default SellerOverview
