import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import NestedListWithHandle from './components/NestedListWithHandle'
import NestedSortableList from './components/NestedSortableList'
import SortableWithIconAndLabels from './components/SortableWithIconAndLabels'
import SortableWithIcons from './components/SortableWithIcons'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Sortable List" subtitle="Plugins" />

      <Row>
        <Col lg={6}>
          <NestedSortableList />
        </Col>

        <Col lg={6}>
          <NestedListWithHandle />
        </Col>
      </Row>

      <Row>
        <Col lg={6}>
          <SortableWithIcons />
        </Col>
        <Col lg={6}>
          <SortableWithIconAndLabels />
        </Col>
      </Row>
    </>
  )
}

export default Page
