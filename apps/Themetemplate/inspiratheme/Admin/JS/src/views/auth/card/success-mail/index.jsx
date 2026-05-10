import auth from '@/assets/images/auth.jpg'
import icon from '@/assets/images/checkmark.png'
import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'
import { Button, Card, CardBody, Col, Container, Form, Row } from 'react-bootstrap'
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
                      </div>
                      <Form>
                        <div className="mb-4">
                          <div className="avatar-xxl mx-auto mt-2">
                            <div className="avatar-title bg-light-subtle border border-light border-dashed rounded-circle">
                              <img src={icon} alt="dark logo" height={64} />
                            </div>
                          </div>
                        </div>
                        <h4 className="fw-bold text-center mb-4">Well Done! Email verified Successfully</h4>
                        <div className="d-grid">
                          <Button variant="primary" type="submit" className="fw-semibold py-2">
                            Back to Dashboard
                          </Button>
                        </div>
                      </Form>
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
