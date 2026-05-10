import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, Col, Row } from 'react-bootstrap'
import ForumPost from './components/ForumPost'
import Paginations from './components/Paginations'
import Sidebar from './components/Sidebar'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Forum Post" subtitle="Apps" />
      <Row className="justify-content-center">
        <Col xxl={10}>
          <Row>
            <Col xl={9}>
              <Card>
                <CardBody>
                  <ForumPost />
                  <Paginations />
                </CardBody>
              </Card>
            </Col>
            <Sidebar />
          </Row>
        </Col>
      </Row>
    </>
  )
}
export default Page
