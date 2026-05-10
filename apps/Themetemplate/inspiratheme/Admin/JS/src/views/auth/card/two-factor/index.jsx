import auth from '@/assets/images/auth.jpg'
import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'
import { Card, CardBody, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import Forms from './components/Forms'
const Page = () => {
  return (
    <>
      <div className="auth-box d-flex align-items-center">
        <Container fluid="xxl">
          <Row className="align-items-center justify-content-center">
            <Col xl={10}>
              <Card className="rounded-4">
                <Row className="justify-content-between g-0">
                  <Col lg={6}>
                    <CardBody>
                      <div className="auth-brand text-center mb-4">
                        <AuthLogo />
                        <h4 className="fw-bold mt-4">Request sent Successfully!</h4>
                      </div>
                      <div className="text-center mb-4">
                        <h5 className="text-muted fs-base mb-3">We&apos;ve emailed you a 6-digit verification code we sent to</h5>
                        <div className="fw-bold fs-3">******6789</div>
                      </div>
                      <Forms />
                      <p className="mt-4 text-muted text-center mb-4">
                        Don&apos;t have a code?&nbsp;
                        <Link to="" className="text-decoration-underline link-offset-2 fw-semibold">
                          Resend
                        </Link>
                        &nbsp;or&nbsp;
                        <Link to="" className="text-decoration-underline link-offset-2 fw-semibold">
                          Call Us
                        </Link>
                      </p>
                      <p className="text-muted text-center mb-0">
                        Return to&nbsp;
                        <Link to="/auth/card/sign-in" className="text-decoration-underline link-offset-3 fw-semibold">
                          Sign in
                        </Link>
                      </p>
                      <p className="text-center text-muted mt-4 mb-0">
                        © {currentYear} {META_DATA.name} — by <span className="fw-bold">{META_DATA.author}</span>
                      </p>
                    </CardBody>
                  </Col>
                  <Col lg={6} className="d-none d-lg-block">
                    <div
                      className="h-100 position-relative card-side-img rounded-end overflow-hidden"
                      style={{
                        backgroundImage: `url(${auth})`,
                      }}
                    >
                      <div className="p-4 card-img-overlay rounded-end auth-overlay d-flex align-items-end justify-content-center" />
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  )
}
export default Page
