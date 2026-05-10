import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import { Card, CardBody, Col, Row } from 'react-bootstrap'
import { sitemapData, type SitemapItem } from './components/data'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Sitemap" subtitle="Pages" />
      <Row>
        {sitemapData.map((section, idx) => (
          <Col md={4} key={idx} className="mb-4">
            <Card>
              <CardBody>
                <h5 className="fw-bold text-uppercase mb-3">{section.title}</h5>
                {renderSitemapItems(section.items)}
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  )
}

export default Page

const renderSitemapItems = (items: SitemapItem[]) => {
  return (
    <ul className="list-unstyled sitemap-list">
      {items.map((item, idx) => (
        <li key={idx}>
          <Link to={item.href || ''} className={`link-reset ${item.itemClassName ? `${item.itemClassName}` : ''}`}>
            {item.icon && <Icon icon={item.icon} className="me-1" />}
            {item.title}
          </Link>
          {item.children && renderSitemapItems(item.children)}
        </li>
      ))}
    </ul>
  )
}
