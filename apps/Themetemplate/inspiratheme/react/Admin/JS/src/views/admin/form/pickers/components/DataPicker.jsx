import Flatpickr from '@/components/wrappers/Flatpickr'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
const DataPicker = () => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle as="h4">Date Range Picker</CardTitle>
        </CardHeader>

        <CardBody>
          <DateRange />

          <div className="my-4 border-top border-dashed" />

          <DateRangeWithTime />

          <div className="my-4 border-top border-dashed" />

          <SingleDate />

          <div className="my-4 border-top border-dashed" />

          <TimeOnlyDatePicker />
        </CardBody>
      </Card>
    </>
  )
}
const DateRange = () => {
  return (
    <>
      <Row className="g-3">
        <Col lg={6}>
          <h5>Date Range</h5>
          <p className="text-muted mb-0">Select a custom date range from the calendar.</p>
        </Col>
        <Col lg={6}>
          <Flatpickr
            className="form-control"
            options={{
              dateFormat: 'd/m/Y',
              defaultDate: 'today',
            }}
          />
        </Col>
      </Row>
    </>
  )
}
const DateRangeWithTime = () => {
  return (
    <>
      <Row className="g-3">
        <Col lg={6}>
          <h5>Date Range Picker With Times</h5>
          <p className="text-muted mb-0">Includes both start and end time selection.</p>
        </Col>
        <Col lg={6}>
          <Flatpickr
            className="form-control"
            options={{
              dateFormat: 'd/m h:m K',
              enableTime: true,
              defaultDate: 'today',
            }}
          />
        </Col>
      </Row>
    </>
  )
}
const SingleDate = () => {
  return (
    <>
      <Row className="g-3">
        <Col lg={6}>
          <h5>Single Date Picker</h5>
          <p className="text-muted mb-0">Select a single date (e.g., birthday).</p>
        </Col>
        <Col lg={6}>
          <Flatpickr
            className="form-control"
            options={{
              dateFormat: 'd/m/Y',
              defaultDate: 'today',
            }}
          />
        </Col>
      </Row>
    </>
  )
}
const TimeOnlyDatePicker = () => {
  return (
    <Row className="g-4">
      <Col lg={6}>
        <h5>Predefined Date Ranges</h5>
        <p className="text-muted mb-0">Choose from common ranges like &quot;Last 7 Days&quot;, etc.</p>
      </Col>
      <Col lg={6}>
        <div className="position-relative">
          <Flatpickr
            className="form-control"
            options={{
              dateFormat: 'd/m/Y',
              defaultDate: 'today',
              mode: 'range',
            }}
          />
        </div>
      </Col>
    </Row>
  )
}
export default DataPicker
