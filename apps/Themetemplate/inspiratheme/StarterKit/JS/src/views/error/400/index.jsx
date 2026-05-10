import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'
import { Button, Card, Col, Container, Row } from 'react-bootstrap'
const Page = () => {
  return (
    <>
      <div className="auth-box overflow-hidden align-items-center d-flex">
        <Container>
          <Row className="justify-content-center">
            <Col xxl={5} md={6} sm={8}>
              <Card className="p-4">
                <div className="auth-brand text-center mb-2">
                  <AuthLogo />
                </div>
                <div className="p-2 text-center">
                  <div className="error-text-alt fs-72">400</div>
                  <h3 className="fw-bold text-uppercase">Oops! Invalid Request</h3>
                  <p className="text-muted">The request couldn’t be processed. Please check the URL or try again.</p>
                  <div className="d-flex justify-content-center gap-2 mt-4">
                    <Button variant="outline-secondary">Go Back</Button>
                    <Button variant="primary">Back to Dashboard</Button>
                  </div>
                </div>
              </Card>
              <p className="text-center text-muted mt-4 mb-0">
                © {currentYear} {META_DATA.name} — by <span className="fw-semibold">{META_DATA.author}</span>
              </p>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  )
}
export default Page
