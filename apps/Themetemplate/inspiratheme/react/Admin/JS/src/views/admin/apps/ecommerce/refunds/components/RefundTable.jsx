import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { toPascalCase } from '@/utils/helpers'
import { createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { useState } from 'react'
import { Button, Card, CardFooter, CardHeader, Dropdown, DropdownDivider, DropdownItem, DropdownMenu, DropdownToggle, FormControl, FormSelect } from 'react-bootstrap'
import { Link } from 'react-router'
import { refundData } from './data'
const columnHelper = createColumnHelper()
const RefundTable = () => {
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
    columnHelper.accessor('orderId', {
      header: 'Order Id',
      cell: ({ row }) => (
        <h5 className="fs-sm mb-0">
          <Link to="/apps/ecommerce/order-details" className="link-reset">
            {row.original.orderId}
          </Link>
        </h5>
      ),
    }),
    columnHelper.accessor('product', {
      header: 'Product',
      enableColumnFilter: false,
      cell: ({ row }) => (
        <div className="d-flex align-items-center gap-2">
          <img src={row.original.product.image} alt="" className="rounded" width="34" height="34" />
          <div>
            <div className="fw-medium">{row.original.product.name}</div>
            <small className="text-muted">SKU: {row.original.product.sku}</small>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('customer', {
      header: 'Customer',
      enableColumnFilter: false,
      cell: ({ row }) => (
        <div className="d-flex justify-content-start align-items-center gap-2">
          <div className="avatar avatar-sm">
            <img src={row.original.customer.image} alt="avatar-5" className="img-fluid rounded-circle" />
          </div>
          <div>
            <h5 className="text-nowrap fs-base mb-0 lh-base">{row.original.customer.name}</h5>
            <p className="text-muted fs-xs mb-0">{row.original.customer.email}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('reason', {
      header: 'Reason',
      enableColumnFilter: false,
    }),
    columnHelper.accessor('payment', {
      header: 'Payment',
      enableColumnFilter: true,
      cell: ({ row }) => (
        <>
          <img src={row.original.payment.image} alt="" className="me-2" height="28" /> {row.original.payment.type === 'card' ? row.original.payment.number : row.original.payment.name}
        </>
      ),
    }),
    columnHelper.accessor('amount', {
      header: 'Amount',
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      filterFn: 'equalsString',
      enableColumnFilter: true,
      cell: ({ row }) => (
        <span className={`badge badge-label ${row.original.status === 'rejected' ? 'badge-soft-danger' : row.original.status === 'pending' ? 'badge-soft-warning' : row.original.status === 'refunded' ? 'badge-soft-secondary' : 'badge-soft-success'} fs-xxs`}>
          {toPascalCase(row.original.status)}
        </span>
      ),
    }),
    columnHelper.accessor('requestedDate', {
      header: 'Requested',
      enableColumnFilter: false,
    }),
    columnHelper.accessor('processedDate', {
      header: 'Processed',
      enableColumnFilter: false,
      cell: ({ row }) => (row.original.processedDate ? row.original.processedDate : '-'),
    }),
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="d-flex gap-1">
          <Button size="sm" variant="light" className="btn-icon rounded-circle">
            <Icon icon="check" className="fs-lg" />
          </Button>
          <Button size="sm" variant="light" className="btn-icon rounded-circle">
            <Icon icon="x" className="fs-lg" />
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
          <Dropdown>
            <DropdownToggle variant="light" size="sm" className="btn-icon dropdown-toggle drop-arrow-none rounded-circle">
              <Icon icon="dots-vertical" className="fs-lg" />
            </DropdownToggle>
            <DropdownMenu align="end">
              <DropdownItem href="">View order</DropdownItem>
              <DropdownItem href="">Contact customer</DropdownItem>
              <li>
                <DropdownDivider />
              </li>
              <DropdownItem href="">Add note</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      ),
    },
  ]
  const [data, setData] = useState(() => [...refundData])
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 8,
  })
  const [selectedRowIds, setSelectedRowIds] = useState({})
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      pagination,
      rowSelection: selectedRowIds,
    },
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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const toggleDeleteModal = () => {
    setShowDeleteModal(!showDeleteModal)
  }
  const handleDelete = () => {
    const selectedIds = new Set(Object.keys(selectedRowIds))
    setData((old) => old.filter((_, idx) => !selectedIds.has(idx.toString())))
    setSelectedRowIds({})
    setPagination({
      ...pagination,
      pageIndex: 0,
    })
    setShowDeleteModal(false)
  }
  return (
    <Card>
      <CardHeader className="border-light justify-content-between">
        <div className="d-flex gap-2">
          <div className="app-search">
            <FormControl value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} type="search" placeholder="Search refunds..." />
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
            <FormSelect value={table.getColumn('status')?.getFilterValue() ?? 'All'} onChange={(e) => table.getColumn('status')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)} className="form-control my-1 my-md-0">
              <option value="All">Refund Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Refunded">Refunded</option>
            </FormSelect>
            <Icon icon="credit-card-refund" className="app-search-icon text-muted"></Icon>
          </div>

          <div>
            <FormSelect value={table.getState().pagination.pageSize} className="form-control my-1 my-md-0" onChange={(e) => table.setPageSize(Number(e.target.value))}>
              {[5, 8, 10, 15, 20].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </FormSelect>
          </div>
        </div>

        <div className="d-flex gap-1">
          <Button variant="primary" className="ms-1">
            <Icon icon="plus" className="fs-sm me-2" /> Create Refund
          </Button>
        </div>
      </CardHeader>

      <DataTable table={table} emptyMessage="No records found" />

      {table.getRowModel().rows.length > 0 && (
        <CardFooter className="border-0">
          <TablePagination
            totalItems={totalItems}
            start={start}
            end={end}
            itemsName="refunds"
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

      <DeleteConfirmationModal show={showDeleteModal} onHide={toggleDeleteModal} onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="refund" />
    </Card>
  )
}
export default RefundTable
