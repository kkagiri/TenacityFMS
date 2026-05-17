import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import { cardData } from './components/data'
import EcomStats from './components/EcomStats'
import OrdersStatics from './components/OrdersStatics'
import ProductInventory from './components/ProductInventory'
import RecentOrders from './components/RecentOrders'
import TransactionsWorldwide from './components/TransactionsWorldwide'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="eCommerce" subtitle="Dashboard" />

      <Row className="row-cols-xxl-4 row-cols-md-2 row-cols-1">
        {cardData.map((item, index) => (
          <Col key={index}>
            <EcomStats item={item} />
          </Col>
        ))}
      </Row>

      <Row>
        <Col xs={12}>
          <OrdersStatics />
        </Col>
      </Row>

      <Row>
        <Col xxl={6}>
          <ProductInventory />
        </Col>
        <Col xxl={6}>
          <RecentOrders />
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <TransactionsWorldwide />
        </Col>
      </Row>
    </>
  )
}

export default Page
