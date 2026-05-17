import Rating from '@/components/Rating'
import DataTable from '@/components/table/DataTable'
import Icon from '@/components/wrappers/Icon'
import { toPascalCase } from '@/utils/helpers'
import { createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { useState } from 'react'
import { Button, Card, CardHeader, CardTitle } from 'react-bootstrap'
import { Link } from 'react-router'
import { customTableData } from './data'
const priceRangeFilterFn = (row, columnId, value) => {
  const price = row.getValue(columnId)
  if (!value) return true
  if (value === '500+') return price > 500
  const [min, max] = value.split('-').map(Number)
  return price >= min && price <= max
}
const columnHelper = createColumnHelper()
const TableWithSearch = () => {
  const columns = [
    columnHelper.accessor('product.name', {
      header: 'Product',
      cell: ({ row }) => (
        <div className="d-flex">
          <div className="avatar-md me-3">
            <img src={row.original.product.image} alt="Product" height={36} width={36} className="img-fluid rounded" />
          </div>
          <div>
            <h5 className="mb-1">
              <Link to="" className="link-reset">
                {row.original.product.name}
              </Link>
            </h5>
            <p className="text-muted mb-0 fs-xxs">by: {row.original.product.manufacturer}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('sku', {
      header: 'Code',
    }),
    columnHelper.accessor('category', {
      header: 'Category',
      filterFn: 'equalsString',
      enableColumnFilter: true,
    }),
    columnHelper.accessor('stock', {
      header: 'Stock',
    }),
    columnHelper.accessor('price', {
      header: 'Price',
      filterFn: priceRangeFilterFn,
      enableColumnFilter: true,
      cell: ({ row }) => <>{row.original.price}</>,
    }),
    columnHelper.accessor('orders', {
      header: 'Orders',
    }),
    columnHelper.accessor('rating', {
      header: 'Rating',
      cell: ({ row }) => (
        <>
          <Rating rating={row.original.rating} />
          <span className="ms-1">
            <Link to="" className="link-reset fw-semibold">
              ({row.original.reviews})
            </Link>
          </span>
        </>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      filterFn: 'equalsString',
      enableColumnFilter: true,
      cell: ({ row }) => <span className={`badge ${row.original.status === 'published' ? 'badge-soft-success' : row.original.status === 'pending' ? 'badge-soft-warning' : 'badge-soft-danger'} fs-xxs`}>{toPascalCase(row.original.status)}</span>,
    }),
    columnHelper.accessor('date', {
      header: 'Date',
      cell: ({ row }) => (
        <>
          {row.original.date} <small className="text-muted">{row.original.time} </small>
        </>
      ),
    }),
    {
      header: 'Actions',
      cell: () => (
        <div className="d-flex gap-1">
          <Button variant="light" size="sm" className="btn-icon rounded-circle">
            <Icon icon="eye" className="fs-lg" />
          </Button>
          <Button variant="light" size="sm" className="btn-icon rounded-circle">
            <Icon icon="edit" className="fs-lg" />
          </Button>
          <Button variant="light" size="sm" className="btn-icon rounded-circle">
            <Icon icon="trash" className="fs-lg" />
          </Button>
        </div>
      ),
    },
  ]
  const [data] = useState(() => [...customTableData])
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  })
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
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
    filterFns: {
      priceRange: priceRangeFilterFn,
    },
  })
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h4">Custom Table with Search</CardTitle>
      </CardHeader>
      <CardHeader>
        <div className="d-flex gap-2">
          <div className="app-search">
            <input type="search" className="form-control" placeholder="Search product name..." value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} />
            <Icon icon="search" className="app-search-icon text-muted" />
          </div>
        </div>
      </CardHeader>
      <DataTable table={table} emptyMessage="No records found" />
    </Card>
  )
}
export default TableWithSearch
