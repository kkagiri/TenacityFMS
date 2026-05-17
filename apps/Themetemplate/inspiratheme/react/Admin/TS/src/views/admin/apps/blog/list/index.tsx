import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, Col, Row } from 'react-bootstrap'
import Categories from './components/Categories'
import Paginations from './components/Paginations'
import Sidebar from './components/Sidebar'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="List" subtitle="Blog" />
      <Row className="justify-content-center">
        <Col xxl={10}>
          <Card>
            <CardBody className="p-4">
              <Row className="g-5">
                <Col lg={8}>
                  <Categories />
                  <Paginations />
                </Col>
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
