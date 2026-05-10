import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Accordion, AccordionBody, AccordionHeader, AccordionItem, Card, CardBody, CardHeader, CardTitle, Col, Container, Row } from 'react-bootstrap'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Accordions" subtitle="UI" />
      <Container fluid="xxl">
        <Row>
          <Col xl={12}>
            <Card>
              <CardHeader className="card-header">
                <CardTitle className="card-title">Examples</CardTitle>
              </CardHeader>
              <CardBody className="card-body">
                <p className="text-muted mb-2">Build vertically collapsing accordions in combination with our Collapse JavaScript plugin.</p>
                <a className="btn btn-link p-0 fw-semibold" href="https://getbootstrap.com/docs/5.3/components/accordion/" target="_blank">
                  Accordions on Bootstrap
                  <Icon icon="chevron-right" className="ms-1" />
                </a>
              </CardBody>
            </Card>
          </Col>
          <Col xl={12}>
            <DefaultAccordions />
          </Col>
          <Col xl={12}>
            <FlushAccordions />
          </Col>
          <Col xl={12}>
            <AlwaysOpenAccordions />
          </Col>
          <Col xl={12}>
            <WithoutArrowAccordion />
          </Col>
          <Col xl={12}>
            <BorderedAccordions />
          </Col>
          <Col xl={12}>
            <CustomIconAccordion />
          </Col>
        </Row>
      </Container>
    </>
  )
}
export default Page
const accordionData = [
  {
    question: 'Accordion Item #1',
    answer:
      " <strog>This is the first item's accordion body.</strog>  It is shown by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the <code>.accordion-body</code> , though the transition does limit overflow",
  },
  {
    question: 'Accordion Item #2',
    answer:
      "<strong>This is the second item's accordion body.</strong> It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the <code>.accordion-body</code> , though the transition does limit overflow.",
  },
  {
    question: 'Accordion Item #3',
    answer:
      "<strong>This is the third item's accordion body.</strong>  It is hidden by default, until the collapse plugin adds the appropriate classes that we use to style each element. These classes control the overall appearance, as well as the showing and hiding via CSS transitions. You can  modify any of this with custom CSS or overriding our default variables. It's also worth noting that just about any HTML can go within the <code>.accordion-body</code> , though the transition does limit overflow.",
  },
]
const DefaultAccordions = () => (
  <Card>
    <CardHeader>
      <CardTitle as="h4">Default Accordions</CardTitle>
    </CardHeader>
    <CardBody>
      <Accordion defaultActiveKey="1" id="accordionExample">
        {accordionData.map((item, idx) => (
          <AccordionItem eventKey={`${idx + 1}`} key={idx}>
            <AccordionHeader as="h2">{item.question}</AccordionHeader>
            <AccordionBody
              dangerouslySetInnerHTML={{
                __html: item.answer,
              }}
            />
          </AccordionItem>
        ))}
      </Accordion>
    </CardBody>
  </Card>
)
const FlushAccordions = () => (
  <Card>
    <CardHeader>
      <CardTitle as="h4">Flush Accordions</CardTitle>
    </CardHeader>
    <CardBody>
      <Accordion defaultActiveKey="1" className="accordion-flush" id="accordionFlushExample">
        {accordionData.map((item, idx) => (
          <AccordionItem eventKey={`${idx + 1}`} key={idx}>
            <AccordionHeader as="h2">{item.question}</AccordionHeader>
            <AccordionBody
              dangerouslySetInnerHTML={{
                __html: item.answer,
              }}
            />
          </AccordionItem>
        ))}
      </Accordion>
    </CardBody>
  </Card>
)
const AlwaysOpenAccordions = () => (
  <Card>
    <CardHeader>
      <CardTitle as="h4">Always Open Accordions</CardTitle>
    </CardHeader>
    <CardBody>
      <Accordion alwaysOpen defaultActiveKey={['1']} id="accordionPanelsStayOpenExample">
        {accordionData.map((item, idx) => (
          <AccordionItem eventKey={`${idx + 1}`} key={idx}>
            <AccordionHeader as="h2">{item.question}</AccordionHeader>
            <AccordionBody
              dangerouslySetInnerHTML={{
                __html: item.answer,
              }}
            />
          </AccordionItem>
        ))}
      </Accordion>
    </CardBody>
  </Card>
)
const WithoutArrowAccordion = () => (
  <Card>
    <CardHeader>
      <CardTitle as="h4">Accordion Without Arrow</CardTitle>
    </CardHeader>
    <CardBody>
      <Accordion defaultActiveKey="1" className="accordion-arrow-none" id="withoutarrowaccordionExample">
        {accordionData.map((item, idx) => (
          <AccordionItem eventKey={`${idx}`} key={idx}>
            <AccordionHeader as="h2">{item.question}</AccordionHeader>
            <AccordionBody
              dangerouslySetInnerHTML={{
                __html: item.answer,
              }}
            />
          </AccordionItem>
        ))}
      </Accordion>
    </CardBody>
  </Card>
)
const BorderedAccordions = () => (
  <Card>
    <CardHeader>
      <CardTitle as="h4">Bordered Accordions</CardTitle>
    </CardHeader>
    <CardBody>
      <Accordion defaultActiveKey="1" className="accordion-bordered" id="BorderedaccordionExample">
        {accordionData.map((item, idx) => (
          <AccordionItem eventKey={`${idx}`} key={idx}>
            <AccordionHeader as="h2">{item.question}</AccordionHeader>
            <AccordionBody
              dangerouslySetInnerHTML={{
                __html: item.answer,
              }}
            />
          </AccordionItem>
        ))}
      </Accordion>
    </CardBody>
  </Card>
)
const CustomIconAccordion = () => (
  <Card>
    <CardHeader>
      <CardTitle as="h4">Custom Icon Accordion</CardTitle>
    </CardHeader>
    <CardBody>
      <Accordion defaultActiveKey="0" className="accordion-custom-icon accordion-arrow-none" id="CustomIconaccordionExample">
        <AccordionItem eventKey="0">
          <AccordionHeader as="h2">
            Accordion item with tabler icons <Icon icon="plus" className="accordion-icon accordion-icon-on" />
            <Icon icon="minus" className="accordion-icon accordion-icon-off" />
          </AccordionHeader>
          <AccordionBody>
            <strong>This is the first item&apos;s accordion body.</strong> It is shown by default. You can modify the content freely.
          </AccordionBody>
        </AccordionItem>
        <AccordionItem eventKey="1">
          <AccordionHeader as="h2">
            Accordion item with lucid icons <Icon icon="plus" className="accordion-icon accordion-icon-on" />
            <Icon icon="minus" className="accordion-icon accordion-icon-off" />
          </AccordionHeader>
          <AccordionBody>
            <strong>This is the second item&apos;s accordion body.</strong> It is hidden by default. You can modify the content freely.
          </AccordionBody>
        </AccordionItem>
        <AccordionItem eventKey="2">
          <AccordionHeader as="h2">
            Accordion item with arrow icons <Icon icon="plus" className="accordion-icon accordion-icon-on" />
            <Icon icon="minus" className="accordion-icon accordion-icon-off" />
          </AccordionHeader>
          <AccordionBody>
            <strong>This is the third item&apos;s accordion body.</strong> It is hidden by default. You can modify the content freely.
          </AccordionBody>
        </AccordionItem>
      </Accordion>
    </CardBody>
  </Card>
)
