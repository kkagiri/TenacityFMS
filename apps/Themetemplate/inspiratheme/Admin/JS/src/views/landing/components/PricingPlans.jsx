import Icon from '@/components/wrappers/Icon'
import { Card, CardBody, CardFooter, Col, Container, Row } from 'react-bootstrap'
import { pricingPlans } from './data'
const PricingCard = ({ plan }) => {
  return (
    <Card className={`h-100 bg-light bg-opacity-10 rounded-3 ${plan.isPopular ? 'border-dashed border' : 'border-light'}`}>
      <CardBody className="px-lg-4 p-5 pb-2 text-center">
        <div className="text-center">
          <h3 className="fw-bold mb-1">{plan.name}</h3>
          <p className="text-muted mb-0">{plan.description}</p>
        </div>

        <div className="my-4">
          <h1 className="display-6 fw-bold mb-0">${plan.price}</h1>
          <small className="d-block text-muted fs-base fw-medium">One-time payment</small>
          <small className="d-block text-muted fw-medium">{plan.highlight}</small>
        </div>

        <ul className="list-unstyled text-start fs-sm fw-medium mb-0">
          {plan.features.map((feature, index) => (
            <li key={index} className="mb-2">
              {feature.included ? <Icon icon="check" className="me-2 fs-5 text-success" /> : <Icon icon="x" className="me-2 fs-5 text-danger" />}
              {feature.text}
            </li>
          ))}
        </ul>
      </CardBody>

      <CardFooter className="bg-transparent border-0 px-5 pb-4">
        <button className={`btn w-100 py-2 fw-semibold rounded-pill ${plan.btnClass}`}>Buy {plan.name}</button>
      </CardFooter>

      {plan.isPopular && <span className="position-absolute top-0 start-50 translate-middle-x badge bg-primary-subtle text-primary rounded-pill px-3 py-1 mt-3">Best Value</span>}
    </Card>
  )
}
const PricingPlans = () => {
  return (
    <section className="section-custom" id="plans">
      <Container>
        <Row>
          <Col xs={12} className="text-center">
            <span className="text-muted rounded-3 d-inline-block">💰 Transparent and flexible pricing</span>
            <h2 className="mt-3 fw-bold mb-5">
              Choose the <mark className="fst-italic">License</mark> That Fits Your Needs
            </h2>
          </Col>
        </Row>

        <Row className="justify-content-center">
          <Col xxl={10}>
            <Row>
              {pricingPlans.map((plan, idx) => (
                <Col lg={4} key={idx} className={`${plan.isPopular && 'my-4 my-lg-0'}`}>
                  <PricingCard plan={plan} />
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Container>
    </section>
  )
}
export default PricingPlans
