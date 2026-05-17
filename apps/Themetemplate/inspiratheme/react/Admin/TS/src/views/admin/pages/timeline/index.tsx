import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { basicTimelineData, borderTimelineData, iconTimelineData, userTimelineData } from './components/data'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Timeline" subtitle="Pages" />

      <Row>
        <Col xxl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Basic Timeline</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="timeline">
                {basicTimelineData.map((item, idx) => (
                  <div key={idx} className="timeline-item d-flex align-items-stretch">
                    {item.time && <div className="timeline-time pe-3 text-muted">{item.time}</div>}
                    {item.className && <div className={`timeline-dot ${item.className}`}></div>}
                    <div className={`timeline-content ps-3 ${idx != basicTimelineData.length - 1 ? 'pb-4' : ''}`}>
                      <h5 className="mb-1">{item.title}</h5>
                      <p className="mb-1 text-muted">{item.description}</p>
                      <span className="text-primary fw-semibold">By {item.author}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xxl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Timeline with Icons</CardTitle>
            </CardHeader>

            <CardBody>
              <div className="timeline timeline-icon-based">
                {iconTimelineData.map((item, idx) => (
                  <div key={idx} className="timeline-item d-flex align-items-stretch">
                    {item.time && <div className="timeline-time pe-3 text-muted">{item.time}</div>}
                    {item.className && item.icon && (
                      <div className={`timeline-dot ${item.className}`}>
                        <Icon icon={item.icon} className={clsx('fs-xl', item.iconClass)} />
                      </div>
                    )}
                    <div className={`timeline-content ps-3 ${idx != iconTimelineData.length - 1 ? 'pb-4' : ''}`}>
                      <h5 className="mb-1">{item.title}</h5>
                      <p className="mb-1 text-muted">{item.description}</p>
                      <span className="text-primary fw-semibold">By {item.author}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xxl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Timeline with Border</CardTitle>
            </CardHeader>

            <CardBody>
              <div className="timeline timeline-icon-bordered">
                {userTimelineData.map((item, idx) => (
                  <div key={idx} className="timeline-item d-flex align-items-stretch">
                    {item.time && <div className="timeline-time pe-3 text-muted">{item.time}</div>}
                    {item.icon && (
                      <div className="timeline-dot">
                        <Icon icon={item.icon} className="fs-xl text-muted" />
                      </div>
                    )}
                    <div className={`timeline-content ps-3 ${idx != userTimelineData.length - 1 ? 'pb-4' : ''}`}>
                      <h5 className="mb-1">{item.title}</h5>
                      <p className="mb-1 text-muted">{item.description}</p>
                      <span className="text-primary fw-semibold">By {item.author}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col xxl={6}>
          <Card>
            <CardHeader>
              <CardTitle as="h4">Timeline with Users</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="timeline timeline-users">
                {borderTimelineData.map((item, idx) => (
                  <div key={idx} className="timeline-item d-flex align-items-stretch">
                    {item.image && (
                      <div className="timeline-dot">
                        <img src={item.image} width={30} height={30} alt="avatar-1" className="img-fluid rounded-circle" />
                      </div>
                    )}
                    <div className={`timeline-content ps-3 ${idx != borderTimelineData.length - 1 ? 'pb-4' : ''}`}>
                      <h5 className="mb-1">{item.title}</h5>
                      <p className="mb-1 text-muted">{item.description}</p>
                      <span className="text-primary fw-semibold">By {item.author}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default Page
