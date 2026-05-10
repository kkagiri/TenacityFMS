import PageBreadcrumb from '@/components/PageBreadcrumb'
import Flatpickr from '@/components/wrappers/Flatpickr'
import { Button, Card, CardBody, CardHeader, CardTitle, Col, Container, Form, FormControl, FormLabel, FormSelect, Row } from 'react-bootstrap'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Add/Edit Order" subtitle="Ecommerce" />
      <Container fluid="xxl">
        <Row>
          <Col xs={12}>
            <Card>
              <CardHeader>
                <CardTitle as="h4" className="mb-0">
                  Create Order
                </CardTitle>
              </CardHeader>
              <CardBody>
                <Form id="orderForm">
                  <Row className="g-3">
                    <Col md={6}>
                      <FormLabel>Order ID</FormLabel>
                      <FormControl type="text" id="orderId" placeholder="#WB20100" disabled />
                    </Col>
                    <Col md={6}>
                      <FormLabel>Order Date</FormLabel>
                      <Flatpickr className="form-control" required options={{ dateFormat: 'F d, Y', defaultDate: 'today' }} />
                    </Col>
                    <Col md={6}>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl type="text" id="customerName" placeholder="Mason Carter" required />
                    </Col>
                    <Col md={6}>
                      <FormLabel>Customer Email</FormLabel>
                      <FormControl type="email" id="customerEmail" placeholder="mason.carter@shopmail.com" required />
                    </Col>
                    <Col md={6}>
                      <FormLabel>Product Name</FormLabel>
                      <FormSelect id="productName" required defaultValue="">
                        <option value="" disabled>
                          Select Product
                        </option>
                        <option value="iPhone 15 Pro">iPhone 15 Pro</option>
                        <option value="MacBook Air M3">MacBook Air M3</option>
                        <option value="iPad Pro 13″ (M4)">iPad Pro 13″ (M4)</option>
                        <option value="Apple Watch Ultra 2">Apple Watch Ultra 2</option>
                        <option value="AirPods Pro (2nd Gen)">AirPods Pro (2nd Gen)</option>
                      </FormSelect>
                    </Col>
                    <Col md={6}>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl type="number" id="quantity" min={1} defaultValue={1} required />
                    </Col>
                    <Col md={6}>
                      <FormLabel>Amount ($)</FormLabel>
                      <FormControl type="number" id="amount" step="0.01" placeholder="129.45" required />
                    </Col>
                    <Col md={6}>
                      <FormLabel>Payment Status</FormLabel>
                      <FormSelect id="paymentStatus" required>
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                        <option value="Failed">Failed</option>
                      </FormSelect>
                    </Col>
                    <Col md={6}>
                      <FormLabel>Order Status</FormLabel>
                      <FormSelect id="orderStatus" required>
                        <option value="Ordered">Ordered</option>
                        <option value="Processing">Processing</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Returned">Returned</option>
                      </FormSelect>
                    </Col>
                    <Col md={6}>
                      <FormLabel>Payment Method</FormLabel>
                      <FormSelect id="paymentMethod" required>
                        <option value="Visa">Visa</option>
                        <option value="Mastercard">Mastercard</option>
                        <option value="PayPal">PayPal</option>
                        <option value="COD">Cash on Delivery</option>
                      </FormSelect>
                    </Col>
                    <Col md={6}>
                      <FormLabel>Card Last 4 Digits</FormLabel>
                      <FormControl type="text" maxLength={4} id="cardNumber" placeholder="7832" />
                    </Col>
                    <Col xs={12} className="text-center">
                      <Button type="button" variant="light" className="me-2">
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary">
                        Save Order
                      </Button>
                    </Col>
                  </Row>
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default Page
