import { currentYear, META_DATA } from '@/config/constants'
import { Col, Container, Row } from 'react-bootstrap'
const Footer = () => {
  return (
    <>
      <footer className="footer">
        <Container fluid>
          <Row>
            <Col md={6} className="text-center text-md-start">
              © {currentYear} {META_DATA.name} By <span className="fw-semibold">{META_DATA.author}</span>
            </Col>
            <Col md={6}>
              <div className="text-md-end d-none d-md-block">
                10GB of <span className="fw-bold">250GB</span> Free.
              </div>
            </Col>
          </Row>
        </Container>
      </footer>
    </>
  )
}
export default Footer
