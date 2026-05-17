import Icon from '@/components/wrappers/Icon'
import { Button, Card, CardBody, Col, FormControl } from 'react-bootstrap'
import { Link } from 'react-router'
const sidebarData = {
  categories: ['Development Talk', 'AI & Ethics', 'Product Design', 'Career Growth', 'Open Source'],
  popularQuestions: ['Unlocking the Secrets of Modern UI Design', 'How to Build a Portfolio with Tailwind CSS', 'Boost Productivity with These Web Dev Tools', 'The Future of Frontend: Trends to Watch in 2025', 'Essential Tips for Clean and Maintainable Code'],
  tags: ['Web Design', 'Frontend', 'Tailwind CSS', 'JavaScript', 'React', 'Startup', 'DevTools', 'Open Source', 'Performance', 'UX/UI', 'SEO'],
}
const Sidebar = () => {
  return (
    <Col lg={3}>
      <Button type="button" className="btn mb-3 btn-lg btn-primary w-100">
        Ask Question
      </Button>
      <Card>
        <CardBody className="border-bottom border-dashed">
          <h5 className="mb-3 text-uppercase fw-bold">Search</h5>
          <div className="app-search">
            <FormControl type="text" className="bg-light-subtle" placeholder="Search issues..." />
            <Icon icon="search" className="app-search-icon text-muted" />
          </div>
        </CardBody>
        <CardBody className="border-bottom border-dashed">
          <h5 className="mb-3 text-uppercase fw-bold">Category:</h5>
          <ul className="list-group list-group-flush fs-sm">
            {sidebarData.categories.map((category) => (
              <li key={category} className="list-group-item ps-0">
                <Link to="" className="link-reset fw-medium">
                  {category}
                </Link>
              </li>
            ))}
          </ul>
        </CardBody>
        <CardBody className="border-bottom border-dashed">
          <h5 className="mb-3 text-uppercase fw-bold">Popular Questions:</h5>
          <ul className="list-group list-group-flush fs-sm">
            {sidebarData.popularQuestions.map((question) => (
              <li key={question} className="list-group-item ps-0">
                <Link to="" className="link-reset fw-medium">
                  {question}
                </Link>
              </li>
            ))}
          </ul>
        </CardBody>
        <CardBody>
          <h5 className="mb-3 text-uppercase fw-bold">Popular Tags:</h5>
          <div className="d-flex flex-wrap gap-1">
            {sidebarData.tags.map((tag) => (
              <Link key={tag} to="" className="btn btn-light btn-sm">
                {tag}
              </Link>
            ))}
          </div>
        </CardBody>
      </Card>
    </Col>
  )
}
export default Sidebar
