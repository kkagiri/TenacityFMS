import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, Col, Row } from 'react-bootstrap'
import Gallery from './components/Gallery'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Gallery" subtitle="Miscellaneous" />

      <Row>
        <Col xs={12}>
          <Card>
            <Gallery />
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Page
