import logoDark from '@/assets/images/logo-black.png'
import logoLight from '@/assets/images/logo.png'
import Icon from '@/components/wrappers/Icon'
import Tour from '@rc-component/tour'
import { Link } from 'react-router'
import { useRef, useState } from 'react'
import { Button, Card, CardBody, CardFooter, Col, Row } from 'react-bootstrap'
import { featuresData } from './data'

const TourPage = () => {
  const [openTour, setOpenTour] = useState(false)

  const step1Ref = useRef<HTMLAnchorElement | null>(null)
  const step2Ref = useRef<HTMLAnchorElement | null>(null)
  const step3Ref = useRef<HTMLDivElement | null>(null)
  const step4Ref = useRef<HTMLButtonElement | null>(null)
  return (
    <>
      <CardBody>
        <Row className="justify-content-center">
          <Col lg={5}>
            <div className="text-center mt-4 mb-5">
              <div className="auth-brand text-center mb-4">
                <Link to="/" className="logo-dark">
                  <img src={logoDark} alt="dark logo" height={32} />
                </Link>
                <Link to="/" className="logo-light">
                  <img src={logoLight} alt="logo" height={32} />
                </Link>
              </div>
              <h5 className="fs-lg mb-2">Powerful & Flexible Admin Panel Template</h5>
              <p className="text-muted fs-sm">
                Our admin panel provides a robust foundation for modern web apps. With support for multiple frameworks and over a dozen demo variations, developers can build exactly what they need, fast and easily. Customize with ease and enjoy consistent UI across projects.
              </p>

              <div className="d-flex justify-content-center mt-4 flex-wrap gap-2">
                <Button
                  variant="primary"
                  onClick={() => {
                    if (step1Ref.current) {
                      setOpenTour(true)
                    }
                  }}
                >
                  <Icon icon="player-play" className="me-1" /> Start Tour
                </Button>

                <Link ref={step1Ref} to="" className="btn btn-dark">
                  <Icon icon="compass" className="me-1" /> Explore Features
                </Link>

                <Link ref={step2Ref} to="" target="_blank" className="btn btn-danger">
                  <Icon icon="shopping-cart" className="me-1" /> Buy Now
                </Link>
              </div>
            </div>
          </Col>
        </Row>

        <div data-tg-order="3" data-tg-tour="Learn more about the versatile services and modules we provide to enhance development." data-tg-title="Core Features" ref={step3Ref}>
          <div className="row">
            <div className="col-12 text-center">
              <span className="text-muted rounded-3 d-inline-block">🚀 Empowering your digital journey</span>
              <h3 className="mt-3 fw-bold mb-5">
                Framework
                <mark>Support &amp; Core</mark>
                Features
              </h3>
            </div>
          </div>

          <Row>
            {featuresData.map((feature, idx) => (
              <Col xl={3} key={idx}>
                <Card className="border-0 p-2 card-h-100">
                  <CardBody className="pb-0">
                    <div className="avatar-xl mb-3">
                      <span className="avatar-title text-bg-secondary rounded-circle fs-22">
                        <Icon icon={feature.icon} />
                      </span>
                    </div>
                    <h4 className="fw-semibold mb-2">{feature.title}</h4>
                    <p className="text-muted mb-3">{feature.description}</p>
                  </CardBody>
                  <CardFooter className="border-0 pt-0">
                    <Link className="link-primary fw-semibold" to="">
                      Know more <Icon icon="arrow-right" className="ms-1 align-middle" />
                    </Link>
                  </CardFooter>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
        <div className="text-center my-4">
          <button className="btn btn-success" id="thankyou-tour" data-tg-order={7} data-tg-tour="<p>Thanks for exploring! Read the documentation to get the most out of this template.</p>" data-tg-title="Documentation">
            <Icon icon="file" className="me-1" />
            Documentation
          </button>
        </div>
      </CardBody>

      <Tour
        defaultCurrent={1}
        open={openTour}
        onClose={() => setOpenTour(false)}
        animated
        mask
        steps={[
          {
            title: 'Getting Started',
            description: 'Click here to get started and explore our framework-rich admin panel. 🚀',
            target: () => step1Ref.current!,
            placement: 'left',
          },
          {
            title: 'Buy Now',
            description: 'Ready to supercharge your project ? Click here to purchase the template!',
            target: () => step2Ref.current!,
            placement: 'left',
          },
          {
            title: 'Core Features',
            description: 'Learn more about the versatile services and modules we provide to enhance development',
            target: () => step3Ref.current!,
            placement: 'top',
          },
          {
            title: 'Documentation',
            description: 'Thanks for exploring! Read the documentation to get the most out of this template.',
            target: () => step4Ref.current!,
            placement: 'top',
          },
        ]}
      />
    </>
  )
}

export default TourPage
