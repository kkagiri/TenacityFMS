import PageBreadcrumb from '@/components/PageBreadcrumb'
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
      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <TableWithSearch />
          <TableWithCheckboxSelect />
          <TableWithDeleteButtons />
          <TableWithPagination />
          <TableWithPaginationInfo />
          <TableWithFilters />
          <TableWithRangeFilters />
          <TableWithSort />
        </div>
      </div>
    </>
  )
}

export default Page
