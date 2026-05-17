import auth from '@/assets/images/auth.jpg'
import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'
import { Card, CardBody, Col, Container, Row } from 'react-bootstrap'
const Page = () => {
  return (
    <>
      <div className="auth-box d-flex align-items-center">
        <Container fluid="xxl">
          <Row className="align-items-center justify-content-center">
            <Col xl={10}>
              <Card className="rounded-3 p-0 rounded-4">
                <CardBody className="p-0">
                  <Row className="justify-content-between g-0">
                    <Col lg={6}>
                      <Card className="mb-0 border-0 rounded-4">
                        <CardBody>
                          <div className="auth-brand text-center mb-3">
                            <AuthLogo />
                          </div>
                          <div className="p-2 text-center">
                            <div className="error-wave-container error-text-alt justify-content-center gap-1">
                              <span className="error-wave-char">4</span>&nbsp;
                              <span className="error-wave-char">0</span>&nbsp;
                              <span className="error-wave-char">8</span>
                            </div>
                            <h3 className="fw-bold text-uppercase">Request Timeout</h3>
                            <p className="text-muted">Your request took too long, and the server timed out. Please try again later.</p>
                            <button className="btn btn-primary mt-3 rounded-pill">Back to Safety</button>
                          </div>
                          <p className="text-center text-muted mt-5 mb-0">
                            © {currentYear}&nbsp;
                            {META_DATA.name} — by&nbsp;
                            <span className="fw-bold">{META_DATA.author}</span>
                          </p>
                        </CardBody>
                      </Card>
                    </Col>
                    <Col lg={6} className="d-none d-lg-block">
                      <div
                        className="h-100 position-relative card-side-img rounded-end-4 rounded-end rounded-0 overflow-hidden"
                        style={{
                          backgroundImage: `url("${auth}")`,
                        }}
                      >
                        <div className="p-4 card-img-overlay rounded-4 rounded-start-0 auth-overlay d-flex align-items-end justify-content-center" />
                      </div>
                    </Col>
                  </Row>
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
