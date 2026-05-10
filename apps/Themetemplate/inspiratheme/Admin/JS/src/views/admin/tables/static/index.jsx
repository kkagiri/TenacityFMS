import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Col, Container, Row } from 'react-bootstrap'
import ActiveTables from './components/ActiveTables'
import BasicTable from './components/BasicTable'
import BorderedTables from './components/BorderedTables'
import BorderLessTable from './components/BorderLessTable'
import CustomTable from './components/CustomTable'
import HoverableRowTable from './components/HoverableRowTable'
import NestingTable from './components/NestingTable'
import SmallTables from './components/SmallTables'
import StripedColumnTable from './components/StripedColumnTable'
import StripedRowsPage from './components/StripedRowsPage'
import TableCaption from './components/TableCaption'
import TableGroupDividers from './components/TableGroupDividers'
import TableHead from './components/TableHead'
import VariantsTable from './components/VariantsTable'
const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Static Tables" subtitle="DataTables" />
      <Container>
        <Row className="justify-content-center">
          <Col xs={12}>
            <BasicTable />

            <CustomTable />

            <VariantsTable />

            <StripedRowsPage />

            <StripedColumnTable />

            <HoverableRowTable />

            <ActiveTables />

            <BorderedTables />

            <BorderLessTable />

            <SmallTables />

            <TableGroupDividers />

            <NestingTable />

            <TableHead />

            <TableCaption />
          </Col>
        </Row>
      </Container>
    </>
  )
}
export default Page
