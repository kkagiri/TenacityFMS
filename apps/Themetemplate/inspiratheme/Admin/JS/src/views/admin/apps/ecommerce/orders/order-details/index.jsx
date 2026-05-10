import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import BillingDetails from './components/BillingDetails'
import CustomerDetails from './components/CustomerDetails'
import OrderSummary from './components/OrderSummary'
import ShippingActivity from './components/ShippingActivity'
import ShippingAddress from './components/ShippingAddress'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Order Details" subtitle="Ecommerce" />

      <Row className="justify-content-center">
        <Col xxl={10}>
          <Row>
            <Col xl={9}>
              <OrderSummary />

              <ShippingActivity />
            </Col>
            <Col xl={3}>
              <CustomerDetails />

              <ShippingAddress />

              <BillingDetails />
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  )
}
export default Page
