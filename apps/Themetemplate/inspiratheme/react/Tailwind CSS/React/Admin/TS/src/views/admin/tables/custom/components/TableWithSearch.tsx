import Rating from '@/components/Rating'
import DataTable from '@/components/table/DataTable'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { toPascalCase } from '@/utils/helpers'
import { createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type ColumnFiltersState } from '@tanstack/react-table'
import { Link } from 'react-router'
import { useState } from 'react'
import { CustomTableType, customTableData } from './data'

const columnHelper = createColumnHelper<CustomTableType>()

const TableWithSearch = () => {
  const columns = [
    columnHelper.accessor('product.name', {
      header: 'Product',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex">
          <div>
            <div className="me-5 size-5 lg:size-9">
              <img src={row.original.product.image} alt="Product" className="size-5 rounded lg:size-9" />
            </div>
          </div>
          <div>
            <h5 className="text-default-800 hover:text-primary mb-1">
              <Link to="/ecommerce/product/details">{row.original.product.name}</Link>
            </h5>
            <p className="text-default-400 text-2xs">by: {row.original.product.manufacturer}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('sku', { header: 'Code', enableSorting: false }),
    columnHelper.accessor('category', {
      header: 'Category',
      filterFn: 'equalsString',
      enableSorting: false,
    }),
    columnHelper.accessor('stock', { header: 'Stock', enableSorting: false }),
    columnHelper.accessor('price', {
      header: 'Price',
      cell: ({ row }) => <>{row.original.price}</>,
    }),
    columnHelper.accessor('orders', { header: 'Orders', enableSorting: false }),
    columnHelper.accessor('rating', {
      header: 'Rating',
      enableSorting: false,
      cell: ({ row }) => (
        <>
          <Rating rating={row.original.rating} />
          <span className="ms-1">
            <Link to="/ecommerce/reviews" className="hover:text-primary font-semibold">
              ({row.original.reviews})
            </Link>
          </span>
        </>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      filterFn: 'equalsString',
      enableSorting: false,
      cell: ({ row }) => <span className={`badge ${row.original.status === 'published' ? 'bg-success/15 text-success' : row.original.status === 'pending' ? 'bg-warning/15 text-warning' : 'bg-danger/15 text-danger'} text-2xs`}>{toPascalCase(row.original.status)}</span>,
    }),
    columnHelper.accessor('date', {
      header: 'Date',
      enableSorting: false,
      cell: ({ row }) => (
        <>
          {row.original.date} <small className="text-default-400">{row.original.time}</small>
        </>
      ),
    }),
    {
      header: 'Actions',
      cell: () => (
        <div className="flex justify-center gap-1.5">
          <button type="button" className="btn bg-default-100 btn-icon btn-sm text-default-800 hover:text-primary size-7.5 rounded-full">
            <Icon icon="eye" className="text-base" />
          </button>
          <button type="button" className="btn bg-default-100 btn-icon btn-sm text-default-800 hover:text-primary size-7.5 rounded-full">
            <Icon icon="edit" className="text-base" />
          </button>
          <button className="btn bg-default-100 btn-icon btn-sm text-default-800 hover:text-primary size-7.5 rounded-full" type="button">
            <Icon icon="trash" className="text-base" />
          </button>
        </div>
      ),
    },
  ]

  const [data, setData] = useState<CustomTableType[]>(() => [...customTableData])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 })

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, columnFilters, pagination },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
    enableColumnFilters: true,
    enableRowSelection: true,
  })

  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const totalItems = table.getFilteredRowModel().rows.length

  const start = pageIndex * pageSize + 1
  const end = Math.min(start + pageSize - 1, totalItems)
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Custom Table with Search</h4>
      </div>
      <div className="border-default-300 flex flex-wrap justify-between gap-2.5 border-b border-dashed px-5 py-4">
        <div className="flex gap-2">
          <div className="input-icon-group">
            <Icon icon="search" className="input-icon" />
            <input type="search" placeholder="Search product name..." className="form-input" value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} />
          </div>
        </div>
      </div>

      <DataTable<CustomTableType> table={table} emptyMessage="No records found" />

      {table.getRowModel().rows.length > 0 && (
        <div className="card-footer">
          <TablePagination
            totalItems={totalItems}
            start={start}
            end={end}
            itemsName="products"
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

export default TableWithSearch
