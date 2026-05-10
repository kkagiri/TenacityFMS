import Icon from '@/components/wrappers/Icon'
import { Card, CardBody, CardFooter, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import { services } from './data'
const ServiceCard = ({ service }) => {
  const { description, icon, name } = service
  return (
    <Card className="border-0 p-2 card-h-100">
      <CardBody className="pb-0">
        <div className="avatar-xl mb-3">
          <span className="avatar-title text-bg-secondary rounded-circle fs-22">
            <Icon icon={icon} />
          </span>
        </div>
        <h4 className="mb-2">{name}</h4>
        <p className="text-muted mb-3">{description}</p>
      </CardBody>
      <CardFooter className="border-0 pt-0">
        <Link className="link-primary fw-semibold" to="">
          Know more
          <Icon icon="arrow-right" className="ms-2 align-middle" />
        </Link>
      </CardFooter>
    </Card>
  )
}
const Services = () => {
  return (
    <section className="section-custom pb-5" id="services">
      <Container>
        <Row>
          <Col xs={12} className="text-center">
            <span className="text-muted rounded-3 d-inline-block">🚀 Empowering your digital journey</span>
            <h2 className="mt-3 fw-bold mb-5">
              Discover Our <mark className="fst-italic">Core Services</mark> and Capabilities
            </h2>
          </Col>
        </Row>

        <Row>
          {services.map((service, idx) => (
            <Col key={idx} xl={3} md={6}>
              <ServiceCard service={service} />
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  )
}
export default Services
