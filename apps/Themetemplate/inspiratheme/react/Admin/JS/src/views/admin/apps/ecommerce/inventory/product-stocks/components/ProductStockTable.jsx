import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { toPascalCase } from '@/utils/helpers'
import { createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import clsx from 'clsx'
import { useState } from 'react'
import { Button, Card, CardFooter, CardHeader, FormControl, FormSelect } from 'react-bootstrap'
import { Link } from 'react-router'
import { productStockData } from './data'
const columnHelper = createColumnHelper()
const ProductStockTable = () => {
  const columns = [
    {
      id: 'select',
      maxSize: 45,
      size: 45,
      header: ({ table }) => <input type="checkbox" className="form-check-input form-check-input-light fs-14" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }) => <input type="checkbox" className="form-check-input form-check-input-light fs-14" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
    columnHelper.accessor('product', {
      header: 'Product',
      enableColumnFilter: false,
      enableGlobalFilter: true,
      cell: ({ row }) => (
        <div className="d-flex align-items-center">
          <div className="avatar-md me-3">
            <img src={row.original.product.image} alt="Product" className="img-fluid rounded" />
          </div>
          <div>
            <h5 className="mb-1">
              <Link to="/apps/ecommerce/product-details" className="link-reset">
                {row.original.product.name}
              </Link>
            </h5>
            <p className="text-muted mb-0 fs-xs">Supplier: {row.original.product.supplier}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('sku', {
      header: 'Sku',
      enableSorting: false,
      enableGlobalFilter: true,
    }),
    columnHelper.accessor('category', {
      header: 'Category',
    }),
    columnHelper.accessor('availableStock', {
      header: 'Available Stock',
      cell: ({ row }) => <h5 className={clsx('fs-base mb-0 fw-medium', row.original.availableStock === 0 ? 'text-danger' : 'text-success')}>{row.original.availableStock}</h5>,
    }),
    columnHelper.accessor('lowStock', {
      header: 'Low Stock',
      cell: ({ row }) => <h5 className={clsx('fs-base mb-0 fw-medium', row.original.lowStock < 20 ? 'text-danger' : 'text-warning')}>{row.original.lowStock}</h5>,
    }),
    columnHelper.accessor('price', {
      header: 'Unit Price',
      enableColumnFilter: true,
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue === 'All') return true
        const priceStr = row.getValue(columnId)
        const price = parseFloat(priceStr.replace('$', ''))
        if (filterValue === '0-50') return price >= 0 && price <= 50
        if (filterValue === '51-150') return price >= 51 && price <= 150
        if (filterValue === '151-500') return price >= 151 && price <= 500
        if (filterValue === '501-1000') return price >= 501 && price <= 1000
        if (filterValue === '1000+') return price > 1000
        return true
      },
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      filterFn: 'equalsString',
      enableColumnFilter: true,
      cell: ({ row }) => <span className={`badge badge-label ${row.original.status === 'out-of-stock' ? 'badge-soft-danger' : row.original.status === 'low-stock' ? 'badge-soft-warning' : 'badge-soft-success'} fs-xxs`}>{toPascalCase(row.original.status)}</span>,
    }),
    columnHelper.accessor('date', {
      header: 'Last Updated',
      filterFn: 'equalsString',
      cell: ({ row }) => (
        <>
          {row.original.date} <small className="text-muted">{row.original.time}</small>
        </>
      ),
    }),
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="d-flex gap-1">
          <Button size="sm" variant="light" className="btn-icon rounded-circle">
            <Icon icon="eye" className="fs-lg" />
          </Button>
          <Button size="sm" variant="light" className="btn-icon rounded-circle">
            <Icon icon="edit" className="fs-lg" />
          </Button>
          <Button
            size="sm"
            variant="light"
            className="btn-icon rounded-circle"
            onClick={() => {
              toggleDeleteModal()
              setSelectedRowIds({
                [row.id]: true,
              })
            }}
          >
            <Icon icon="trash" className="fs-lg" />
          </Button>
        </div>
      ),
    },
  ]
  const [data, setData] = useState(() => [...productStockData])
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [selectedRowIds, setSelectedRowIds] = useState({})
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      rowSelection: selectedRowIds,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const toggleDeleteModal = () => {
    setShowDeleteModal(!showDeleteModal)
  }
  const handleDelete = () => {
    const selectedIds = new Set(Object.keys(selectedRowIds))
    setData((old) => old.filter((_, idx) => !selectedIds.has(idx.toString())))
    setSelectedRowIds({})
    setShowDeleteModal(false)
  }
  return (
    <Card>
      <CardHeader className="border-light justify-content-between">
        <div className="d-flex gap-2">
          <div className="app-search">
            <FormControl type="search" value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Search product name or SKU..." />
            <Icon icon="search" className="app-search-icon text-muted" />
          </div>
          {Object.keys(selectedRowIds).length > 0 && (
            <Button variant="danger" onClick={toggleDeleteModal}>
              Delete
            </Button>
          )}
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="me-2 fw-semibold">Filter By:</span>

          <div className="app-search">
            <FormSelect value={table.getColumn('category')?.getFilterValue() ?? 'All'} onChange={(e) => table.getColumn('category')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)} className="form-control my-1 my-md-0">
              <option value="All">Category</option>
              <option value="Electronics">Electronics</option>
              <option value="Mobiles">Mobiles</option>
              <option value="Audio">Audio</option>
              <option value="Furniture">Furniture</option>
              <option value="Appliances">Appliances</option>
              <option value="Wearables">Wearables</option>
              <option value="Cameras">Cameras</option>
              <option value="Computers">Computers</option>
              <option value="Accessories">Accessories</option>
            </FormSelect>
            <Icon icon="tag" className="app-search-icon text-muted"></Icon>
          </div>

          <div className="app-search">
            <FormSelect value={table.getColumn('status')?.getFilterValue() ?? 'All'} onChange={(e) => table.getColumn('status')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)} className="form-control my-1 my-md-0">
              <option value="All">Stock Status</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </FormSelect>
            <Icon icon="activity" className="app-search-icon text-muted"></Icon>
          </div>

          <div className="app-search">
            <FormSelect className="form-control my-1 my-md-0" value={table.getColumn('price')?.getFilterValue() ?? 'All'} onChange={(e) => table.getColumn('price')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
              <option value="All">Price Range</option>
              <option value="0-50">$0 - $50</option>
              <option value="51-150">$51 - $150</option>
              <option value="151-500">$151 - $500</option>
              <option value="501-1000">$501 - $1,000</option>
              <option value="1000+">$1,000+</option>
            </FormSelect>
            <Icon icon="currency-dollar" className="app-search-icon text-muted"></Icon>
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
        </div>

        <div className="d-flex gap-1">
          <Link to="/apps/ecommerce/product-add" className="btn btn-danger ms-1">
            <Icon icon="plus" className="fs-sm me-2"></Icon>
            Add Product
          </Link>
        </div>
      </CardHeader>

      <DataTable table={table} emptyMessage="No records found" />

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
  )
}
export default ProductStockTable
