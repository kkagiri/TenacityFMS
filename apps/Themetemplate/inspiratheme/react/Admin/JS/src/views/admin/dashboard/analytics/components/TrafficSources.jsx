import ComponentCard from '@/components/cards/ComponentCard'
import Icon from '@/components/wrappers/Icon'
import { useEffect, useRef, useState } from 'react'
import { Col, ProgressBar, Row, Table } from 'react-bootstrap'
import { Link } from 'react-router'
import { trafficTableData } from './data'
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
const TrafficSources = () => {
  const [liveVisitors, setLiveVisitors] = useState(() => getRandomNumber(500, 800))
  const intervalRef = useRef(null)
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setLiveVisitors((prev) => {
        const change = getRandomNumber(-20, 20)
        return Math.max(100, prev + change)
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])
  return (
    <>
      <ComponentCard title="Traffic Sources" isCloseable isCollapsible isRefreshable>
        <Row className="mb-2">
          <Col lg>
            <h3 className="mb-2 fw-bold" id="live-visitors">
              {liveVisitors}
            </h3>
            <p className="mb-2 fw-semibold text-muted">Right Now</p>
          </Col>
          <Col lg="auto" className="align-self-center">
            <ul className="list-unstyled mb-0 lh-lg">
              <li>
                <Icon icon="caret-right-filled" className="fs-lg align-middle text-primary" />
                <span className="text-muted">Organic</span>
              </li>
              <li>
                <Icon icon="caret-right-filled" className="fs-lg align-middle text-success" />
                <span className="text-muted">Direct</span>
              </li>
              <li>
                <Icon icon="caret-right-filled" className="fs-lg align-middle" />
                <span className="text-muted">Campaign</span>
              </li>
            </ul>
          </Col>
        </Row>
        <ProgressBar
          style={{
            height: 20,
          }}
          className="mb-3"
        >
          <ProgressBar now={25} key={1} />
          <ProgressBar variant="success" now={50} key={2} />

          <ProgressBar variant="info" now={15} key={3} />
        </ProgressBar>

        <div className="table-responsive">
          <Table size="sm" className="table-sm table-custom table-nowrap table-hover table-centered mb-0">
            <thead className="bg-light align-middle bg-opacity-25 thead-sm">
              <tr className="text-uppercase fs-xxs">
                <th className="text-muted">URL</th>
                <th className="text-muted text-end">Views</th>
                <th className="text-muted text-end">Uniques</th>
              </tr>
            </thead>
            <tbody>
              {trafficTableData.map((item, idx) => (
                <tr key={idx}>
                  <td className="text-decoration-underline">{item.url}</td>
                  <td className="text-end">{item.views}</td>
                  <td className="text-end">{item.uniques}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        <div className="text-end mt-3">
          <Link to="" className="link-reset text-decoration-underline fw-semibold link-offset-3">
            View all Links <Icon icon="link" />
          </Link>
        </div>
      </ComponentCard>
    </>
  )
}
export default TrafficSources
