import { BasicBarChart } from './BarChart'
import { GradientBarChart } from './BarChart'
import { HoriBarChart } from './BarChart'
import { HorizontalStackedBar } from './BarChart'
import { MixdedBarChart } from './BarChart'
import { NegativeChart } from './BarChart'
import { ProgressBar } from './BarChart'
import { RaceBarChart } from './BarChart'
import { SeriesBarChart } from './BarChart'
import { StackedBarChart } from './BarChart'
import { TimelineBarChart } from './BarChart'
import { TwobarChart } from './BarChart'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'













const Charts = () => {
  return (
    <Row>
      <Col xl={6}>
        <Card>
          <CardHeader>
            <CardTitle as="h4" className="mb-0">
              Basic Bar Chart
            </CardTitle>
          </CardHeader>
          <CardBody>
            <BasicBarChart />
          </CardBody>
        </Card>
      </Col>

      <Col xl={6}>
        <Card>
          <CardHeader>
            <CardTitle as="h4" className="mb-0">
              Two Bar Chart
            </CardTitle>
          </CardHeader>
          <CardBody>
            <TwobarChart />
          </CardBody>
        </Card>
      </Col>

      <Col xl={6}>
        <Card>
          <CardHeader>
            <CardTitle as="h4" className="mb-0">
              Progress Bar Chart
            </CardTitle>
          </CardHeader>
          <CardBody>
            <ProgressBar />
          </CardBody>
        </Card>
      </Col>

      <Col xl={6}>
        <Card>
          <CardHeader>
            <CardTitle as="h4" className="mb-0">
              Horizontal Bar Chart
            </CardTitle>
          </CardHeader>
          <CardBody>
            <HoriBarChart />
          </CardBody>
        </Card>
      </Col>

      <Col xl={6}>
        <Card>
          <CardHeader>
            <CardTitle as="h4" className="mb-0">
              Negative Chart
            </CardTitle>
          </CardHeader>
          <CardBody>
            <NegativeChart />
          </CardBody>
        </Card>
      </Col>

      <Col xl={6}>
        <Card>
          <CardHeader>
            <CardTitle as="h4" className="mb-0">
              Bar Chart with Series
            </CardTitle>
          </CardHeader>
          <CardBody>
            <SeriesBarChart />
          </CardBody>
        </Card>
      </Col>

      <Col xl={6}>
        <Card>
          <CardHeader>
            <CardTitle as="h4" className="mb-0">
              Stacked Bar
            </CardTitle>
          </CardHeader>
          <CardBody>
            <StackedBarChart />
          </CardBody>
        </Card>
      </Col>

      <Col xl={6}>
        <Card>
          <CardHeader>
            <CardTitle as="h4" className="mb-0">
              Horizontal Stacked Bar
            </CardTitle>
          </CardHeader>
          <CardBody>
            <HorizontalStackedBar />
          </CardBody>
        </Card>
      </Col>

      <Col xl={6}>
        <Card>
          <CardHeader>
            <CardTitle as="h4" className="mb-0">
              Bar Race Chart
            </CardTitle>
          </CardHeader>
          <CardBody>
            <RaceBarChart />
          </CardBody>
        </Card>
      </Col>

      <Col xl={6}>
        <Card>
          <CardHeader>
            <CardTitle as="h4" className="mb-0">
              Bar Gradient Chart
            </CardTitle>
          </CardHeader>
          <CardBody>
            <GradientBarChart />
          </CardBody>
        </Card>
      </Col>

      <Col xl={6}>
        <Card>
          <CardHeader>
            <CardTitle as="h4" className="mb-0">
              Mixded Bar Chart
            </CardTitle>
          </CardHeader>
          <CardBody>
            <MixdedBarChart />
          </CardBody>
        </Card>
      </Col>

      <Col xl={12}>
        <Card>
          <CardHeader>
            <CardTitle as="h4" className="mb-0">
              Timeline Bar Chart
            </CardTitle>
          </CardHeader>
          <CardBody>
            <TimelineBarChart />
          </CardBody>
        </Card>
      </Col>
    </Row>
  )
}

export default Charts
