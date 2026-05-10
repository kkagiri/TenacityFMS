import auth from '@/assets/images/auth.jpg'
import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'
import { Link } from 'react-router'
import { Card, CardBody, Col, Row } from 'react-bootstrap'
import Forms from './components/Forms'


const Page = () => {
  return (
    <div className="auth-box p-0 w-100">
      <Row className="w-100 g-0">
        <Col>
          <div className="h-100 position-relative card-side-img rounded-0 overflow-hidden" style={{ backgroundImage: `url("${auth}")` }}>
            <div className="p-4 card-img-overlay auth-overlay d-flex align-items-end justify-content-center" />
          </div>
        </Col>
        <div className="col-xl-auto">
          <Card className="auth-box-form border-0 mb-0">
            <CardBody className="min-vh-100 d-flex flex-column justify-content-center">
              <div className="auth-brand mb-0 text-center">
                <AuthLogo />
              </div>
              <div className="mt-auto text-center">
                <h4 className="fw-bold">Two-Factor Verification!</h4>
                <p className="text-muted mx-auto mb-5">Let’s get you signed in. Enter your PIN to continue</p>
                <div className="text-center mb-4">
                  <h5 className="text-muted fs-base mb-3">We've emailed you a 6-digit verification code we sent to</h5>
                  <div className="fw-bold fs-3">******6789</div>
                </div>
                <Forms />
                <p className="mt-4 text-muted text-center mb-4">
                  Don’t have a code?&nbsp;
                  <Link to="#" className="text-decoration-underline link-offset-2 fw-semibold">
                    Resend
                  </Link>
                  &nbsp;or&nbsp;
                  <Link to="#" className="text-decoration-underline link-offset-2 fw-semibold">
                    Call Us
                  </Link>
                </p>
              </div>
              <p className="text-muted text-center mt-4 mb-0">
                Return to&nbsp;
                <Link to="/auth/split/sign-in" className="text-decoration-underline link-offset-3 fw-semibold">
                  Sign in
                </Link>
              </p>
              <p className="text-center text-muted mt-auto mb-0">
                © {currentYear}&nbsp;
                {META_DATA.name} — by&nbsp;
                <span className="fw-bold">{META_DATA.author}</span>
              </p>
            </CardBody>
          </Card>
        </div>
      </Row>
    </div>
  )
}

export default Page
