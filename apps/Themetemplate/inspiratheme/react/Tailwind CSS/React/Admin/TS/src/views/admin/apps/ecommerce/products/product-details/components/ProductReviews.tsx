import ratingsImg from '@/assets/images/ratings.svg'
import Rating from '@/components/Rating'
import DataTable from '@/components/table/DataTable'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { cn, toPascalCase } from '@/utils/helpers'
import { ColumnFiltersState, createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { useState } from 'react'
import { reviewData, type ReviewType } from './data'

const ratings = [
  { stars: 5, progress: 85, value: 128 },
  { stars: 4, progress: 10, value: 37 },
  { stars: 3, progress: 3, value: 15 },
  { stars: 2, progress: 1, value: 7 },
  { stars: 1, progress: 1, value: 2 },
]

const columnHelper = createColumnHelper<ReviewType>()

const ProductReviews = () => {
  const columns = [
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
        <div className="w-xs px-4 py-3">
          <Rating rating={row.original.rating} />
          <h5 className="text-default-800 mt-3 mb-2 text-sm font-medium">{row.original.title}</h5>
          <p className="text-default-400 text-sm italic">{row.original.comment}</p>
        </div>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor('date', {
      header: 'Date',
      cell: ({ row }) => (
        <span className="flex items-center gap-1.5">
          {row.original.date}
          <span className="text-default-400 block text-xs">{row.original.time}</span>
        </span>
      ),
    }),
    columnHelper.accessor('status', {
      cell: ({ row }) => <span className={cn('badge text-2xs font-semibold ', row.original.status === 'published' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning')}>{toPascalCase(row.original.status)}</span>,
    }),
    {
      enableSorting: false,
      header: 'Actions',
      cell: () => (
        <div className="flex justify-center gap-1.5">
          <button type="button" className="btn btn-icon btn-sm border border-default-300 hover:border-default-400">
            <Icon icon="eye" className="text-base" />
          </button>
          <button type="button" className="btn btn-icon btn-sm border border-default-300 hover:border-default-400">
            <Icon icon="edit" className="text-base" />
          </button>
          <button className="btn btn-icon btn-sm border border-default-300 hover:border-default-400" type="button">
            <Icon icon="trash" className="text-base" />
          </button>
        </div>
      ),
    },
  ]

  const [data, setData] = useState<ReviewType[]>(() => [...reviewData])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 })

  const table = useReactTable({
    data,
    columns,
    state: { columnFilters, pagination },
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
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
  return (
    <div className="card shadow-none border border-dashed border-default-300">
      <div className="card-header">
        <h4 className="card-title">Manage Reviews</h4>
      </div>
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="flex flex-wrap items-start p-7.5 gap-7.5">
              <img src={ratingsImg} alt="Product" className="h-20 w-24 inline-flex" />
              <div className="flex flex-col gap-y-2.5">
                <h3 className="text-primary flex items-center gap-2.5 text-xl font-bold">
                  4.92
                  <Icon icon="star-filled" className="text-xl" />
                </h3>

                <p>Based on 245 verified reviews</p>

                <p className="text-default-400 text-xs">Feedback collected from real customers who purchased our templates</p>

                <div>
                  <span className="badge badge-label bg-success text-white">+12 new this week</span>
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="space-y-2.5 p-7.5">
              {ratings.map((rating, idx) => (
                <div className="flex items-center gap-2" key={idx}>
                  <div className="text-default-800 text-sm text-nowrap">{rating.stars} Star</div>
                  <div className="bg-default-200 flex h-2 w-full overflow-hidden rounded-full" role="progressbar" aria-valuenow={rating.progress} aria-valuemin={0} aria-valuemax={100}>
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
      </div>
      <DataTable<ReviewType> table={table} emptyMessage="No records found" />
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
    </div>
  )
}

export default ProductReviews
