import auth from '@/assets/images/auth.jpg'
import Svg500 from '@/assets/images/svg/500.svg'
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
                <div className="p-2 text-center mt-auto">
                  <img src={Svg500} alt="" className="img-fluid" />
                  <h3 className="fw-bold text-uppercase">Internal Server Error</h3>
                  <p className="text-muted">Something went wrong on our end. Please try again later.</p>
                  <button className="btn btn-primary mt-3 rounded-pill">Go Home</button>
                </div>
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
    </>
  )
}
export default Page
