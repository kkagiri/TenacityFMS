import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import ClientsTable from './components/ClientsTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Clients" subtitle="Apps" />

      <Row className="justify-content-center">
        <Col xxl={10}>
          <ClientsTable />
        </Col>
      </Row>
    </>
  )
}

export default Page
