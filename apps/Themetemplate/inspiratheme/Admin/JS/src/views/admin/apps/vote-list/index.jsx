import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { toPascalCase } from '@/utils/helpers'
import clsx from 'clsx'
import { Badge, Button, Card, CardBody, CardHeader, Col, FormSelect, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import VoteConfirmation from './components/VoteConfirmation'
import { voteListData } from './components/data'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Vote List" subtitle="Apps" />

      <Row className="justify-content-center">
        <Col xxl={10}>
          <Card>
            <CardHeader className="border-light justify-content-between">
              <div className="app-search">
                <input type="text" className="form-control" placeholder="Search topics..." />
                <Icon icon="search" className="app-search-icon text-muted" />
              </div>

              <div className="d-flex align-items-center gap-2">
                <span className="me-2 fw-semibold">Filter By:</span>

                <div className="app-search">
                  <FormSelect className="form-control my-1 my-md-0">
                    <option selected>Sort By</option>
                    <option value="North America">Latest</option>
                    <option value="Europe">Popular</option>
                    <option value="Asia">Low Votes</option>
                    <option value="Africa">High Votes</option>
                  </FormSelect>
                  <Icon icon="filter-2" className="app-search-icon text-muted" />
                </div>

                <div className="app-search">
                  <FormSelect className="form-control my-1 my-md-0">
                    <option>Vote Status</option>
                    <option value="Voted">Voted</option>
                    <option value="Not Voted">Not Voted</option>
                    <option value="Pending">Pending</option>
                    <option value="Disqualified">Disqualified</option>
                  </FormSelect>
                  <Icon icon="circle-check" className="app-search-icon text-muted" />
                </div>

                <Button variant="success" type="submit">
                  Add New Topics
                </Button>
              </div>
            </CardHeader>

            <CardBody className="p-0">
              {voteListData.map((item, idx) => (
                <div key={idx} className={clsx('px-4 py-3', idx !== voteListData.length - 1 && 'border-bottom border-dashed')}>
                  <VoteListItem item={item} />
                </div>
              ))}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </>
  )
}
export default Page
const VoteListItem = ({ item }) => {
  return (
    <div className="d-flex gap-4 align-items-center">
      <div>
        <div className="vstack gap-1 text-center">
          <div>
            <button className={`btn btn-link p-0 ${item.userVote === 'up' ? 'text-danger' : 'btn-link'}`}>
              <Icon icon="chevron-up" className="fs-xxl" />
            </button>
          </div>
          <h5 className="fw-bold m-0 fs-lg">{item.votes}</h5>
          <div>
            <button className={`btn p-0 ${item.userVote === 'down' ? 'text-danger' : 'btn-link'}`}>
              <Icon icon="chevron-down" className="fs-xxl" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-grow-1">
        <h4 className="fs-md mb-1">
          <Link to="" className="link-reset">
            {item.title}
          </Link>
        </h4>

        <p className="text-muted mb-2">{item.description}</p>

        <p className="d-flex flex-wrap gap-3 text-muted mb-1 align-items-center fs-base">
          <span className="d-flex align-items-center gap-1">
            <img src={item.user.image} height={24} width={24} alt="" className="img-fluid avatar-xs rounded-circle" />
            <Link to="" className="link-reset fw-semibold">
              {item.user.name}
            </Link>
          </span>
          <span className="d-flex align-items-center gap-1">
            <Icon icon="calendar" />
            <span>Posted on: {item.postedOn}</span>
          </span>
          <span className="d-flex align-items-center gap-1">
            <Icon icon="tag" /> <span className="badge bg-light text-primary">{item.category}</span>
          </span>
          <span className="d-flex align-items-center gap-1">
            <Icon icon="messages" />
            <Link to="" className="link-reset">
              Comments: {item.comments}
            </Link>
          </span>
          <span className="d-flex align-items-center gap-1">
            <Icon icon="clock" />
            <span>Ends in: {item.endsIn}</span>
          </span>
          <span className="d-flex align-items-center gap-1">
            <Icon icon="users" />
            <span>Votes: {item.votes}</span>
          </span>
          <span className="d-flex align-items-center gap-1">
            <Icon icon="lock" />
            <Badge bg={item.status === 'ending-soon' ? 'info' : item.status === 'closed' ? 'warning' : 'success'}>{toPascalCase(item.status)}</Badge>
          </span>
        </p>
      </div>

      {item.userVote && <VoteConfirmation />}
    </div>
  )
}
