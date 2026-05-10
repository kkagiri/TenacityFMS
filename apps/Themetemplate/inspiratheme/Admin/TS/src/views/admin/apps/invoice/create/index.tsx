import logoDark from '@/assets/images/logo-black.png'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Flatpickr from '@/components/wrappers/Flatpickr'
import Icon from '@/components/wrappers/Icon'
import { Button, Card, CardBody, Col, Form, FormControl, FormLabel, FormSelect, InputGroup, Row, Table } from 'react-bootstrap'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Create Invoice" subtitle="Apps" />

      <Row className="justify-content-center">
        <Col xxl={10}>
          <Row>
            <Col xl={9}>
              <Card>
                <Form>
                  <CardBody className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div className="border rounded position-relative d-flex text-center align-items-center justify-content-between px-2" style={{ height: '60px', width: '260px' }}>
                        <label htmlFor="invoiceLogo" className="position-absolute top-0 start-0 end-0 bottom-0"></label>
                        <FormControl type="file" className="d-none" id="invoiceLogo" accept="image/*" />
                        <img id="preview" src={logoDark} alt="Company Logo" height="28" />
                        <Icon icon="cloud-upload" className="fs-xxl text-muted" role="button" />
                      </div>

                      <div className="text-end">
                        <Row className="g-2 align-items-center">
                          <Col xs="auto">
                            <FormLabel className="fw-semibold">Invoice #</FormLabel>
                            <FormControl type="text" id="invoiceNumber" placeholder="e.g. INV-0001" />
                          </Col>
                          <Col xs="auto">
                            <FormLabel className="fw-semibold">Currency</FormLabel>
                            <FormSelect>
                              <option>USD ($)</option>
                              <option>EUR (€)</option>
                              <option>GBP (£)</option>
                              <option>INR (₹)</option>
                              <option>JPY (¥)</option>
                              <option>AUD (A$)</option>
                              <option>CAD (C$)</option>
                              <option>CNY (¥)</option>
                            </FormSelect>
                          </Col>
                        </Row>
                      </div>
                    </div>

                    <Row>
                      <Col className="form-group" md={4}>
                        <FormLabel>Invoice Date</FormLabel>
                        <Flatpickr className="form-control" options={{ dateFormat: 'Y-m-d', defaultDate: new Date() }} />
                      </Col>

                      <Col className="form-group" md={4}>
                        <FormLabel>Due Date</FormLabel>
                        <Flatpickr className="form-control" options={{ dateFormat: 'Y-m-d', defaultDate: new Date() }} />
                      </Col>

                      <Col className="form-group" md={4}>
                        <FormLabel>Payment Method</FormLabel>
                        <FormSelect>
                          <option>Select</option>
                          <option>Credit / Debit Card</option>
                          <option>Bank Transfer</option>
                          <option>PayPal</option>
                          <option>UPI (GPay)</option>
                          <option>Cash</option>
                        </FormSelect>
                      </Col>
                    </Row>

                    <Row className="mt-4">
                      <Col md={6}>
                        <FormLabel>Billing Address</FormLabel>
                        <FormControl type="text" className="mb-2" placeholder="Name" />
                        <FormControl as="textarea" rows={3} className="mb-2" placeholder="Address" />
                        <InputGroup>
                          <FormSelect style={{ maxWidth: '120px' }}>
                            <option>+1 (US)</option>
                            <option selected>+44 (UK)</option>
                            <option>+91 (IN)</option>
                            <option>+61 (AU)</option>
                            <option>+971 (UAE)</option>
                          </FormSelect>
                          <FormControl type="text" placeholder="Phone Number" />
                        </InputGroup>
                      </Col>

                      <Col md={6}>
                        <FormLabel>Shipping Address</FormLabel>
                        <FormControl type="text" className="mb-2" placeholder="Name" />
                        <FormControl as="textarea" rows={3} className="mb-2" placeholder="Address" />
                        <InputGroup>
                          <FormSelect style={{ maxWidth: '120px' }}>
                            <option>+1 (US)</option>
                            <option selected>+44 (UK)</option>
                            <option>+91 (IN)</option>
                            <option>+61 (AU)</option>
                            <option>+971 (UAE)</option>
                          </FormSelect>
                          <FormControl type="text" placeholder="Phone Number" />
                        </InputGroup>
                      </Col>
                    </Row>

                    <Table responsive bordered className="table-nowrap text-center align-middle mt-4">
                      <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                        <tr className="text-uppercase fs-xxs">
                          <th>#</th>
                          <th className="text-start">Item Description</th>
                          <th>Qty</th>
                          <th>Unit Price</th>
                          <th>Amount</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>1</td>
                          <td>
                            <FormControl type="text" placeholder="Description" />
                          </td>
                          <td>
                            <FormControl type="number" placeholder="1" />
                          </td>
                          <td>
                            <FormControl type="number" placeholder="0.00" />
                          </td>
                          <td>
                            <FormControl type="number" placeholder="0.00" />
                          </td>
                          <td>
                            <Button variant="danger" size="sm" type="button">
                              ×
                            </Button>
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                    <Button variant="primary" className="mt-2">
                      <Icon icon="plus" className="me-1" /> Add Item
                    </Button>

                    <Row className="justify-content-end mt-4">
                      <Col md={4}>
                        <Table borderless>
                          <tbody>
                            <tr>
                              <td className="text-end">Subtotal</td>
                              <td>
                                <FormControl type="number" placeholder="0.00" />
                              </td>
                            </tr>
                            <tr>
                              <td className="text-end">Tax (%)</td>
                              <td>
                                <FormControl type="number" placeholder="0.00" />
                              </td>
                            </tr>
                            <tr>
                              <td className="text-end">Discount</td>
                              <td>
                                <FormControl type="number" placeholder="0.00" />
                              </td>
                            </tr>
                            <tr className="fw-bold">
                              <td className="text-end">Total</td>
                              <td>
                                <FormControl type="number" readOnly placeholder="0.00" />
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                      </Col>
                    </Row>

                    <div className="mt-4">
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl as="textarea" rows={3} placeholder="e.g. Thank you for your business!" />
                    </div>
                  </CardBody>
                </Form>
              </Card>
            </Col>

            <Col xl={3} className="d-print-none">
              <Card className="card-top-sticky">
                <CardBody>
                  <div className="justify-content-center d-flex flex-column gap-2">
                    <Button variant="light">
                      <Icon icon="eye" className="me-1" /> Preview
                    </Button>
                    <Button variant="light">
                      <Icon icon="download" className="me-1" /> Download
                    </Button>
                    <Button variant="danger" size="lg">
                      <Icon icon="send-2" className="me-1" /> Send
                    </Button>
                  </div>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </>
  )
}

export default Page
