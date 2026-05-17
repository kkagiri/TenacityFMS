import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Accordion, AccordionBody, AccordionButton, AccordionItem, Card, CardBody, CardHeader, CardTitle, Col, FormControl, Row } from 'react-bootstrap'
import { customizationFaqData, generalFaqData, paymentFaqData, refundFaqData } from './components/data'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="FAQs" subtitle="Pages" />
      <Row className="justify-content-center">
        <Col xxl={9}>
          <Row className="justify-content-center my-4">
            <Col lg={5} md={8}>
              <div className="text-center">
                <h3 className="fw-bold mb-4">Frequently Asked Questions</h3>
                <div className="app-search mb-3">
                  <FormControl type="text" className="py-2 rounded-pill" placeholder="Search Questions..." />
                  <Icon icon="search" className="app-search-icon text-muted" />
                </div>
                <div className="d-flex justify-content-center align-items-center gap-1">
                  <h5 className="text-muted mb-0">Popular Searches :</h5>
                  <a href="#!" className="badge bg-primary-subtle text-primary rounded-pill px-2 py-1 fs-6">
                    Apps
                  </a>
                  <a href="#!" className="badge bg-primary-subtle text-primary rounded-pill px-2 py-1 fs-6">
                    Developers
                  </a>
                  <a href="#!" className="badge bg-primary-subtle text-primary rounded-pill px-2 py-1 fs-6">
                    Repair
                  </a>
                  <a href="#!" className="badge bg-primary-subtle text-primary rounded-pill px-2 py-1 fs-6">
                    Billing
                  </a>
                </div>
              </div>
            </Col>
          </Row>

          <Row>
            <Col xl={6}>
              <Card>
                <CardHeader className="d-block">
                  <CardTitle as="h4" className="mb-1">
                    General
                  </CardTitle>
                  <p className="text-muted mb-0">Here are some common questions about our templates.</p>
                </CardHeader>

                <CardBody>
                  <Accordion className="accordion-bordered" id="BorderedaccordionExample">
                    {generalFaqData.map((faq, index) => (
                      <AccordionItem eventKey={`${index + 1}`} key={index} className="border-0">
                        <AccordionButton className="shadow-none bg-light bg-opacity-50">{faq.question}</AccordionButton>
                        <AccordionBody>{faq.answer}</AccordionBody>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardBody>
              </Card>
            </Col>

            <Col xl={6}>
              <Card>
                <CardHeader className="d-block">
                  <CardTitle as="h4" className="mb-1">
                    Payments
                  </CardTitle>
                  <p className="text-muted mb-0">Here are some common questions related to billing and payment.</p>
                </CardHeader>

                <CardBody>
                  <Accordion className="accordion-bordered" id="BorderedaccordionExample">
                    {paymentFaqData.map((faq, index) => (
                      <AccordionItem eventKey={`${index + 1}`} key={index} className="border-0">
                        <AccordionButton className="shadow-none bg-light bg-opacity-50">{faq.question}</AccordionButton>
                        <AccordionBody>{faq.answer}</AccordionBody>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardBody>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col xl={6}>
              <Card>
                <CardHeader className="d-block">
                  <CardTitle as="h4" className="mb-1">
                    Refunds
                  </CardTitle>
                  <p className="text-muted mb-0">Find answers related to our refund policy and conditions.</p>
                </CardHeader>
                <CardBody>
                  <Accordion className="accordion-bordered" id="BorderedaccordionExample">
                    {refundFaqData.map((faq, index) => (
                      <AccordionItem eventKey={`${index + 1}`} key={index} className="border-0">
                        <AccordionButton className="shadow-none bg-light bg-opacity-50">{faq.question}</AccordionButton>
                        <AccordionBody>{faq.answer}</AccordionBody>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardBody>
              </Card>
            </Col>
            <Col xl={6}>
              <Card>
                <CardHeader className="d-block">
                  <CardTitle as="h4" className="mb-1">
                    Customization
                  </CardTitle>
                  <p className="text-muted mb-0">Questions about custom development and template modifications.</p>
                </CardHeader>
                <CardBody>
                  <Accordion className="accordion-bordered" id="BorderedaccordionExample">
                    {customizationFaqData.map((faq, index) => (
                      <AccordionItem eventKey={`${index + 1}`} key={index} className="border-0">
                        <AccordionButton className="shadow-none bg-light bg-opacity-50">{faq.question}</AccordionButton>
                        <AccordionBody>{faq.answer}</AccordionBody>
                      </AccordionItem>
                    ))}
                  </Accordion>
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
