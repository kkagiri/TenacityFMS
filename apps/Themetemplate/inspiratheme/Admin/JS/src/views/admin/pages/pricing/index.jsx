import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { CardBody, CardFooter, Col, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import { pricingPlanData } from './components/data'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Pricing" subtitle="Pages" />

      <Row className="justify-content-center">
        <Col xxl={10}>
          <div className="text-center">
            <h3 className="fw-bold mt-4">Find the Perfect Fit</h3>
            <div className="text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" height={24} viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.874 13C15.4299 14.7252 13.8638 16 12 16C10.1362 16 8.57006 14.7252 8.12602 13H3V11H8.12602C8.57006 9.27477 10.1362 8 12 8C13.8638 8 15.4299 9.27477 15.874 11H21V13H15.874ZM12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" />
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" height={24} viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.874 13C15.4299 14.7252 13.8638 16 12 16C10.1362 16 8.57006 14.7252 8.12602 13H3V11H8.12602C8.57006 9.27477 10.1362 8 12 8C13.8638 8 15.4299 9.27477 15.874 11H21V13H15.874ZM12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" />
              </svg>
            </div>
            <p className="fst-italic fs-md">Not sure which plan suits you best? Check out our Pricing Guide for detailed insights.</p>
          </div>
          <div className="px-xxl-4 my-5">
            <div className="row">
              {pricingPlanData.map((plan, index) => (
                <div key={index} className="col-lg-6 col-xl-4">
                  <div className={`card h-100 rounded-4 ${plan.isPopular ? 'border-success border-2' : ''}`}>
                    {plan.isPopular && <span className="position-absolute fs-xs top-0 start-50 translate-middle-x badge bg-primary-subtle text-primary rounded-pill px-3 py-2 mt-3">Popular Choice</span>}
                    <CardBody className="px-lg-4 p-5 pb-2 text-center">
                      <h3 className="fw-bold mb-1">{plan.name}</h3>
                      <p className="text-muted mb-0">{plan.subtitle}</p>
                      <div className="my-4">
                        <h1 className="display-6 fw-bold mb-0">{plan.price}</h1>
                        <small className="d-block text-muted fs-base fw-medium">{plan.planInfo}</small>
                        <small className="d-block text-muted fw-medium">{plan.planInfo2}</small>
                      </div>
                      <ul className="list-unstyled text-start fs-sm fw-medium mb-0">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="mb-2">
                            {feature.included ? <Icon icon="check" className="me-2 fs-5 text-success" /> : <Icon icon="x" className="me-2 fs-5 text-danger" />}
                            &nbsp;{feature.title}
                          </li>
                        ))}
                      </ul>
                    </CardBody>
                    <CardFooter className="bg-transparent border-0 px-5 pb-4">
                      <Link to={plan.href} className={clsx('btn w-100 py-2 fw-semibold rounded-pill', plan.buttonClassName)}>
                        {plan.buttonText}
                      </Link>
                    </CardFooter>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Col>
      </Row>
    </>
  )
}
export default Page
