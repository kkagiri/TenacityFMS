import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Row } from 'react-bootstrap'
import TableWithCheckboxSelect from './components/TableWithCheckboxSelect'
import TableWithDeleteButtons from './components/TableWithDeleteButtons'
import TableWithFilters from './components/TableWithFilters'
import TableWithPagination from './components/TableWithPagination'
import TableWithPaginationInfo from './components/TableWithPaginationInfo'
import TableWithRangeFilters from './components/TableWithRangeFilters'
import TableWithSearch from './components/TableWithSearch'
import TableWithSort from './components/TableWithSort'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Custom" subtitle="Tables" />

      <Row>
        <Col xs={12}>
          <TableWithSearch />
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <TableWithCheckboxSelect />
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <TableWithDeleteButtons />
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <TableWithPagination />
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <TableWithPaginationInfo />
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <TableWithFilters />
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <TableWithRangeFilters />
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <TableWithSort />
        </Col>
      </Row>
    </>
  )
}
export default Page
