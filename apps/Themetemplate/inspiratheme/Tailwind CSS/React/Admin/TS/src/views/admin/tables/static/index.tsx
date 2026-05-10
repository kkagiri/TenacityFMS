import PageBreadcrumb from '@/components/PageBreadcrumb'
import ActiveTable from './components/ActiveTable'
import BasicTable from './components/BasicTable'
import BorderLessTable from './components/BorderLessTable'
import CustomTable from './components/CustomTable'
import HoverableRows from './components/HoverableRows'
import NestingTable from './components/NestingTable'
import SmallTables from './components/SmallTables'
import StripedColumnTable from './components/StripedColumnTable'
import StripedRowsTable from './components/StripedRowsTable'
import TableCaption from './components/TableCaption'
import TableGroupDividers from './components/TableGroupDividers'
import TableHead from './components/TableHead'
import VariantsTable from './components/VariantsTable'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Static Tables" subtitle="DataTables" />
      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <BasicTable />

          <CustomTable />

          <VariantsTable />

          <StripedRowsTable />

          <StripedColumnTable />

          <HoverableRows />

          <ActiveTable />

          <BorderLessTable />

          <SmallTables />

          <TableGroupDividers />

          <NestingTable />

          <TableHead />

          <TableCaption />
        </div>
      </div>
    </>
  )
}

export default Page
