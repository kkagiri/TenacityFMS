import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { NumericFormat, PatternFormat } from './ReactNumberFormat'

const ReactInputMask = () => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle as="h4">Form Inputmask</CardTitle>
        </CardHeader>

        <CardBody>
          <Row className="g-3">
            <Col lg={6}>
              <h5>Date</h5>
              <p className="text-muted mb-0">
                Pass prop <code>format=&quot;##/##/####&quot;</code>
              </p>
            </Col>
            <Col lg={6}>
              <PatternFormat className="form-control" format="##/##/####" mask="_" />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />
          <Row className="g-3">
            <Col lg={6}>
              <h5>Hour</h5>
              <p className="text-muted mb-0">
                Pass prop <code>format=&quot;##:##:##&quot;</code>
              </p>
            </Col>
            <Col lg={6}>
              <PatternFormat className="form-control" format="##:##:##" mask="_" />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-3">
            <Col lg={6}>
              <h5>Date &amp; Hour</h5>
              <p className="text-muted mb-0">
                Pass prop <code>format=&quot;##/##/#### ##:##:##&quot;</code>
              </p>
            </Col>
            <Col lg={6}>
              <PatternFormat className="form-control" format="##/##/#### ##:##:##" mask="_" />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-3">
            <Col lg={6}>
              <h5>ZIP Code</h5>
              <p className="text-muted mb-0">
                Pass prop <code>format=&quot;#####-###&quot;</code>
              </p>
            </Col>
            <Col lg={6}>
              <PatternFormat className="form-control" format="#####-###" mask="_" />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-3">
            <Col lg={6}>
              <h5>Crazy ZIP Code</h5>
              <p className="text-muted mb-0">
                Pass prop <code>format=&quot;#-##-##-##&quot;</code>
              </p>
            </Col>
            <Col lg={6}>
              <PatternFormat className="form-control" format="#-##-##-##" mask="_" />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-3">
            <Col lg={6}>
              <h5>Money</h5>
              <p className="text-muted mb-0">
                Pass prop <code>thousandSeparator=&quot;.&quot;</code> and <code>decimalSeparator=&quot;,&quot;</code>
              </p>
            </Col>
            <Col lg={6}>
              <NumericFormat className="form-control" thousandSeparator="." decimalSeparator="," decimalScale={2} fixedDecimalScale allowNegative={false} />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-3">
            <Col lg={6}>
              <h5>Money 2</h5>
              <p className="text-muted mb-0">
                Pass prop <code>thousandSeparator=&quot;.&quot;</code> <code>decimalSeparator=&quot;,&quot;</code> and <code>prefix=&quot;$</code>
              </p>
            </Col>
            <Col lg={6}>
              <NumericFormat className="form-control" thousandSeparator="." decimalSeparator="," decimalScale={2} fixedDecimalScale prefix="$" allowNegative={false} />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-3">
            <Col lg={6}>
              <h5>Telephone</h5>
              <p className="text-muted mb-0">
                Pass prop <code>format=&quot;####-####&quot;</code>
              </p>
            </Col>
            <Col lg={6}>
              <PatternFormat className="form-control" format="####-####" mask="_" />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-3">
            <Col lg={6}>
              <h5>Telephone with Area Code</h5>
              <p className="text-muted mb-0">
                Pass prop <code>format=&quot;(##) ####-####&quot;</code>
              </p>
            </Col>
            <Col lg={6}>
              <PatternFormat className="form-control" format="(##) ####-####" mask="_" />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-3">
            <Col lg={6}>
              <h5>US Telephone</h5>
              <p className="text-muted mb-0">
                Pass prop <code>format=&quot;(###) ###-####&quot;</code>
              </p>
            </Col>
            <Col lg={6}>
              <PatternFormat className="form-control" format="(###) ###-####" mask="_" />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-3">
            <Col lg={6}>
              <h5>São Paulo Cellphones</h5>
              <p className="text-muted mb-0">
                Pass prop <code>format=&quot;(##) #####-####&quot;</code>
              </p>
            </Col>
            <Col lg={6}>
              <PatternFormat className="form-control" format="(##) #####-####" mask="_" />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-3">
            <Col lg={6}>
              <h5>CPF</h5>
              <p className="text-muted mb-0">
                Pass prop <code>format=&quot;###.###.###-##&quot;</code>
              </p>
            </Col>
            <Col lg={6}>
              <PatternFormat className="form-control" format="###.###.###-##" mask="_" />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-3">
            <Col lg={6}>
              <h5>CNPJ</h5>
              <p className="text-muted mb-0">
                Pass prop <code>format=&quot;##.###.###/####-##&quot;</code>
              </p>
            </Col>
            <Col lg={6}>
              <PatternFormat className="form-control" format="##.###.###/####-##" mask="_" />
            </Col>
          </Row>
          <div className="my-4 border-top border-dashed" />

          <Row className="g-3">
            <Col lg={6}>
              <h5>IP Address</h5>
              <p className="text-muted mb-0">
                Pass prop <code>format=&quot;###.###.###.###&quot;</code>
              </p>
            </Col>
            <Col lg={6}>
              <PatternFormat className="form-control" format="###.###.###.###" mask="_" />
            </Col>
          </Row>
        </CardBody>
      </Card>
    </>
  )
}

export default ReactInputMask
