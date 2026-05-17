import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Alert, Card, CardBody, Col, Row } from 'react-bootstrap'
import HTMLClassHandler from '../HTMLClassHandler'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="No Icons" subtitle="Layouts" />
      <HTMLClassHandler classes={['sidebar-no-icons', 'sidebar-with-line']} />

      <Row>
        <Col xs={12}>
          <Alert variant="info" className="alert-bordered border-start border-info d-flex align-items-start gap-2">
            <Icon icon="info-circle" className="fs-xxl" />
            <div>
              If you want to remove icons and display sidebar items in line style, add the class
              <code>&quot;sidebar-no-icons sidebar-with-line&quot;</code>
              to the
              <code>&lt;html&gt;</code>
              tag.
            </div>
          </Alert>
        </Col>
      </Row>
      <Row>
        <Col xs={12}>
          <Card>
            <CardBody className="text-center">
              <h4 className="m-0">Your custom content here</h4>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}
export default Page
