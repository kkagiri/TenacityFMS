import { Card, CardBody, CardHeader, CardTitle, Col, FormCheck, Row } from 'react-bootstrap'
import FormCheckInput from 'react-bootstrap/esm/FormCheckInput'
import FormCheckLabel from 'react-bootstrap/esm/FormCheckLabel'

const ChecksRadiosSwitches = () => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle as="h4">Checks, Radios and Switches</CardTitle>
        </CardHeader>
        <CardBody>
          <Row className="g-lg-4 g-2">
            <Col lg={2}>
              <label className="col-form-label">Checkboxes</label>
            </Col>
            <Col lg={5}>
              <FormCheck type="checkbox" label="Default Checkbox" className="mb-2" />
              <div className="form-check mb-2">
                <input type="checkbox" className="form-check-input form-check-input-light" id="checkLight" />
                <label className="form-check-label" htmlFor="checkLight">
                  Light Checkbox
                </label>
              </div>
              <div className="mb-2">
                <FormCheck inline type="checkbox" label="Inline 1" defaultChecked />
                <FormCheck inline type="checkbox" label="Inline 2" />
              </div>
              <div className="form-check mb-2">
                <input className="form-check-input" type="checkbox" id="checkIndeterminate" />
                <label className="form-check-label" htmlFor="checkIndeterminate">
                  Disabled indeterminate checkbox
                </label>
              </div>

              <FormCheck type="checkbox" label="Disabled checked checkbox" defaultChecked disabled className="mb-2" onChange={() => {}} />

              <h5 className="mt-3">Sizes</h5>
              <FormCheck className="form-check fs-lg mb-2">
                <FormCheckInput type="checkbox" className="mt-1" id="checkSize1" defaultChecked />
                <FormCheckLabel className="fs-base" htmlFor="checkSize1">
                  I'm 16px Checkbox
                </FormCheckLabel>
              </FormCheck>

              <FormCheck className="form-check-secondary fs-xxl mb-2">
                <FormCheckInput type="checkbox" className="mt-1" id="checkSize2" defaultChecked />
                <FormCheckLabel className="fs-base" htmlFor="checkSize2">
                  i'm 20px Checkbox
                </FormCheckLabel>
              </FormCheck>
            </Col>
          </Row>
          <div className="border-top border-dashed my-3" />

          <Row className="g-lg-4 g-2">
            <Col lg={2}>
              <label className="col-form-label">Radios</label>
            </Col>
            <Col lg={5}>
              <FormCheck type="radio" name="group1" label="Option 1" className="mb-2" defaultChecked />

              <FormCheck type="radio" name="group1" label="Option 2" className="mb-2" />
              <div className="mb-2">
                <FormCheck type="radio" name="group2" inline label="Inline 1" defaultChecked />
                <FormCheck type="radio" name="group2" inline label="Inline 2" />
              </div>

              <FormCheck type="radio" checked disabled label="Disabled Checked Radio" className="mb-2" onChange={() => {}} />

              <h5 className="mt-3">Sizes</h5>
              <div className="mb-2">
                <FormCheck className="fs-lg form-check-inline">
                  <FormCheckInput type="radio" name="paymentMethod" id="radioCash" defaultValue="cash" defaultChecked />
                  <FormCheckLabel className="form-check-label fs-base" htmlFor="radioCash">
                    Cash
                  </FormCheckLabel>
                </FormCheck>
                <FormCheck className="fs-lg form-check-inline">
                  <FormCheckInput type="radio" name="paymentMethod" id="radioCard" defaultValue="card" />
                  <FormCheckLabel className="fs-base" htmlFor="radioCard">
                    Card
                  </FormCheckLabel>
                </FormCheck>
              </div>

              <div className="mb-2">
                <FormCheck className="fs-xxl form-check-inline">
                  <FormCheckInput type="radio" name="deliveryOption" id="radioPickup" defaultValue="pickup" defaultChecked />
                  <FormCheckLabel className="fs-base" htmlFor="radioPickup">
                    Pickup
                  </FormCheckLabel>
                </FormCheck>
                <FormCheck className="form-check fs-xxl form-check-inline">
                  <FormCheckInput type="radio" name="deliveryOption" id="radioHome" defaultValue="home" />
                  <FormCheckLabel className="fs-base" htmlFor="radioHome">
                    Home Delivery
                  </FormCheckLabel>
                </FormCheck>
              </div>
            </Col>
          </Row>
          <div className="border-top border-dashed my-3" />

          <Row className="g-lg-4 g-2">
            <Col lg={2}>
              <label className="col-form-label">Switches</label>
            </Col>
            <Col lg={5}>
              <FormCheck type="switch" label="Enabled Switch" className="mb-2" defaultChecked />
              <FormCheck type="switch" label="Disabled Switch" disabled className="mb-2" />
              <h5 className="mt-3">Sizes</h5>
              <FormCheck className="form-switch fs-lg mb-2">
                <FormCheckInput type="checkbox" className="mt-1" id="checkboxSize16" defaultChecked />
                <FormCheckLabel className="fs-base" htmlFor="checkboxSize16">
                  {' '}
                  I'm 16px Switch
                </FormCheckLabel>
              </FormCheck>

              <FormCheck className="form-switch form-check-secondary fs-xxl mb-2">
                <FormCheckInput type="checkbox" className="mt-1" id="checkboxSize20" defaultChecked />
                <FormCheckLabel className="fs-base" htmlFor="checkboxSize20">
                  I'm 20px Switch
                </FormCheckLabel>
              </FormCheck>
            </Col>
          </Row>
          <div className="border-top border-dashed my-3" />

          <Row className="g-lg-4 g-2">
            <Col lg={2}>
              <label className="col-form-label">Reverse</label>
            </Col>
            <Col lg={5}>
              <div className="w-lg-50">
                <FormCheck type="checkbox" reverse label="Reverse checkbox" className="mb-2" defaultChecked />
                <FormCheck type="radio" reverse label="Disabled reverse radio" className="mb-2" />
                <FormCheck type="switch" reverse label="Reverse switch checkbox input" defaultChecked />
              </div>
            </Col>
          </Row>
          <div className="border-top border-dashed my-3" />

          <Row className="g-lg-4 g-2">
            <Col lg={2}>
              <label className="col-form-label">Colored Checkboxes</label>
            </Col>
            <Col lg={5}>
              <div className="d-flex flex-wrap gap-4">
                <div>
                  <div className="form-check form-check-primary mb-2">
                    <FormCheck type="checkbox" id="checkPrimary" checked onChange={() => {}} />
                    <label className="form-check-label" htmlFor="checkPrimary">
                      Primary
                    </label>
                  </div>
                  <div className="form-check form-check-secondary mb-2">
                    <FormCheck type="checkbox" id="checkSecondary" checked onChange={() => {}} />
                    <label className="form-check-label" htmlFor="checkSecondary">
                      Secondary
                    </label>
                  </div>
                  <div className="form-check form-check-success mb-2">
                    <FormCheck type="checkbox" id="checkSuccess" checked onChange={() => {}} />
                    <label className="form-check-label" htmlFor="checkSuccess">
                      Success
                    </label>
                  </div>
                  <div className="form-check form-check-info mb-2">
                    <FormCheck type="checkbox" id="checkInfo" checked onChange={() => {}} />
                    <label className="form-check-label" htmlFor="checkInfo">
                      Info
                    </label>
                  </div>
                </div>
                <div>
                  <div className="form-check form-check-warning mb-2">
                    <FormCheck type="checkbox" id="checkWarning" checked onChange={() => {}} />
                    <label className="form-check-label" htmlFor="checkWarning">
                      Warning
                    </label>
                  </div>
                  <div className="form-check form-check-danger mb-2">
                    <FormCheck type="checkbox" id="checkDanger" checked onChange={() => {}} />
                    <label className="form-check-label" htmlFor="checkDanger">
                      Danger
                    </label>
                  </div>
                  <div className="form-check form-check-dark">
                    <FormCheck type="checkbox" id="checkDark" checked onChange={() => {}} />
                    <label className="form-check-label" htmlFor="checkDark">
                      Dark
                    </label>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
          <div className="border-top border-dashed my-3" />

          <Row className="g-lg-4 g-2">
            <Col lg={2}>
              <label className="col-form-label">Colored Radios</label>
            </Col>
            <Col lg={5}>
              <div className="d-flex flex-wrap gap-4">
                <div>
                  <div className="form-check form-check-primary mb-2">
                    <FormCheck type="radio" name="radioPrimary" id="radioPrimary" checked onChange={() => {}} />
                    <label className="form-check-label" htmlFor="radioPrimary">
                      Primary
                    </label>
                  </div>
                  <div className="form-check form-check-secondary mb-2">
                    <FormCheck type="radio" name="radioSecondary" id="radioSecondary" checked onChange={() => {}} />
                    <label className="form-check-label" htmlFor="radioSecondary">
                      Secondary
                    </label>
                  </div>
                  <div className="form-check form-check-success mb-2">
                    <FormCheck type="radio" name="radioSuccess" id="radioSuccess" checked onChange={() => {}} />
                    <label className="form-check-label" htmlFor="radioSuccess">
                      Success
                    </label>
                  </div>
                  <div className="form-check form-check-info mb-2">
                    <FormCheck type="radio" name="radioInfo" id="radioInfo" checked onChange={() => {}} />
                    <label className="form-check-label" htmlFor="radioInfo">
                      Info
                    </label>
                  </div>
                </div>
                <div>
                  <div className="form-check form-check-warning mb-2">
                    <FormCheck type="radio" name="radioWarning" id="radioWarning" checked onChange={() => {}} />
                    <label className="form-check-label" htmlFor="radioWarning">
                      Warning
                    </label>
                  </div>
                  <div className="form-check form-check-danger mb-2">
                    <FormCheck type="radio" name="radioDanger" id="radioDanger" checked onChange={() => {}} />
                    <label className="form-check-label" htmlFor="radioDanger">
                      Danger
                    </label>
                  </div>
                  <div className="form-check form-check-dark">
                    <FormCheck type="radio" name="radioDark" id="radioDark" checked onChange={() => {}} />
                    <label className="form-check-label" htmlFor="radioDark">
                      Dark
                    </label>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
          <div className="border-top border-dashed my-3" />

          <Row className="g-lg-4 g-2">
            <Col lg={2}>
              <label className="col-form-label">Colored Switches</label>
            </Col>
            <Col lg={5}>
              <div className="d-flex flex-wrap gap-4">
                <div>
                  <div className="form-check form-check-primary form-switch mb-2">
                    <input type="checkbox" className="form-check-input" id="switchPrimary" checked onChange={() => {}} />
                    <label className="form-check-label" htmlFor="switchPrimary">
                      Primary
                    </label>
                  </div>
                  <div className="form-check form-check-secondary form-switch mb-2">
                    <input type="checkbox" className="form-check-input" id="switchSecondary" checked onChange={() => {}} />
                    <label className="form-check-label" htmlFor="switchSecondary">
                      Secondary
                    </label>
                  </div>
                  <div className="form-check form-check-success form-switch mb-2">
                    <input type="checkbox" className="form-check-input" id="switchSuccess" checked onChange={() => {}} />
                    <label className="form-check-label" htmlFor="switchSuccess">
                      Success
                    </label>
                  </div>
                  <div className="form-check form-check-info form-switch mb-2">
                    <input type="checkbox" className="form-check-input" id="switchInfo" checked onChange={() => {}} />
                    <label className="form-check-label" htmlFor="switchInfo">
                      Info
                    </label>
                  </div>
                </div>
                <div>
                  <div className="form-check form-check-warning form-switch mb-2">
                    <input type="checkbox" className="form-check-input" id="switchWarning" checked onChange={() => {}} />
                    <label className="form-check-label" htmlFor="switchWarning">
                      Warning
                    </label>
                  </div>
                  <div className="form-check form-check-danger form-switch mb-2">
                    <input type="checkbox" className="form-check-input" id="switchDanger" checked onChange={() => {}} />
                    <label className="form-check-label" htmlFor="switchDanger">
                      Danger
                    </label>
                  </div>
                  <div className="form-check form-check-dark form-switch">
                    <input type="checkbox" className="form-check-input" id="switchDark" checked onChange={() => {}} />
                    <label className="form-check-label" htmlFor="switchDark">
                      Dark
                    </label>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
          <div className="border-top border-dashed my-3" />

          <Row className="g-lg-4 g-2">
            <Col lg={2}>
              <label className="col-form-label">Checkbox Toggle</label>
            </Col>
            <Col lg={5}>
              <div className="mb-2">
                <input type="checkbox" className="btn-check" id="btncheck1" />
                <label className="btn btn-outline-primary" htmlFor="btncheck1">
                  Single Toggle
                </label>
              </div>
              <div className="btn-group" role="group" aria-label="Checkbox toggle group">
                <input type="checkbox" className="btn-check" id="btncheck2" />
                <label className="btn btn-outline-primary" htmlFor="btncheck2">
                  One
                </label>
                <input type="checkbox" className="btn-check" id="btncheck3" />
                <label className="btn btn-outline-primary" htmlFor="btncheck3">
                  Two
                </label>
                <input type="checkbox" className="btn-check" id="btncheck4" />
                <label className="btn btn-outline-primary" htmlFor="btncheck4">
                  Three
                </label>
              </div>
            </Col>
          </Row>
          <div className="border-top border-dashed my-3" />

          <Row className="g-lg-4 g-2">
            <Col lg={2}>
              <label className="col-form-label">Radio Toggle</label>
            </Col>
            <Col lg={5}>
              <div className="btn-group" role="group" aria-label="Radio toggle group">
                <input type="radio" className="btn-check" name="btnradio" id="btnradio1" defaultChecked />
                <label className="btn btn-outline-secondary" htmlFor="btnradio1">
                  Left
                </label>
                <input type="radio" className="btn-check" name="btnradio" id="btnradio2" />
                <label className="btn btn-outline-secondary" htmlFor="btnradio2">
                  Middle
                </label>
                <input type="radio" className="btn-check" name="btnradio" id="btnradio3" />
                <label className="btn btn-outline-secondary" htmlFor="btnradio3">
                  Right
                </label>
              </div>
            </Col>
          </Row>
        </CardBody>
      </Card>
    </>
  )
}

export default ChecksRadiosSwitches
