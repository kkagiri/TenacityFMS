import auth from '@/assets/images/auth.jpg'
import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'
import { Card, CardBody, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import LoginForm from './components/LoginForm'
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
                        <h4 className="fw-bold mt-4">Welcome to Admin</h4>
                        <p className="text-muted w-lg-75 mx-auto">Let’s get you signed in. Enter your email and password to continue.</p>
                      </div>

                      <LoginForm />

                      <p className="text-muted text-center mt-4 mb-0">
                        New here?&nbsp;
                        <Link to="/auth/card/sign-up" className="text-decoration-underline link-offset-3 fw-semibold">
                          Create an account
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
