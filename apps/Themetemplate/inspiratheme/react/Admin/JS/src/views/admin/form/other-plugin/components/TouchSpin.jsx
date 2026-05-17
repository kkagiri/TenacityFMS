import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import TouchSpinInput from './TouchSpinInput'
const TouchSpin = () => {
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex-grow-1">
            <CardTitle as="h4">Input Touchspin</CardTitle>
          </div>
          <span className="badge badge-soft-success badge-label py-1 fs-xxs">Exclusive</span>
        </CardHeader>
        <CardBody>
          <Row className="g-3">
            <Col lg={6}>
              <h5 className="fw-semibold mb-1">Default Touchspin</h5>
            </Col>
            <Col lg={6}>
              <TouchSpinInput buttonClassName="floating" size="sm" value={1} inputClassName="border-0" max={800000} />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />
          <Row className="g-3">
            <Col lg={6}>
              <h5 className="fw-semibold mb-1">Sizes</h5>
            </Col>
            <Col lg={6}>
              <TouchSpinInput buttonClassName="floating" inputClassName="border-0" className="input-group-sm" size="sm" value={0} />

              <TouchSpinInput buttonClassName="floating" inputClassName="border-0" className="input-group-lg mt-2" size="sm" value={0} />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />
          <Row className="g-3">
            <Col lg={6}>
              <h5 className="fw-semibold mb-1">Colors</h5>
            </Col>
            <Col lg={6}>
              {['primary', 'secondary', 'info', 'success', 'warning', 'danger', 'dark', 'purple', 'soft-primary'].map((color, idx) => (
                <TouchSpinInput buttonClassName="floating" inputClassName="border-0" key={idx} variant={color} value={100} className="mt-2" />
              ))}
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />
          <Row className="g-3">
            <Col lg={6}>
              <h5 className="fw-semibold mb-1">Readonly</h5>
            </Col>
            <Col lg={6}>
              <TouchSpinInput buttonClassName="floating" inputClassName="border-0" value={1} readOnly />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />
          <Row className="g-3">
            <Col lg={6}>
              <h5 className="fw-semibold mb-1">Disabled</h5>
            </Col>
            <Col lg={6}>
              <TouchSpinInput buttonClassName="floating" inputClassName="border-0" value={1} disabled />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />
          <Row className="g-3">
            <Col lg={6}>
              <h5 className="fw-semibold mb-1">Style</h5>
            </Col>
            <Col lg={6}>
              <TouchSpinInput inputClassName="border-0" value={100} variant="primary" buttonClassName="floating rounded-circle" />

              <TouchSpinInput inputClassName="border-0" value={100} variant="primary" buttonClassName="floating rounded-circle" className="rounded-pill mt-2" />

              <TouchSpinInput value={2} max={100} min={0} variant="outline-secondary" inputClassName="border-secondary" className="border-0 mt-2" />

              <TouchSpinInput value={2} max={100} min={0} variant="soft-success" inputClassName="border-success-subtle" className="border-0 mt-2" />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />
          <Row className="g-3">
            <Col lg={6}>
              <h5 className="fw-semibold mb-1">Vertical Style</h5>
            </Col>
            <Col lg={6}>
              <TouchSpinInput value={1} max={10} min={0} inputClassName="border-0" className="input-group-sm" vertical buttonClassName="btn-soft-success" buttonClassName2="btn-soft-danger" />

              <TouchSpinInput value={1} max={10} min={0} inputClassName="border-0" className="mt-2" vertical buttonClassName="btn-success" buttonClassName2="btn-danger" />

              <TouchSpinInput value={1} max={10} min={0} inputClassName="border-0" className="input-group-lg mt-2" vertical buttonClassName="btn-dark" buttonClassName2="btn-dark" />
            </Col>
          </Row>
        </CardBody>
      </Card>
    </>
  )
}
export default TouchSpin
