import PageBreadcrumb from '@/components/PageBreadcrumb'
import { useEffect, useState } from 'react'
import { Card, CardBody, Col, Row } from 'react-bootstrap'
const Preloader = () => {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])
  return (
    <>
      {loading ? (
        <div
          id="preloader"
          className="d-flex justify-content-center align-items-center"
          style={{
            height: '100vh',
          }}
        >
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <PageBreadcrumb title="Preloader" subtitle="Layouts" />
          <Row>
            <Col xs={12}>
              <Card>
                <CardBody className="text-center">
                  <h4 className="m-0">Your custom content here</h4>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </>
  )
}
export default Preloader
