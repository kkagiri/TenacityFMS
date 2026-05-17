import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import IssueTrackerTable from './components/IssueTrackerTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Issue List" subtitle="Apps" />
      <Row>
        <Col xs={12}>
          <IssueTrackerTable />
        </Col>
      </Row>
    </>
  )
}

export default Page
