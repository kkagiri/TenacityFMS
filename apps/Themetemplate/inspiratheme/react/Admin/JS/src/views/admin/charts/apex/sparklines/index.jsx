import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, Col, Row } from 'react-bootstrap'
import { Chart1, Chart2, Chart3, Chart4, Chart5, Chart6, Chart7, Chart8, Spark1, Spark2, Spark3 } from './components/SparkLineChart'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Sparkline Apexcharts" subtitle="Charts" />
      <Row>
        <Col xs={12}>
          <Card>
            <CardBody>
              <Row className="g-3" dir="ltr">
                <Col md={4}>
                  <Spark1 />
                </Col>
                <Col md={4}>
                  <Spark2 />
                </Col>
                <Col md={4}>
                  <Spark3 />
                </Col>
              </Row>
            </CardBody>

            <Row>
              <Col xs={12}>
                <div className="table-responsive">
                  <table className="table table-centered table-custom mb-0">
                    <thead className="bg-light bg-opacity-50 fs-xxs thead-sm text-uppercase">
                      <tr>
                        <th>Total Value</th>
                        <th>Percentage of Portfolio</th>
                        <th>Last 10 days</th>
                        <th>Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>$32,554</td>
                        <td>15%</td>
                        <td>
                          <Chart1 />
                        </td>
                        <td>
                          <Chart5 />
                        </td>
                      </tr>
                      <tr>
                        <td>$23,533</td>
                        <td>7%</td>
                        <td>
                          <Chart2 />
                        </td>
                        <td>
                          <Chart6 />
                        </td>
                      </tr>
                      <tr>
                        <td>$54,276</td>
                        <td>9%</td>
                        <td>
                          <Chart3 />
                        </td>
                        <td>
                          <Chart7 />
                        </td>
                      </tr>
                      <tr>
                        <td>$11,533</td>
                        <td>2%</td>
                        <td>
                          <Chart4 />
                        </td>
                        <td>
                          <Chart8 />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </>
  )
}
export default Page
