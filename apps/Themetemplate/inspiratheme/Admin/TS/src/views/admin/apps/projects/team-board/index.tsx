import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { Col, Row } from 'react-bootstrap'
import TeamCard from './components/TeamCard'
import { teamData } from './components/data'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Team Board" subtitle="Apps" />
      <Row className="justify-content-center">
        <Col xxl={10}>
          <div className="d-flex align-items-sm-center flex-sm-row flex-column mb-3">
            <div className="flex-grow-1">
              <h4 className="fs-xl mb-1">Manage Teams</h4>
              <p className="text-muted mb-0">Assign roles to streamline teamwork and secure access.</p>
            </div>

            <div className="text-end">
              <Link to="" className="btn btn-success">
                <Icon icon="plus" className="me-1"></Icon>
                Add New Team
              </Link>
            </div>
          </div>

          <Row>
            {teamData.map((team, idx) => (
              <Col md={6} lg={4} key={idx}>
                <TeamCard team={team} idx={idx} />
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </>
  )
}

export default Page
