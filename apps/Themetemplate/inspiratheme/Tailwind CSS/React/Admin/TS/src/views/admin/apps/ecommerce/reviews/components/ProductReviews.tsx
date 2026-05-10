import ratingsImg from '@/assets/images/ratings.svg'
import Rating from '@/components/Rating'
import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import ApexChart from '@/components/wrappers/ApexChart'
import Icon from '@/components/wrappers/Icon'
import { cn, toPascalCase } from '@/utils/helpers'
import { ColumnFiltersState, createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, Row as TableRow, Table as TableType, useReactTable } from '@tanstack/react-table'
import { Link } from 'react-router'
import { useState } from 'react'
import { getReviewChartOptions, productReviewData, type ProductReviewType } from './data'

const ratings = [
  { stars: 5, progress: 85, value: 128 },
  { stars: 4, progress: 10, value: 37 },
  { stars: 3, progress: 3, value: 15 },
  { stars: 2, progress: 1, value: 7 },
  { stars: 1, progress: 1, value: 2 },
]

const columnHelper = createColumnHelper<ProductReviewType>()

const ProductReviews = () => {
  const columns = [
    {
      id: 'select',
      maxSize: 45,
      size: 45,
      header: ({ table }: { table: TableType<ProductReviewType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }: { row: TableRow<ProductReviewType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
    columnHelper.accessor('product', {
      header: 'Product',
      cell: ({ row }) => (
        <div className="flex items-center gap-base">
          <img src={row.original.product.image} alt="Product" className="size-11 rounded" />
          <h5>
            <Link data-sort="product" to="/apps/ecommerce/product-details" className="hover:text-primary">
              {row.original.product.name}
            </Link>
          </h5>
        </div>
      ),
    }),
    columnHelper.accessor('user', {
      header: 'Reviewer',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="size-8">
            <img src={row.original.user.image} alt={row.original.user.name} className="h-full w-full rounded-full object-cover" />
          </div>
          <div>
            <h5 className="text-sm leading-tight font-medium">{row.original.user.name}</h5>
            <p className="text-default-400 text-xs">{row.original.user.email}</p>
          </div>
        </div>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor('rating', {
      header: 'Review',
      cell: ({ row }) => (
        <>
          <Rating rating={row.original.rating} />
          <h5 className="text-default-800 mt-2.5 mb-2 text-sm font-medium">{row.original.message}</h5>
          <p className="text-default-400 w-xs text-sm italic">{row.original.description}</p>
        </>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor('date', {
      header: 'Date',
      cell: ({ row }) => (
        <span className="flex items-center gap-1">
          {row.original.date}
          <span className="text-default-400 block text-xs">{row.original.time}</span>
        </span>
      ),
    }),
    columnHelper.accessor('status', {
      cell: ({ row }) => <span className={cn('badge text-2xs font-semibold', row.original.status === 'published' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning')}>{toPascalCase(row.original.status)}</span>,
    }),
    {
      enableSorting: false,
      header: 'Actions',
      cell: ({ row }: { row: TableRow<ProductReviewType> }) => (
        <div className="flex justify-center gap-1.5">
          <button type="button" className="btn btn-icon btn-sm border border-default-300 text-default-800 hover:border-default-400">
            <Icon icon="eye" className="text-base" />
          </button>
          <button type="button" className="btn btn-icon btn-sm border border-default-300 text-default-800 hover:border-default-400">
            <Icon icon="edit" className="text-base" />
          </button>
          <button
            className="btn btn-icon btn-sm border border-default-300 text-default-800 hover:border-default-400"
            onClick={() => {
              'use no memo'
              setSelectedRowIds({ [row.id]: true })
            }}
            data-hs-overlay="#confirm-delete-modal"
            type="button"
          >
            <Icon icon="trash" className="text-base" />
          </button>
        </div>
      ),
    },
  ]

  const [data, setData] = useState<ProductReviewType[]>(() => [...productReviewData])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 })
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({})
  const table = useReactTable({
    data,
    columns,
    state: { columnFilters, pagination, rowSelection: selectedRowIds, globalFilter },
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setSelectedRowIds,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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
      <div className="border-default-300 border-b border-dashed">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="border-default-300 grid grid-cols-12 border-e border-dashed">
            <div className="col-span-7">
              <div className="flex items-center gap-base p-7.5 md:gap-7.5">
                <img src={ratingsImg} alt="Product" className="h-20" width={95} />
                <div className="flex flex-col gap-y-2.5">
                  <h3 className="flex items-center gap-2.5 text-xl font-bold">
                    4.92
                    <Icon icon="star-filled" className="text-xl text-warning" />
                  </h3>
                  <p>Based on 245 verified reviews</p>
                  <h6>
                    <p className="text-default-400 text-xs font-medium">Feedback collected from real customers who purchased our templates</p>
                  </h6>
                  <div>
                    <span className="badge badge-label bg-success/15 font-semibold text-success">+12 new this week</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-5">
              <div className="space-y-2.5 mt-2 p-5">
                {ratings.map((rating, idx) => (
                  <div className="flex items-center gap-2.5" key={idx}>
                    <div className="text-sm text-nowrap min-w-12.5">{rating.stars} Star</div>
                    <div className="bg-default-100 flex h-2 w-full overflow-hidden rounded-full" role="progressbar" aria-valuenow={rating.progress} aria-valuemin={0} aria-valuemax={100}>
                      <div className="bg-primary flex flex-col justify-center overflow-hidden rounded-s-full text-center text-xs whitespace-nowrap text-white transition duration-500" style={{ width: `${rating.progress}%` }} />
                    </div>
                    <div className="text-end">
                      <span className="badge bg-light text-dark">{rating.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="ps-1.5 pe-6">
            <ApexChart getOptions={getReviewChartOptions} series={getReviewChartOptions().series} type="area" height={185} />
          </div>
        </div>
      </div>
      <div className="card-header">
        <div className="flex gap-2">
          <div className="input-icon-group">
            <Icon icon="search" className="input-icon" />
            <input type="search" placeholder="Search reviews..." className="form-input w-full ps-10" value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} />
          </div>
          <button className={cn('btn bg-danger text-white hover:bg-danger-hover', !(Object.keys(selectedRowIds).length > 0) && 'hidden')} type="button" data-hs-overlay="#confirm-delete-modal">
            Delete
          </button>
        </div>
        <div className="ms-auto">
          <div className="flex items-center gap-2.5">
            <select value={table.getState().pagination.pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))} className="form-select">
              {[5, 10, 15, 20].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <div className="relative">
              <div className="hs-dropdown relative inline-flex [--placement:bottom-right]">
                <button type="button" className="hs-dropdown-toggle btn border-default-300 text-default-800 hover:bg-default-100 border" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
                  <Icon icon="download" className="text-sm" />
                  Export
                  <Icon icon="chevron-down" className="text-sm" />
                </button>
                <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
                  <div className="space-y-0.5">
                    <Link className="dropdown-item" to="">
                      Export as PDF
                    </Link>
                    <Link className="dropdown-item" to="">
                      Export as CSV
                    </Link>
                    <Link className="dropdown-item" to="">
                      Export as Excel
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="hs-dropdown relative inline-flex [--placement:bottom-right]">
                <button type="button" className="hs-dropdown-toggle btn border-default-300 text-default-800 hover:bg-default-100 border text-nowrap" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
                  View All
                  <Icon icon="chevron-down" className="text-sm" />
                </button>
                <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
                  <div className="space-y-0.5">
                    <Link className="dropdown-item" to="">
                      All
                    </Link>
                    <Link className="dropdown-item" to="">
                      Pending
                    </Link>
                    <Link className="dropdown-item" to="">
                      Approved
                    </Link>
                    <Link className="dropdown-item" to="">
                      Disabled
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <DataTable<ProductReviewType> table={table} emptyMessage="No records found" />
      {table.getRowModel().rows.length > 0 && (
        <div className="card-footer border-light">
          <TablePagination
            totalItems={totalItems}
            start={start}
            end={end}
            showInfo
            itemsName="reviews"
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

export default ProductReviews
