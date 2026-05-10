import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { BasicGaugeEChart, MultiGaugeChart, MultiRingGaugeChart, RingGaugeChart, SpeedStageGaugeChart, TemperatureChart } from './GaugeChart'
const Gauges = () => {
  return (
    <Row>
      <Col xl={6}>
        <Card>
          <CardHeader>
            <CardTitle as="h4" className="mb-0">
              Basic Gauge Chart
            </CardTitle>
          </CardHeader>
          <CardBody>
            <BasicGaugeEChart />
          </CardBody>
        </Card>
      </Col>
      <Col xl={6}>
        <Card>
          <CardHeader>
            <CardTitle as="h4" className="mb-0">
              Speed Stage Gauge Chart
            </CardTitle>
          </CardHeader>
          <CardBody>
            <SpeedStageGaugeChart />
          </CardBody>
        </Card>
      </Col>

      <Col xl={6}>
        <Card>
          <CardHeader>
            <CardTitle as="h4" className="mb-0">
              Ring Gauge Chart
            </CardTitle>
          </CardHeader>
          <CardBody>
            <RingGaugeChart />
          </CardBody>
        </Card>
      </Col>

      <Col xl={6}>
        <Card>
          <CardHeader>
            <CardTitle as="h4" className="mb-0">
              Temperature Chart
            </CardTitle>
          </CardHeader>
          <CardBody>
            <TemperatureChart />
          </CardBody>
        </Card>
      </Col>

      <Col xl={6}>
        <Card>
          <CardHeader>
            <CardTitle as="h4" className="mb-0">
              Multi Ring Gauge Chart
            </CardTitle>
          </CardHeader>
          <CardBody>
            <MultiRingGaugeChart />
          </CardBody>
        </Card>
      </Col>

      <Col xl={6}>
        <Card>
          <CardHeader>
            <CardTitle as="h4" className="mb-0">
              Multi Gauge Chart
            </CardTitle>
          </CardHeader>
          <CardBody>
            <MultiGaugeChart />
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}
export default Gauges
