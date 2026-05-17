import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import ApiKeyTable from './components/ApiKeyTable'
import ApiWidget from './components/ApiWidget'
import { apiStatisticsData } from './components/data'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="API Keys" subtitle="Apps" />
      <Row className="g-3">
        {apiStatisticsData.map((item, index) => (
          <Col md={6} lg={3} key={index}>
            <ApiWidget item={item} />
          </Col>
        ))}
      </Row>
      <Row>
        <Col xs={12}>
          <ApiKeyTable />
        </Col>
      </Row>
    </>
  )
}

export default Page
