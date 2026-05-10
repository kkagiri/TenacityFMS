import auth from '@/assets/images/auth.jpg'
import AuthLogo from '@/components/AuthLogo'
import { currentYear, META_DATA } from '@/config/constants'
import { Card, CardBody, Col, Row } from 'react-bootstrap'
const Page = () => {
  return (
    <>
      <div className="auth-box p-0 w-100">
        <Row className="w-100 g-0">
          <Col>
            <div
              className="h-100 position-relative card-side-img rounded-0 overflow-hidden"
              style={{
                backgroundImage: `url("${auth}")`,
              }}
            >
              <div className="p-4 card-img-overlay auth-overlay d-flex align-items-end justify-content-center" />
            </div>
          </Col>
          <div className="col-xl-auto">
            <Card className="auth-box-form border-0 mb-0">
              <CardBody className="min-vh-100 d-flex flex-column justify-content-center">
                <div className="auth-brand text-center">
                  <AuthLogo />
                </div>
                <div className="p-2 text-center mt-auto">
                  <div className="error-glitch" data-text={403}>
                    403
                  </div>
                  <h3 className="fw-bold text-uppercase">Forbidden</h3>
                  <p className="text-muted">You don't have permission to access this resource.</p>
                  <button className="btn btn-primary mt-3 rounded-pill">Go Home</button>
                </div>
                <p className="text-center text-muted mt-auto mb-0">
                  © {currentYear}
                  {META_DATA.name} — by
                  <span className="fw-bold">{META_DATA.author}</span>
                </p>
              </CardBody>
            </Card>
          </div>
        </Row>
      </div>
    </>
  )
}
export default Page
