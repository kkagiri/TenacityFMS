import { Col, Row } from 'react-bootstrap'
import Discussions from './components/Discussions'
import ProjectPerformance from './components/ProjectPerformance'
import ProjectUpdates from './components/ProjectUpdates'
import QuarterlyReports from './components/QuarterlyReports'
import StatCards from './components/StatCards'
import WelcomeRevenueProgress from './components/WelcomeRevenueProgress'
const Page = () => {
  return (
    <>
      <Row className="mt-3">
        <Col xs={12}>
          <WelcomeRevenueProgress />
        </Col>
      </Row>

      <StatCards />

      <Row>
        <Col xxl={4}>
          <QuarterlyReports />
          <ProjectPerformance />
        </Col>

        <Col xxl={4} xl={6}>
          <ProjectUpdates />
        </Col>

        <Col xxl={4} xl={6}>
          <Discussions />
        </Col>
      </Row>
    </>
  )
}
export default Page
