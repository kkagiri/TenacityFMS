import Flatpickr from '@/components/wrappers/Flatpickr'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
const Pickers = () => {
  return (
    <>
      <Card>
        <CardHeader className="d-block">
          <CardTitle as="h4" className="mb-1">
            Flatpickr
          </CardTitle>
          <p className="text-muted mb-0">Lightweight, powerful javascript datetimepicker with no dependencies</p>
        </CardHeader>

        <CardBody>
          <CardTitle as="h4" className="fs-sm fw-bold mb-4">
            Datepicker
          </CardTitle>

          <Row className="g-4">
            <Col lg={6}>
              <h5>Basic</h5>
              <p className="text-muted mb-0">
                Set options <code>&#123;dateFormat: &quot;d M, Y&quot;&#125;</code>
              </p>
            </Col>
            <Col lg={6}>
              <Flatpickr
                className="form-control"
                options={{
                  dateFormat: 'd M, Y',
                  defaultDate: 'today',
                }}
              />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-4">
            <Col lg={6}>
              <h5>DateTime</h5>
              <p className="text-muted mb-0">
                Set options <code>&#123;dateFormat: &quot;d M, Y&quot;, enableTime: true&#125;</code>
              </p>
            </Col>
            <Col lg={6}>
              <Flatpickr
                className="form-control"
                options={{
                  dateFormat: 'd.m.y h:m',
                  enableTime: true,
                  defaultDate: 'today',
                }}
              />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-4">
            <Col lg={6}>
              <h5>Human-Friendly Dates</h5>
              <p className="text-muted mb-0">
                Set options <code>&#123;altFormat: &quot;F j, Y&quot;, dateFormat: &quot;Y-m-d&quot;&#125;</code>
              </p>
            </Col>
            <Col lg={6}>
              <Flatpickr
                className="form-control"
                options={{
                  altInput: true,
                  altFormat: 'F j, Y',
                  dateFormat: 'Y-m-d',
                  defaultDate: 'today',
                }}
              />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-4">
            <Col lg={6}>
              <h5>MinDate and MaxDate</h5>
              <p className="text-muted mb-0">
                Set options <code>&#123;minDate: &quot;25 12, 2021&quot;, maxDate: &quot;29 12,2021&quot;&#125;</code>
              </p>
            </Col>
            <Col lg={6}>
              <Flatpickr
                className="form-control"
                placeholder="Select Date"
                options={{
                  defaultDate: 'today',
                  dateFormat: 'd M, Y',
                  minDate: '25 12, 2021',
                  maxDate: '29 12,2021',
                }}
              />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-4">
            <Col lg={6}>
              <h5>Default Date</h5>
              <p className="text-muted mb-0">
                Set options <code>&#123;defaultDate: &quot;today&quot;&#125;</code>
              </p>
            </Col>
            <Col lg={6}>
              <Flatpickr
                className="form-control"
                placeholder="Select Date"
                options={{
                  dateFormat: 'd M, Y',
                  defaultDate: '25 12,2021',
                }}
              />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-4">
            <Col lg={6}>
              <h5>Disabling Dates</h5>
              <p className="text-muted mb-0">
                Set options <code>&#123;disable: [&quot;15 12,2025&quot;]&#125;</code>
              </p>
            </Col>
            <Col lg={6}>
              <Flatpickr
                className="form-control"
                placeholder="Select Date"
                options={{
                  dateFormat: 'd M, Y',
                  defaultDate: 'today',
                  disable: ['15 12,2021'],
                }}
              />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-4">
            <Col lg={6}>
              <h5>Selecting Multiple Dates</h5>
              <p className="text-muted mb-0">
                Set options <code>&#123;mode: &quot;multiple&quot;&#125;</code>
              </p>
            </Col>
            <Col lg={6}>
              <Flatpickr
                className="form-control"
                options={{
                  dateFormat: 'd M, Y',
                  defaultDate: 'today',
                  mode: 'multiple',
                }}
              />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-4">
            <Col lg={6}>
              <h5>Range</h5>
              <p className="text-muted mb-0">
                Set options <code>&#123;mode: &quot;range&quot;&#125;</code>
              </p>
            </Col>
            <Col lg={6}>
              <Flatpickr
                className="form-control"
                options={{
                  defaultDate: 'today',
                  dateFormat: 'd M, Y',
                  mode: 'range',
                }}
              />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-4">
            <Col lg={6}>
              <h5>Week Numbers</h5>
              <p className="text-muted mb-0">
                Set options <code>&#123;weekNumbers: true&#125;</code>
              </p>
            </Col>
            <Col lg={6}>
              <Flatpickr
                className="form-control"
                options={{
                  dateFormat: 'd M, Y',
                  defaultDate: 'today',
                  weekNumbers: true,
                }}
              />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-4">
            <Col lg={6}>
              <h5>Inline</h5>
              <p className="text-muted mb-0">
                Set options <code>&#123;inline: true&#125;</code>
              </p>
            </Col>
            <Col lg={6}>
              <Flatpickr
                className="form-control"
                options={{
                  dateFormat: 'd M, Y',
                  defaultDate: '25 01,2021',
                  inline: true,
                }}
              />
            </Col>
          </Row>
        </CardBody>

        <div className="border-top border-dashed" />
        <CardBody>
          <CardTitle as="h4" className="fs-sm fw-bold mb-4">
            Timepicker
          </CardTitle>

          <Row className="g-4">
            <Col lg={6}>
              <h5>Timepicker</h5>
              <p className="text-muted mb-0">
                Set <code>data-provider=&quot;timepickr&quot; data-time-basic&quot;true&quot;</code> attribute.
              </p>
            </Col>
            <Col lg={6}>
              <Flatpickr
                className="form-control"
                placeholder="Select Time"
                options={{
                  defaultDate: '12:00',
                  enableTime: true,
                  noCalendar: true,
                  dateFormat: 'H:i',
                }}
              />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-4">
            <Col lg={6}>
              <h5>24-hour Time Picker</h5>
              <p className="text-muted mb-0">
                Set options <code>&#123;minTime: &quot;16:00&quot;, maxTime: &quot;22:30&quot;&#125;</code>
              </p>
            </Col>
            <Col lg={6}>
              <Flatpickr
                className="form-control"
                placeholder="Select Time"
                options={{
                  defaultDate: '12:00',
                  enableTime: true,
                  noCalendar: true,
                  dateFormat: 'h:m',
                  minTime: '16:00',
                  maxTime: '22:30',
                }}
              />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-4">
            <Col lg={6}>
              <h5>Time Picker w/ Limits</h5>
              <p className="text-muted mb-0">
                Set options <code>&#123;minTime: &quot;16:00&quot;, maxTime: &quot;22:30&quot;&#125;</code>
              </p>
            </Col>
            <Col lg={6}>
              <Flatpickr
                className="form-control"
                placeholder="Select Time"
                options={{
                  defaultDate: '12:00',
                  enableTime: true,
                  noCalendar: true,
                  dateFormat: 'h:m',
                  minTime: '16:00',
                  maxTime: '22:30',
                }}
              />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-4">
            <Col lg={6}>
              <h5>Preloading Time</h5>
              <p className="text-muted mb-0">
                Set options <code>&#123;defaultDate: &quot;16:45&quot;&#125;</code>
              </p>
            </Col>
            <Col lg={6}>
              <Flatpickr
                className="form-control"
                placeholder="Select Time"
                options={{
                  enableTime: true,
                  noCalendar: true,
                  dateFormat: 'h:m',
                  defaultDate: '16:45',
                }}
              />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-4">
            <Col lg={6}>
              <h5>Inline</h5>
              <p className="text-muted mb-0">
                Set options <code>&#123;inline: true&#125;</code>
              </p>
            </Col>
            <Col lg={6}>
              <Flatpickr
                className="form-control flatpickr-inline-custom"
                placeholder="Select Time"
                options={{
                  enableTime: true,
                  noCalendar: true,
                  inline: true,
                }}
              />
            </Col>
          </Row>
        </CardBody>
      </Card>
    </>
  )
}
export default Pickers
