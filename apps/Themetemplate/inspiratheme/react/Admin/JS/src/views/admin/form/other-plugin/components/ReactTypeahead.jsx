import { useState } from 'react'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { Typeahead as TypeaheadClient } from 'react-bootstrap-typeahead'
import { options } from './data'
const ReactTypeahead = () => {
  const [singleSelections, setSingleSelections] = useState([])
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle as="h4">Typeahead</CardTitle>
        </CardHeader>
        <CardBody>
          <Row className="g-3">
            <Col lg={6}>
              <h5 className="fw-semibold mb-1">Basic</h5>
            </Col>
            <Col lg={6}>
              <TypeaheadClient className="typeahead" labelKey="state" placeholder="Enter states from USA" options={options} selected={singleSelections} onChange={setSingleSelections} />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-3">
            <Col lg={6}>
              <h5 className="fw-semibold mb-1">BloodHound (Suggestion Engine)</h5>
            </Col>
            <Col lg={6}>
              <TypeaheadClient className="typeahead" labelKey="state" placeholder="Enter states from USA" options={options} multiple />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-3">
            <Col lg={6}>
              <h5 className="fw-semibold mb-1">Prefetch</h5>
            </Col>
            <Col lg={6}>
              <input className="form-control prefetch-typeahead" type="text" autoComplete="off" placeholder="Enter states from USA" />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-3">
            <Col lg={6}>
              <h5 className="fw-semibold mb-1">Default Suggestions</h5>
            </Col>
            <Col lg={6}>
              <input className="form-control default-suggestions-typeahead" type="text" autoComplete="off" placeholder="Default Suggestions" />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-3">
            <Col lg={6}>
              <h5 className="fw-semibold mb-1">Custom Template</h5>
            </Col>
            <Col lg={6}>
              <input className="form-control custom-template-typeahead" type="text" autoComplete="off" placeholder="Search For Oscar Winner" />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-3">
            <Col lg={6}>
              <h5 className="fw-semibold mb-1">Multiple Datasets</h5>
            </Col>
            <Col lg={6}>
              <input className="form-control multi-datasets-typeahead" type="text" autoComplete="off" placeholder="NBA and NHL Teams" />
            </Col>
          </Row>
        </CardBody>
      </Card>
    </>
  )
}
export default ReactTypeahead
