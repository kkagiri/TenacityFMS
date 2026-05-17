import ComponentCard from '@/components/cards/ComponentCard'
import DataTable from '@/components/table/DataTable'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { createColumnHelper, getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { useState } from 'react'
import { CardFooter } from 'react-bootstrap'
import { campaignsData } from './data'
const columnHelper = createColumnHelper()
const TopPerformance = () => {
  const [data] = useState(campaignsData)
  const [sorting, setSorting] = useState([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  })
  const columns = [
    columnHelper.accessor('name', {
      header: 'Campaign',
      cell: ({ row }) => (
        <>
          <Icon icon={row.original.icon} {...row.original.iconProps} />
          {row.original.name}
        </>
      ),
    }),
    columnHelper.accessor('visitors', {
      header: 'Visitors',
      cell: ({ getValue }) => getValue().toLocaleString(),
    }),
    columnHelper.accessor('newUsers', {
      header: 'New Users',
    }),
    columnHelper.accessor('sessions', {
      header: 'Sessions',
      cell: ({ getValue }) => getValue().toLocaleString(),
    }),
    columnHelper.accessor('bounceRate', {
      header: 'Bounce Rate',
      cell: ({ row }) => <span className={row.original.isPositive ? 'text-success' : ''}>{row.original.bounceRate}%</span>,
    }),
    columnHelper.accessor('pagesPerVisit', {
      header: 'Pages / Visit',
    }),
    columnHelper.accessor('avgDuration', {
      header: 'Avg. Duration',
    }),
    columnHelper.accessor('leads', {
      header: 'Leads',
    }),
    columnHelper.accessor('revenue', {
      header: 'Revenue',
      cell: ({ row }) => <span className={row.original.isPositive ? 'text-success' : ''}>{row.original.revenue}</span>,
    }),
    columnHelper.accessor('conversion', {
      header: 'Conversion',
      cell: ({ getValue }) => `${getValue()}%`,
    }),
  ]
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const totalItems = table.getFilteredRowModel().rows.length
  const start = pageIndex * pageSize + 1
  const end = Math.min(start + pageSize - 1, totalItems)
  return (
    <>
      <ComponentCard title="Top Campaign Performance" bodyClassName="p-0" isCloseable isCollapsible isRefreshable>
        <DataTable table={table} emptyMessage="No campaigns found" />
        <CardFooter className="border-0">
          <TablePagination
            totalItems={totalItems}
            start={start}
            end={end}
            itemsName="entries"
            showInfo
            previousPage={table.previousPage}
            canPreviousPage={table.getCanPreviousPage()}
            pageCount={table.getPageCount()}
            pageIndex={pageIndex}
            setPageIndex={table.setPageIndex}
            nextPage={table.nextPage}
            canNextPage={table.getCanNextPage()}
          />
        </CardFooter>
      </ComponentCard>
    </>
  )
}
export default TopPerformance
