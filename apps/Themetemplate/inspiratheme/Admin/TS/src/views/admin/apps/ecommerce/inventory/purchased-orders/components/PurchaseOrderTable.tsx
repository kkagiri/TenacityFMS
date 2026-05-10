import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { toPascalCase } from '@/utils/helpers'
import { ColumnDef, type ColumnFiltersState, createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, Row as TableRow, Table as TableType, useReactTable } from '@tanstack/react-table'
import { Link } from 'react-router'
import { useState } from 'react'
import { Button, Card, CardFooter, CardHeader, FormControl, FormSelect } from 'react-bootstrap'
import { purchasedOrderData, PurchasedOrderType } from './data'

const columnHelper = createColumnHelper<PurchasedOrderType>()

const PurchaseOrderTable = () => {
  const columns: ColumnDef<PurchasedOrderType, any>[] = [
    {
      id: 'select',
      maxSize: 45,
      size: 45,
      header: ({ table }: { table: TableType<PurchasedOrderType> }) => <input type="checkbox" className="form-check-input form-check-input-light fs-14" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }: { row: TableRow<PurchasedOrderType> }) => <input type="checkbox" className="form-check-input form-check-input-light fs-14" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
    columnHelper.accessor('id', {
      header: 'Po Number',
      cell: ({ row }) => (
        <Link to="" className="fw-semibold link-reset">
          {row.original.id}
        </Link>
      ),
    }),
    columnHelper.accessor('supplier', {
      header: 'Supplier',
      enableColumnFilter: false,
      cell: ({ row }) => (
        <div>
          <h6 className="mb-0 fw-medium fs-base">{row.original.supplier.name}</h6>
          <p className="text-muted fs-xs mb-0">{row.original.supplier.email}</p>
        </div>
      ),
    }),
    columnHelper.accessor('items', {
      header: 'items',
      cell: ({ row }) => <>{row.original.items} Items</>,
    }),
    columnHelper.accessor('orderDate', {
      header: 'Order Date',
      cell: ({ row }) => (
        <>
          {row.original.orderDate}
          <small className="text-muted"> {row.original.orderTime}</small>
        </>
      ),
    }),
    columnHelper.accessor('delivery', {
      header: 'Available Stock',
      cell: ({ row }) => (
        <>
          {row.original.delivery.date}
          <small className="text-muted"> {toPascalCase(row.original.delivery.status)}</small>
        </>
      ),
    }),
    columnHelper.accessor('amount', {
      header: 'Total Amount',
      cell: ({ row }) => <h5 className="fs-base mb-0 fw-medium">{row.original.amount}</h5>,
    }),

    columnHelper.accessor('paymentStatus', {
      header: 'Payment Status',
      filterFn: 'equalsString',
      enableColumnFilter: true,
      cell: ({ row }) => <span className={`badge badge-label ${row.original.paymentStatus === 'pending' ? 'badge-soft-warning' : row.original.paymentStatus === 'paid' ? 'badge-soft-success' : 'badge-soft-danger'} fs-xxs`}>{toPascalCase(row.original.paymentStatus)}</span>,
    }),

    columnHelper.accessor('orderStatus', {
      header: 'Order Status',
      filterFn: 'equalsString',
      enableColumnFilter: true,
      cell: ({ row }) => (
        <span
          className={`badge badge-label ${row.original.orderStatus === 'received' ? 'badge-soft-primary' : row.original.orderStatus === 'processing' ? 'badge-soft-info' : row.original.orderStatus === 'partially-received' ? 'badge-soft-warning' : row.original.orderStatus === 'completed' ? 'badge-soft-success' : row.original.orderStatus === 'cancelled' ? 'badge-soft-danger' : row.original.orderStatus === 'in-progress' ? 'badge-soft-info' : row.original.orderStatus === 'awaiting-shipment' ? 'badge-soft-secondary' : row.original.orderStatus === 'awaiting-delivery' ? 'badge-soft-info' : row.original.orderStatus === 'pending-delivery' ? 'badge-soft-warning' : ''} fs-xxs`}
        >
          {toPascalCase(row.original.orderStatus)}
        </span>
      ),
    }),
    {
      header: 'Actions',
      cell: ({ row }: { row: TableRow<PurchasedOrderType> }) => (
        <div className="d-flex justify-content-center gap-1">
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
              setSelectedRowIds({ [row.id]: true })
            }}
          >
            <Icon icon="trash" className="fs-lg" />
          </Button>
        </div>
      ),
    },
  ]

  const [data, setData] = useState<PurchasedOrderType[]>(() => [...purchasedOrderData])
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({})

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, columnFilters, rowSelection: selectedRowIds },
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

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)

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
            <FormControl type="search" value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Search..." />
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
            <FormSelect value={(table.getColumn('paymentStatus')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('paymentStatus')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)} className="form-control my-1 my-md-0">
              <option value="All">Payment Status</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Overdue">Overdue</option>
            </FormSelect>
            <Icon icon="credit-card" className="app-search-icon text-muted"></Icon>
          </div>

          <div className="app-search">
            <FormSelect value={(table.getColumn('orderStatus')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('orderStatus')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)} className="form-control my-1 my-md-0">
              <option value="All">Order Status</option>
              <option value="Completed">Completed</option>
              <option value="Processing">Processing</option>
              <option value="Partially-Received">Partially Received</option>
              <option value="Pending-Delivery">Pending Delivery</option>
              <option value="Awaiting-Delivery">Awaiting Delivery</option>
              <option value="Awaiting-Shipment">Awaiting Shipment</option>
              <option value="Cancelled">Cancelled</option>
              <option value="In-Progress">In Progress</option>
            </FormSelect>
            <Icon icon="truck" className="app-search-icon text-muted"></Icon>
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
          <Button variant="danger" className="ms-1">
            <Icon icon="plus" className="fs-sm me-2"></Icon>
            Add Order
          </Button>
        </div>
      </CardHeader>

      <DataTable<PurchasedOrderType> table={table} emptyMessage="No records found" />

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

export default PurchaseOrderTable
