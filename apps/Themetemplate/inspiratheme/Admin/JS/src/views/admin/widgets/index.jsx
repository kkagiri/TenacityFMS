import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Card, CardBody, Col, Row } from 'react-bootstrap'
import ChatCard from './components/ChatCard'
import CommentCard from './components/CommentCard'
import { widget1Data, widget4Data, widget5Data, widget6Data, widget7Data } from './components/data'
import FileManageCard from './components/FileMangeCard'
import ProfileCard from './components/ProfileCard'
import SalesPerformanceOverview from './components/SalesPerformanceOverview'
import TodaySchedule from './components/TodaySchedule'
import TopCountries from './components/TopCountries'
import TrafficSources from './components/TrafficSources'
import Widget1 from './components/Widget1'
import Widget2 from './components/Widget2'
import Widget3 from './components/Widget3'
import Widget4 from './components/Widget4'
import Widget5 from './components/Widget5'
import Widget6 from './components/Widget6'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Widgets" subtitle="Pages" />

      <Row>
        <Col xs={12}>
          <Card>
            <CardBody>
              <Row className="row-cols-xxl-4 row-cols-md-2 row-cols-1 g-3 align-items-center">
                {widget1Data.map((widget, idx) => (
                  <Col key={idx}>
                    <Widget1 widget={widget} />
                  </Col>
                ))}
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col xl={4}>
          <SalesPerformanceOverview />
        </Col>
        <Col xxl={4} lg={6}>
          <TrafficSources />
        </Col>
        <Col xxl={4} lg={6}>
          <TopCountries />
        </Col>
      </Row>

      <Row>
        <Col xl={4}>
          <ProfileCard />

          <CommentCard />
        </Col>

        <Col xl={4}>
          <ChatCard />

          <Row>
            <Col xl={6}>
              <Card className="text-bg-purple">
                <CardBody>
                  <div className="d-flex align-items-center mb-3 gap-2">
                    <div className="avatar-md">
                      <span className="avatar-title bg-light bg-opacity-20 text-white rounded-circle fs-xl">
                        <Icon icon="phone" />
                      </span>
                    </div>
                    <p className="mb-0 fw-semibold">PHONE</p>
                  </div>
                  <h5 className="mb-1 text-white text-opacity-75">+1 800 123 4567</h5>
                  <h5 className="mb-0 text-white text-opacity-75">+1 800 765 4321</h5>
                </CardBody>
              </Card>
            </Col>
            <Col xl={6}>
              <Card className="text-bg-success">
                <CardBody>
                  <div className="d-flex align-items-center mb-3 gap-2">
                    <div className="avatar-md">
                      <span className="avatar-title bg-light bg-opacity-20 text-white rounded-circle fs-xl">
                        <Icon icon="mail" />
                      </span>
                    </div>
                    <p className="mb-0 fw-semibold">EMAIL</p>
                  </div>
                  <h5 className="mb-1 text-white text-opacity-75">support@example.com</h5>
                  <h5 className="mb-0 text-white text-opacity-75">sales@example.com</h5>
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Col>

        <Col xl={4}>
          <FileManageCard />

          <TodaySchedule />
        </Col>
      </Row>

      <Row className="row-cols-xxl-5 row-cols-md-3 row-cols-1 align-items-center">
        <Widget2 />
      </Row>

      <Row className="row-cols-xxl-4 row-cols-md-2 row-cols-1">
        {widget4Data.map((item, idx) => (
          <Col key={idx}>
            <Widget3 item={item} />
          </Col>
        ))}
      </Row>

      <Row className="row-cols-xxl-4 row-cols-md-2 row-cols-1">
        {widget5Data.map((item, idx) => (
          <Col key={idx}>
            <Widget4 item={item} />
          </Col>
        ))}
      </Row>

      <Row className="row-cols-xxl-4 row-cols-md-2 row-cols-1">
        {widget6Data.map((item, idx) => (
          <Col key={idx}>
            <Widget5 item={item} />
          </Col>
        ))}
      </Row>
      <Row className="row-cols-xxl-6 row-cols-md-3 row-cols-2">
        {widget7Data.map((item, idx) => (
          <Col key={idx}>
            <Widget6 item={item} />
          </Col>
        ))}
      </Row>
    </>
  )
}
export default Page
