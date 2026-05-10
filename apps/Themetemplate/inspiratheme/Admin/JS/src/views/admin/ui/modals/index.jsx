import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Card, CardBody, CardHeader, CardTitle, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import { BootstrapModal, FullscreenModal, ModalPosition, MultipleModal, StaticBackdrop, ToggleBetweenModals, VaryingModalContent } from './components/Modals'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Modals" subtitle="UI" />
      <Container fluid="xxl">
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader>
                <CardTitle as={'h4'}>Examples</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-muted mb-2">Use Bootstrap&apos;s JavaScript modal plugin to add dialogs to your site for lightboxes, user notifications, or completely custom content.</p>
                <Link className="btn btn-link p-0" to="https://react-bootstrap.netlify.app/docs/components/modal" target="_blank">
                  Modals on React Bootstrap
                  <Icon icon="chevron-right" className="ms-1" />
                </Link>
              </CardBody>
            </Card>
          </Col>
          <Col xl={12}>
            <BootstrapModal />
          </Col>

          <Col xl={12}>
            <ModalPosition />
          </Col>

          <Col xl={12}>
            <MultipleModal />
          </Col>

          <Col xl={12}>
            <ToggleBetweenModals />
          </Col>

          <Col xl={12}>
            <FullscreenModal />
          </Col>

          <Col xl={12}>
            <StaticBackdrop />
          </Col>

          <Col xl={12}>
            <VaryingModalContent />
          </Col>
        </Row>
      </Container>
    </>
  )
}
export default Page
