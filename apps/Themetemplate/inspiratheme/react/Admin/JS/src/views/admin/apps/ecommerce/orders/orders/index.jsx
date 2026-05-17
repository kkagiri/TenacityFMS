import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import OrdersList from './components/OrdersList'
import OrdersStatCard from './components/OrdersStatCard'
import { orderStatData } from './components/data'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Orders" subtitle="Ecommerce" />

      <Row className="row-cols-xxl-5 row-cols-md-3 row-cols-1 align-items-center g-1">
        {orderStatData.map((item, idx) => (
          <Col key={idx}>
            <OrdersStatCard item={item} />
          </Col>
        ))}
      </Row>

      <Row>
        <Col xs={12}>
          <OrdersList />
        </Col>
      </Row>
    </>
  )
}
export default Page
