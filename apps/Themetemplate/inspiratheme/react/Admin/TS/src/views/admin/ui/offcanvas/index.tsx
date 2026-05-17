import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { Card, CardBody, CardHeader, CardTitle, Col, Container, Row } from 'react-bootstrap'
import { DarkOffcanvas, DefaultOffcanvas, OffcanvasBackdrop, OffcanvasPlacement } from './components/Offcanvas'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Offcanvas" subtitle="UI" />
      <Container fluid="xxl">
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader>
                <CardTitle as={'h4'}>Examples</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-muted mb-2">Use Bootstrap&apos;s JavaScript modal plugin to add dialogs to your site for lightboxes, user notifications, or completely custom content.</p>
                <Link className="btn btn-link p-0" to="https://react-bootstrap.netlify.app/docs/components/offcanvas" target="_blank">
                  Offcanvas on React Bootstrap
                  <Icon icon="chevron-right" className="ms-1" />
                </Link>
              </CardBody>
            </Card>
          </Col>
          <Col xl={12}>
            <DefaultOffcanvas />
          </Col>
          <Col xl={12}>
            <OffcanvasBackdrop />
          </Col>
          <Col xl={12}>
            <OffcanvasPlacement />
          </Col>
          <Col xl={12}>
            <DarkOffcanvas />
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default Page
