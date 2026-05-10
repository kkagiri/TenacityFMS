import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Alert, Button, Card, CardBody, CardHeader, CardTitle, Col, Container, FormControl, ProgressBar, Row } from 'react-bootstrap'
import OrderSummary from './components/OrderSummary'
import ShoppingCart from './components/ShoppingCart'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Cart" subtitle="Ecommerce" />

      <Container fluid="xxl">
        <Row className="mt-4">
          <Col xs={12}>
            <Alert variant="info" className="border border-info border-opacity-25">
              <h6 className="mb-2">
                Buy <span className="fw-bold text-warning">$250</span> more to get <span className="fw-semibold">Free Shipping</span>
              </h6>
              <ProgressBar now={70} variant="warning" style={{ height: 4 }} />
            </Alert>
          </Col>
        </Row>

        <Row>
          <Col lg={8}>
            <ShoppingCart />
          </Col>

          <Col lg={4}>
            <OrderSummary />

            <Card>
              <CardHeader>
                <CardTitle as="h4">Apply Coupon Code</CardTitle>
              </CardHeader>
              <CardBody>
                <Alert variant="warning" className="fs-xs py-2">
                  Use <span className="fw-bold">ADMINPRO</span> to get 10% off.
                </Alert>
                <div className="input-group">
                  <FormControl type="text" placeholder="Enter code" />
                  <Button variant="primary" type="button">
                    Apply
                  </Button>
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default Page
