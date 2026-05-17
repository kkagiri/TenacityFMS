import auth from '@/assets/images/auth.jpg'
import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'
import { Card, CardBody, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import Form from './components/Form'
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
                        <h4 className="fw-bold mt-4">Setup New Password!</h4>
                        <p className="text-muted w-lg-75 mx-auto">We've emailed you a 6-digit verification code. Please enter it below to confirm your Email Address.</p>
                      </div>
                      <Form />
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
                        © {currentYear} {META_DATA.name} — by&nbsp;
                        <span className="fw-bold">{META_DATA.author}</span>
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
