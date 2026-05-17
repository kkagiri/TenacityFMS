import ComponentCard from '@/components/cards/ComponentCard'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { createColumnHelper, flexRender, getCoreRowModel, getPaginationRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table'
import { useState } from 'react'
import { CampaignDataType, campaignsData } from './data'

const columnHelper = createColumnHelper<CampaignDataType>()

const TopPerformance = () => {
  const [data] = useState<CampaignDataType[]>(campaignsData)
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  })

  const columns = [
    columnHelper.accessor('name', {
      header: 'Campaign',
      cell: ({ row }) => (
        <span className="flex items-center gap-2">
          <Icon icon={row.original.icon} {...row.original.iconProps} />
          {row.original.name}
        </span>
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
      cell: ({ row }) => <span className={row.original.isPositive ? 'text-green-500' : ''}>{row.original.bounceRate}%</span>,
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
      cell: ({ row }) => <span className={row.original.isPositive ? 'text-green-500' : ''}>{row.original.revenue}</span>,
    }),

    columnHelper.accessor('conversion', {
      header: 'Conversion',
      cell: ({ getValue }) => `${getValue()}%`,
    }),
  ]

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
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
    <ComponentCard title="Top Campaign Performance" bodyClassName="p-0" isCloseable isCollapsible isRefreshable>
      <div className="p-0">
        <div className="table-wrapper whitespace-nowrap">
          <table className="table table-hover mb-0">
            <thead className="bg-light/25 thead-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="uppercase text-2xs">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="text-default-400" onClick={header.column.getToggleSortingHandler()}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="text-sm">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card-footer">
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
      </div>
    </ComponentCard>
  )
}

export default TopPerformance
