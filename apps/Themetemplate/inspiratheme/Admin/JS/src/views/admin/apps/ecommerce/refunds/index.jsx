import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import RefundStatisticCard from './components/RefundStatisticCard'
import Refunds from './components/RefundTable'
import { refundStatData } from './components/data'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Refunds" subtitle="Ecommerce" />
      <Row className="row-cols-xxl-5 row-cols-md-3 row-cols-1 align-items-center g-1">
        {refundStatData.map((item, idx) => (
          <Col key={idx}>
            <RefundStatisticCard item={item} />
          </Col>
        ))}
      </Row>

      <Row>
        <Col xs={12}>
          <Refunds />
        </Col>
      </Row>
    </>
  )
}
export default Page
