import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import BasicActivity from './components/BasicActivity'
import ExpandedActivity from './components/ExpandedActivity'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Activity Stream" subtitle="Projects" />

      <Row>
        <Col xxl={6}>
          <BasicActivity />
        </Col>

        <Col xxl={6}>
          <ExpandedActivity />
        </Col>
      </Row>
    </>
  )
}
export default Page
