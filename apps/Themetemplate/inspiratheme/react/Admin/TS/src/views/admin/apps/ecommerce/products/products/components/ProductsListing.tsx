import Rating from '@/components/Rating'
import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { toPascalCase } from '@/utils/helpers'
import { ColumnDef, type ColumnFiltersState, createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, Row as TableRow, Table as TableType, useReactTable } from '@tanstack/react-table'
import { Link } from 'react-router'
import { useState } from 'react'
import { Button, Card, CardFooter, CardHeader, Col, FormSelect, Row } from 'react-bootstrap'
import { productData, ProductType } from './data'

const columnHelper = createColumnHelper<ProductType>()

const ProductsListing = () => {
  const columns: ColumnDef<ProductType, any>[] = [
    {
      id: 'select',
      maxSize: 45,
      size: 45,
      header: ({ table }: { table: TableType<ProductType> }) => <input type="checkbox" className="form-check-input form-check-input-light fs-14" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }: { row: TableRow<ProductType> }) => <input type="checkbox" className="form-check-input form-check-input-light fs-14" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
    columnHelper.accessor('name', {
      header: 'Product',
      cell: ({ row }) => (
        <div className="d-flex">
          <div className="avatar-md me-3">
            <img src={row.original.image} alt="Product" height={36} width={36} className="img-fluid rounded" />
          </div>
          <div>
            <h5 className="mb-1">
              <Link to="/apps/ecommerce/product-details" className="link-reset">
                {row.original.name}
              </Link>
            </h5>
            <p className="text-muted mb-0 fs-xxs">by: {row.original.brand}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('sku', { header: 'SKU' }),
    columnHelper.accessor('category', {
      header: 'Category',
      filterFn: 'equalsString',
      enableColumnFilter: true,
    }),
    columnHelper.accessor('stock', { header: 'Stock' }),
    columnHelper.accessor('price', {
      header: 'Price',
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue === 'All') return true

        const priceStr = row.getValue(columnId) as string
        const price = parseFloat(priceStr.replace('$', ''))

        if (filterValue === '0-50') return price >= 0 && price <= 50
        if (filterValue === '51-150') return price >= 51 && price <= 150
        if (filterValue === '151-500') return price >= 151 && price <= 500
        if (filterValue === '500+') return price > 500

        return true
      },
    }),
    columnHelper.accessor('orders', { header: 'Orders' }),
    columnHelper.accessor('rating', {
      header: 'Rating',
      cell: ({ row }) => (
        <>
          <Rating rating={row.original.rating} className="d-inline-flex gap-1" />
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
      header: 'Published',
      cell: ({ row }) => (
        <>
          {row.original.date} <small className="text-muted">{row.original.time}</small>
        </>
      ),
    }),
    {
      header: 'Actions',
      cell: ({ row }: { row: TableRow<ProductType> }) => (
        <div className="d-flex gap-1">
          <Button variant="light" size="sm" className="btn btn-icon rounded-circle">
            <Icon icon="eye" className="fs-lg" />
          </Button>
          <Button variant="light" size="sm" className="btn btn-icon rounded-circle">
            <Icon icon="edit" className="fs-lg" />
          </Button>
          <Button
            variant="light"
            size="sm"
            className="btn btn-icon rounded-circle"
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

  const [data, setData] = useState<ProductType[]>(() => [...productData])
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
    <Row>
      <Col xs={12}>
        <Card className="mb-4">
          <CardHeader className="d-flex justify-content-between align-items-center">
            <div className="d-flex gap-2">
              <div className="app-search">
                <input type="search" className="form-control" placeholder="Search product name..." value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} />
                <Icon icon="search" className="app-search-icon text-muted" />
              </div>

              {Object.keys(selectedRowIds).length > 0 && (
                <Button variant="danger" onClick={toggleDeleteModal}>
                  Delete
                </Button>
              )}
            </div>

            <div className="d-flex align-items-center gap-2">
              <span className="me-2 fw-semibold">Filter By:</span>

              <div className="app-search">
                <FormSelect className="form-control my-1 my-md-0" value={(table.getColumn('category')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('category')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
                  <option value="All">Category</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Home">Home</option>
                  <option value="Sports">Sports</option>
                  <option value="Beauty">Beauty</option>
                </FormSelect>
                <Icon icon="tag" className="app-search-icon text-muted" />
              </div>

              <div className="app-search">
                <FormSelect className="form-control my-1 my-md-0" value={(table.getColumn('status')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('status')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
                  <option value="All">Status</option>
                  <option value="published">Published</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </FormSelect>
                <Icon icon="activity" className="app-search-icon text-muted" />
              </div>

              <div className="app-search">
                <FormSelect className="form-control my-1 my-md-0" value={(table.getColumn('price')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('price')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
                  <option value="All">Price Range</option>
                  <option value="0-50">$0 - $50</option>
                  <option value="51-150">$51 - $150</option>
                  <option value="151-500">$151 - $500</option>
                  <option value="500+">$500+</option>
                </FormSelect>
                <Icon icon="currency-dollar" className="app-search-icon text-muted" />
              </div>

              <div>
                <FormSelect className="form-control my-1 my-md-0" value={table.getState().pagination.pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))}>
                  {[5, 8, 10, 15, 20].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </FormSelect>
              </div>
            </div>

            <div className="d-flex gap-1">
              <Link to="/apps/ecommerce/products-grid">
                <Button variant="outline-primary" className="btn-icon btn-soft-primary">
                  <Icon icon="category" className="fs-lg" />
                </Button>
              </Link>
              <Button variant="primary" className="btn-icon">
                <Icon icon="list-check" className="fs-lg" />
              </Button>
              <Link to="/apps/ecommerce/product-add">
                <Button variant="danger" className="ms-1">
                  <Icon icon="plus" className="fs-sm me-2" /> Add Product
                </Button>
              </Link>
            </div>
          </CardHeader>

          <DataTable<ProductType> table={table} emptyMessage="No records found" />

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
      </Col>
    </Row>
  )
}

export default ProductsListing
