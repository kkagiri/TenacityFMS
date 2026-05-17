import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'
import { Link } from 'react-router'
import { Card, Col, Container, Row } from 'react-bootstrap'
import LoginForm from './components/Form'


const Page = () => {
  return (
    <>
      <div className="auth-box overflow-hidden align-items-center d-flex">
        <Container>
          <Row className="justify-content-center">
            <Col xxl={4} md={6} sm={8}>
              <div className="auth-brand text-center mb-4">
                <AuthLogo />
                <h4 className="fw-bold mt-3">Welcome</h4>
                <p className="text-muted w-lg-75 mx-auto">Let’s get you signed in. Enter your email and password to continue.</p>
              </div>

              <Card className="p-4">
                <LoginForm />

                <p className="text-muted text-center mt-4 mb-0">
                  New here?{' '}
                  <Link to="/auth/sign-up" className="text-decoration-underline link-offset-3 fw-semibold">
                    Create an account
                  </Link>
                </p>
              </Card>

              <p className="text-center text-muted mt-4 mb-0">
                © {currentYear} {META_DATA.name} — by
                <span className="fw-bold"> {META_DATA.author}</span>
              </p>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  )
}

export default Page
