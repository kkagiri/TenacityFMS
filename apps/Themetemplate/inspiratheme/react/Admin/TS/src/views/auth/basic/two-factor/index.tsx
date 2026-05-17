import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'
import { Link } from 'react-router'
import { Card, Col, Container, Row } from 'react-bootstrap'
import Forms from './components/Forms'


const Page = () => {
  return (
    <>
      <div className="auth-box overflow-hidden align-items-center d-flex">
        <Container>
          <Row className="justify-content-center">
            <Col xxl={4} md={6} sm={8}>
              <div className="auth-brand text-center mb-4">
                <AuthLogo />
                <h4 className="fw-bold mt-3">Two-Factor Verification!</h4>
                <p className="text-muted w-lg-75 mx-auto">Let’s get you signed in. Enter your PIN to continue</p>
              </div>

              <Card className="p-4">
                <div className="text-center mb-4">
                  <h5 className="text-muted fs-base mb-3">We've emailed you a 6-digit verification code we sent to</h5>

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
                  <Link to="/auth/sign-in" className="text-decoration-underline link-offset-3 fw-semibold">
                    Sign in
                  </Link>
                </p>
              </Card>
              <p className="text-center text-muted mt-4 mb-0">
                © {currentYear} {META_DATA.name} — by
                <span className="fw-semibold">&nbsp;{META_DATA.author}</span>
              </p>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  )
}

export default Page
