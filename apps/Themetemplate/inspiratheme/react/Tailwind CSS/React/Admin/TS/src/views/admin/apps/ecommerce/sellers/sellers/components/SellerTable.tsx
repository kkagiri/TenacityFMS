import Rating from '@/components/Rating'
import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import ApexChart from '@/components/wrappers/ApexChart'
import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { ColumnFiltersState, createColumnHelper, FilterFn, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, Row as TableRow, Table as TableType, useReactTable } from '@tanstack/react-table'
import { Link } from 'react-router'
import { useState } from 'react'
import { sellerData, SellerType } from './data'

const orderRangeFilterFn: FilterFn<any> = (row, columnId, value) => {
  const order = row.getValue<number>(columnId)
  if (!value) return true
  if (value === '0') return false
  if (value === '20000+') return order > 20000
  const [min, max] = value.split('-').map(Number)
  return order >= min && order <= max
}

const ratingFilterFn: FilterFn<any> = (row, columnId, value) => {
  const rating = row.getValue<number>(columnId)
  if (!value) return true
  if (value === '0') return false
  if (value === '4-5') return rating >= 4
  if (value === '1-3') return rating >= 0 && rating < 4
  const [min, max] = value.split('-').map(Number)
  return rating >= min && rating <= max
}

const columnHelper = createColumnHelper<SellerType>()

const SellerTable = () => {
  const columns = [
    {
      id: 'select',
      header: ({ table }: { table: TableType<SellerType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }: { row: TableRow<SellerType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
    columnHelper.accessor('seller', {
      header: 'Seller',
      cell: ({ row }) => (
        <div className="flex items-center gap-base">
          <img src={row.original.seller.image} alt="Product" className="size-9 rounded-full" />

          <div>
            <h5 className="mb-1.25">
              <Link to="" className="hover:text-primary font-medium">
                {row.original.seller.name}
              </Link>
            </h5>
            <p className="text-default-400 text-2xs">Since {row.original.seller.since}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('products', { header: 'Products' }),
    columnHelper.accessor('orders', { header: 'Orders', filterFn: orderRangeFilterFn }),

    columnHelper.accessor('rating', {
      header: 'Rating',
      filterFn: ratingFilterFn,
      cell: ({ row }) => (
        <>
          <Rating rating={row.original.rating} />
          <Link to="/apps/ecommerce/reviews" className="hover:text-primary ms-1.25 font-semibold">
            ({row.original.rating})
          </Link>
        </>
      ),
    }),
    columnHelper.accessor('country', {
      header: 'Location',
      cell: ({ row }) => (
        <div className="badge p-1.25 text-sm bg-light">
          <img src={row.original.country.flag} alt="" className="me-1.25 size-3 rounded-full" />
          {row.original.country.code}
        </div>
      ),
    }),
    columnHelper.accessor('balance', {
      header: 'Balance',
    }),
    columnHelper.accessor('rank', {
      header: 'Rank',
    }),
    columnHelper.accessor('reportChartOptions', {
      id: 'report',
      header: () => <div className="mx-auto">Report</div>,
      cell: ({ row }) => <ApexChart className="flex justify-center" getOptions={row.original.reportChartOptions} series={row.original.reportChartOptions().series} type={row.original.reportChartOptions().chart?.type} width={100} height={30} />,
    }),
  ]

  const [data, setData] = useState<SellerType[]>(() => [...sellerData])
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 8 })

  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({})

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, columnFilters, pagination, rowSelection: selectedRowIds },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onRowSelectionChange: setSelectedRowIds,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    enableColumnFilters: true,
    enableRowSelection: true,
    filterFns: {
      orderRange: orderRangeFilterFn,
      ratingFilter: ratingFilterFn,
    },
  })

  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const totalItems = table.getFilteredRowModel().rows.length
  const start = pageIndex * pageSize + 1
  const end = Math.min(start + pageSize - 1, totalItems)

  const handleDelete = () => {
    const selectedIds = new Set(Object.keys(selectedRowIds))
    setData((old) => old.filter((_, idx) => !selectedIds.has(idx.toString())))
    setSelectedRowIds({})
    setPagination({ ...pagination, pageIndex: 0 })
    window.HSOverlay?.close('#confirm-delete-modal')
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex gap-2.5">
          <div className="input-icon-group">
            <Icon icon="search" className="input-icon" />
            <input value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} type="search" placeholder="Search seller..." className="form-input" />
          </div>
          <button className={cn('btn bg-danger text-white hover:bg-danger-hover', !(Object.keys(selectedRowIds).length > 0) && 'hidden')} type="button" data-hs-overlay="#confirm-delete-modal">
            Delete
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 md:flex-nowrap">
          <span className="me-2.5 font-semibold text-nowrap">Filter By:</span>

          <div className="input-icon-group">
            <Icon icon="shopping-cart" className="input-icon" />
            <select className="form-select" value={(table.getColumn('orders')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('orders')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
              <option value="All">Orders</option>
              <option value="20000+">Top Orders</option>
              <option value="0-20000">Low Orders</option>
              <option value="0">No Orders</option>
            </select>
          </div>

          <div className="input-icon-group">
            <Icon icon="currency-dollar" className="input-icon" />
            <select className="form-select">
              <option value="All">Revenue</option>
              <option value="100k+">Top Revenue</option>
              <option value="50k-100k">Low Revenue</option>
              <option value="0">No Revenue</option>
            </select>
          </div>

          <div className="input-icon-group">
            <Icon icon="star" className="input-icon" />
            <select className="form-select" value={(table.getColumn('rating')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('rating')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
              <option value="All">Ratings</option>
              <option value="4-5">Top Rated</option>
              <option value="1-3">Low Rated</option>
              <option value="0">No Ratings</option>
            </select>
          </div>

          <div>
            <select value={table.getState().pagination.pageSize} className="form-select" onChange={(e) => table.setPageSize(Number(e.target.value))}>
              {[5, 8, 10, 15, 20].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <DataTable<SellerType> table={table} emptyMessage="No records found" />

      {table.getRowModel().rows.length > 0 && (
        <div className="card-footer">
          <TablePagination
            totalItems={totalItems}
            start={start}
            end={end}
            itemsName="sellers"
            showInfo
            previousPage={table.previousPage}
            canPreviousPage={table.getCanPreviousPage()}
            pageCount={table.getPageCount()}
            pageIndex={table.getState().pagination.pageIndex}
            setPageIndex={table.setPageIndex}
            nextPage={table.nextPage}
            canNextPage={table.getCanNextPage()}
          />
        </div>
      )}

      <DeleteConfirmationModal onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="row" />
    </div>
  )
}

export default SellerTable
