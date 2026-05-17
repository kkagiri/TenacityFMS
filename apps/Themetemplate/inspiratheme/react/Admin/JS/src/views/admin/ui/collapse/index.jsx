import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Card, CardBody, CardHeader, CardTitle, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import { CollapseHorizontal, DefaultCollapse, MultipleTargets } from './components/Collapse'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Collapse" subtitle="UI" />
      <Container fluid="xxl">
        <Row>
          <Col xl={12}>
            <Card>
              <CardHeader>
                <CardTitle as="h4">Examples</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-muted mb-2">Toggle the visibility of content across your project with a few classes and our JavaScript plugins. </p>
                <Link className="btn btn-link p-0 fw-semibold" to="https://react-bootstrap.netlify.app/docs/components/collapse/" target="_blank" rel="noopener noreferrer">
                  Collapse on Bootstrap
                  <Icon icon="chevron-right" className="ms-1" />
                </Link>
              </CardBody>
            </Card>
          </Col>

          <Col xl={6}>
            <DefaultCollapse />
            <MultipleTargets />
          </Col>
          <Col xl={6}>
            <CollapseHorizontal />
          </Col>
        </Row>
      </Container>
    </>
  )
}
export default Page
