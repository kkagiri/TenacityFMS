import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, Col, Row } from 'react-bootstrap'
import Articles from './components/Articles'
import Sidebar from './components/Sidebar'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Article" subtitle="Blog" />

      <Row className="justify-content-center">
        <Col xxl={10}>
          <Card>
            <CardBody className="p-lg-5">
              <Row className="g-5">
                <Articles />
                <Sidebar />
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}
export default Page
