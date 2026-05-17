import maintenanceImg from '@/assets/images/maintenance.svg'
import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'
import { Card, CardBody, Col, Container, Row } from 'react-bootstrap'
const Page = () => {
  return (
    <>
      <div className="auth-box d-flex align-items-center">
        <Container fluid="xxl">
          <Row className="align-items-center justify-content-center">
            <Col xl={6}>
              <Card className="mb-0 rounded-4">
                <CardBody>
                  <div className="auth-brand text-center mb-0">
                    <AuthLogo />
                  </div>
                  <div className="p-2 text-center">
                    <div className="w-md-50 mx-auto">
                      <img src={maintenanceImg} alt="Maintenance" className="img-fluid" />
                    </div>
                    <h3 className="fw-bold text-uppercase">Site Under Maintenance</h3>
                    <p className="text-muted">
                      We’re currently performing scheduled maintenance.
                      <br />
                      Please check back soon.
                    </p>
                    <button className="btn btn-primary mt-3 rounded-pill me-1">Call Now</button>&nbsp;
                    <button className="btn btn-info mt-3 rounded-pill">Email Us</button>
                  </div>
                  <p className="text-center text-muted mt-5 mb-0">
                    © {currentYear} {META_DATA.name} — by&nbsp;
                    <span className="fw-bold">{META_DATA.author}</span>
                  </p>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  )
}
export default Page
