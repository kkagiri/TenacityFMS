import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Card, CardBody, CardHeader, CardTitle, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import { AnimationPlaceholder, ColorPlaceholders, DefaultPlaceholders, SizingPlaceholders, WidthPlaceholders, WorksPlaceholder } from './components/Placeholders'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Placeholders" subtitle="UI" />
      <Container fluid="xxl">
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader>
                <CardTitle as={'h4'}>Examples</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-muted mb-2">Use loading placeholders for your components or pages to indicate something may still be loading.</p>
                <Link className="btn btn-link p-0" to="https://react-bootstrap.netlify.app/docs/components/placeholder" target="_blank">
                  Placeholder on React Bootstrap
                  <Icon icon="chevron-right" className="ms-1" />
                </Link>
              </CardBody>
            </Card>
          </Col>
          <Col xl={12}>
            <DefaultPlaceholders />
          </Col>
          <Col xl={12}>
            <ColorPlaceholders />
          </Col>
          <Col xl={12}>
            <WidthPlaceholders />
          </Col>
          <Col xl={12}>
            <SizingPlaceholders />
          </Col>
          <Col xl={12}>
            <WorksPlaceholder />
          </Col>
          <Col xl={12}>
            <AnimationPlaceholder />
          </Col>
        </Row>
      </Container>
    </>
  )
}
export default Page
