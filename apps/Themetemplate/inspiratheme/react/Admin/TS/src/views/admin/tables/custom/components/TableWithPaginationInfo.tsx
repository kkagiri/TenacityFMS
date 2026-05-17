import Rating from '@/components/Rating'
import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { toPascalCase } from '@/utils/helpers'
import { type ColumnFiltersState, createColumnHelper, FilterFn, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, Row as TableRow, Table as TableType, useReactTable } from '@tanstack/react-table'
import { Link } from 'react-router'
import { useState } from 'react'
import { Button, Card, CardFooter, CardHeader, CardTitle, FormSelect } from 'react-bootstrap'
import { customTableData, CustomTableType } from './data'

const priceRangeFilterFn: FilterFn<CustomTableType> = (row, columnId, value) => {
  const price = row.getValue<number>(columnId)
  if (!value) return true

  if (value === '500+') return price > 500

  const [min, max] = value.split('-').map(Number)
  return price >= min && price <= max
}

const columnHelper = createColumnHelper<CustomTableType>()

const TableWithPaginationInfo = () => {
  const columns = [
    {
      id: 'select',
      header: ({ table }: { table: TableType<CustomTableType> }) => <input type="checkbox" className="form-check-input form-check-input-light fs-14" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }: { row: TableRow<CustomTableType> }) => <input type="checkbox" className="form-check-input form-check-input-light fs-14" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
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
    columnHelper.accessor('sku', { header: 'Code' }),
    columnHelper.accessor('category', {
      header: 'Category',
      filterFn: 'equalsString',
      enableColumnFilter: true,
    }),
    columnHelper.accessor('stock', { header: 'Stock' }),
    columnHelper.accessor('price', {
      header: 'Price',
      filterFn: priceRangeFilterFn,
      enableColumnFilter: true,
      cell: ({ row }) => <>{row.original.price}</>,
    }),
    columnHelper.accessor('orders', { header: 'Orders' }),
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
          {row.original.date} <small className="text-muted">{row.original.time}</small>
        </>
      ),
    }),
    {
      header: 'Actions',
      cell: ({ row }: { row: TableRow<CustomTableType> }) => (
        <div className="d-flex gap-1">
          <Button variant="light" size="sm" className="btn-icon rounded-circle">
            <Icon icon="eye" className="fs-lg" />
          </Button>
          <Button variant="light" size="sm" className="btn-icon rounded-circle">
            <Icon icon="edit" className="fs-lg" />
          </Button>
          <Button
            variant="danger"
            size="sm"
            className="btn-icon rounded-circle"
            onClick={() => {
              toggleDeleteModal()
              setSelectedRowIds({ [row.id]: true })
            }}
          >
            <Icon icon="trash" className="fs-lg" />
          </Button>
        </div>
      ),
    },
  ]

  const [data, setData] = useState<CustomTableType[]>(() => [...customTableData])
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 })

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
      priceRange: priceRangeFilterFn,
    },
  })

  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const totalItems = table.getFilteredRowModel().rows.length

  const start = pageIndex * pageSize + 1
  const end = Math.min(start + pageSize - 1, totalItems)

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)

  const toggleDeleteModal = () => {
    setShowDeleteModal(!showDeleteModal)
  }

  const handleDelete = () => {
    const selectedIds = new Set(Object.keys(selectedRowIds))
    setData((old) => old.filter((_, idx) => !selectedIds.has(idx.toString())))
    setSelectedRowIds({})
    setPagination({ ...pagination, pageIndex: 0 })
    setShowDeleteModal(false)
  }
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle as="h4">Custom table with pagination info</CardTitle>
        </CardHeader>
        <CardHeader className="border-light justify-content-between">
          <div className="d-flex gap-2">
            <div className="app-search">
              <input type="search" className="form-control" placeholder="Search product name..." value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} />
              <Icon icon="search" className="app-search-icon text-muted" />
            </div>
            {Object.keys(selectedRowIds).length > 0 && (
              <Button variant="danger" size="sm" onClick={toggleDeleteModal}>
                Delete
              </Button>
            )}
          </div>
          <div>
            <FormSelect className="form-control my-1 my-md-0" value={table.getState().pagination.pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))}>
              {[5, 10, 15, 20].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </FormSelect>
          </div>
        </CardHeader>
        <DataTable<CustomTableType> table={table} emptyMessage="No records found" />

        {table.getRowModel().rows.length > 0 && (
          <CardFooter className="border-0">
            <TablePagination
              totalItems={totalItems}
              start={start}
              end={end}
              itemsName="products"
              showInfo
              previousPage={table.previousPage}
              canPreviousPage={table.getCanPreviousPage()}
              pageCount={table.getPageCount()}
              pageIndex={table.getState().pagination.pageIndex}
              setPageIndex={table.setPageIndex}
              nextPage={table.nextPage}
              canNextPage={table.getCanNextPage()}
            />
          </CardFooter>
        )}

        <DeleteConfirmationModal show={showDeleteModal} onHide={toggleDeleteModal} onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="product" />
      </Card>
    </>
  )
}

export default TableWithPaginationInfo
