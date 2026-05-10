import PageBreadcrumb from '@/components/PageBreadcrumb'
import Flatpickr from '@/components/wrappers/Flatpickr'
import Icon from '@/components/wrappers/Icon'
import { Button, Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import SalesChart from './components/SalesChart'
import SalesTable from './components/SalesTable'
const getCurrentMonthRange = () => {
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setMonth(end.getMonth() + 1)
  end.setDate(0)
  end.setHours(23, 59, 59, 999)
  return [start, end]
}
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Sales Reports" subtitle="Ecommerce" />

      <Row className="justify-content-center">
        <Col xxl={10}>
          <Card>
            <CardHeader className="border-light justify-content-between">
              <CardTitle className="mb-0">Products - 2025</CardTitle>
              <div className="d-flex align-items-center gap-2">
                <div className="app-search">
                  <input type="search" className="form-control" placeholder="Search reports..." />
                  <Icon icon="search" className="text-muted app-search-icon" />
                </div>
                <div className="app-search">
                  <Flatpickr
                    className="form-control"
                    style={{
                      minWidth: 250,
                    }}
                    options={{
                      dateFormat: 'd M, Y',
                      mode: 'range',
                      defaultDate: getCurrentMonthRange(),
                    }}
                  />
                  <Icon icon="calendar" className="text-muted app-search-icon" />
                </div>
                <Button type="submit" variant="secondary">
                  <Icon icon="download" className="me-2" />
                  Export Report
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              <SalesChart />
            </CardBody>

            <SalesTable />
          </Card>
        </Col>
      </Row>
    </>
  )
}
export default Page
