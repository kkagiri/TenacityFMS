import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { cn, toPascalCase } from '@/utils/helpers'
import { ColumnFiltersState, createColumnHelper, FilterFn, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, Row as TableRow, Table as TableType, useReactTable } from '@tanstack/react-table'
import { Link } from 'react-router'
import { useState } from 'react'
import { orderData, OrderType } from './data'

const columnHelper = createColumnHelper<OrderType>()

const dateRangeFilterFn: FilterFn<any> = (row, columnId, selectedRange) => {
  if (!selectedRange || selectedRange === 'All') return true

  const text = row.getValue<string>(columnId)
  if (!text) return false

  const cellDate = new Date(text)
  if (isNaN(cellDate.getTime())) return false

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  let rangeStart, rangeEnd

  switch (selectedRange) {
    case 'Today':
      return cellDate >= startOfToday && cellDate < endOfToday
    case 'Last 7 Days':
      rangeStart = new Date(now)
      rangeStart.setDate(now.getDate() - 7)
      rangeEnd = endOfToday
      return cellDate >= rangeStart && cellDate < rangeEnd
    case 'Last 30 Days':
      rangeStart = new Date(now)
      rangeStart.setDate(now.getDate() - 30)
      rangeEnd = endOfToday
      return cellDate >= rangeStart && cellDate < rangeEnd
    case 'This Year':
      rangeStart = new Date(now.getFullYear(), 0, 1)
      rangeEnd = new Date(now.getFullYear() + 1, 0, 1)
      return cellDate >= rangeStart && cellDate < rangeEnd
    default:
      return true
  }
}

const OrdersList = () => {
  const columns = [
    {
      id: 'select',
      header: ({ table }: { table: TableType<OrderType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }: { row: TableRow<OrderType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
    columnHelper.accessor('id', {
      header: 'Order ID',
      cell: ({ row }) => (
        <h5 className="text-sm font-medium">
          <Link to="/apps/ecommerce/order-details" className="hover:text-primary">
            #{row.original.id}
          </Link>
        </h5>
      ),
    }),
    columnHelper.accessor('date', {
      header: 'Date',
      filterFn: dateRangeFilterFn,
      enableColumnFilter: true,
      cell: ({ row }) => (
        <>
          {row.original.date} <small className="text-default-400">{row.original.time}</small>
        </>
      ),
    }),
    columnHelper.accessor('customer', {
      header: 'Customer',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div>
            <img src={row.original.customer.image} alt="avatar-2" className="size-8 rounded-full" />
          </div>
          <div>
            <h5 className="font-medium">{row.original.customer.name}</h5>
            <p className="text-default-400 text-xs">{row.original.customer.email}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('amount', {
      header: 'Amount',
    }),
    columnHelper.accessor('paymentStatus', {
      header: 'Payment Status',
      filterFn: 'equalsString',
      enableColumnFilter: true,
      cell: ({ row }) => (
        <div className={cn('flex items-center gap-1 font-semibold', row.original.paymentStatus === 'paid' ? 'text-success' : row.original.paymentStatus === 'pending' ? 'text-warning' : 'text-danger')}>
          <Icon icon="circle-filled" className={cn(row.original.paymentStatus === 'paid' ? 'text-success' : row.original.paymentStatus === 'pending' ? 'text-warning' : 'text-danger')} />
          {toPascalCase(row.original.paymentStatus)}
        </div>
      ),
    }),
    columnHelper.accessor('orderStatus', {
      header: 'Order Status',
      filterFn: 'equalsString',
      enableColumnFilter: true,
      cell: ({ row }) => <span className={cn('badge', row.original.orderStatus === 'cancelled' ? 'bg-danger/15 text-danger' : row.original.orderStatus === 'processing' ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success')}>{toPascalCase(row.original.orderStatus)}</span>,
    }),
    columnHelper.accessor('paymentMethod', {
      header: 'Payment Method',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <img src={row.original.paymentMethod.image} alt="" className="h-7" height={28} width={28} />
          {row.original.paymentMethod.type === 'card' ? row.original.paymentMethod.cardNumber : row.original.paymentMethod.type === 'upi' ? row.original.paymentMethod.upiId : row.original.paymentMethod.email}
        </div>
      ),
    }),
    {
      id: 'action',
      header: () => <div className="mx-auto">Actions</div>,
      cell: ({ row }: { row: TableRow<OrderType> }) => (
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

  const [data, setData] = useState<OrderType[]>(() => [...orderData])
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
      dateRange: dateRangeFilterFn,
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
            <input type="text" className="form-input" placeholder="Search order..." />
          </div>
          <button className={cn('btn bg-danger text-white hover:bg-danger-hover', !(Object.keys(selectedRowIds).length > 0) && 'hidden')} type="button" data-hs-overlay="#confirm-delete-modal">
            Delete
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 lg:flex-nowrap">
          <div className="flex flex-wrap items-center gap-2.5 md:flex-nowrap">
            <div className="items-center gap-2.5 md:flex">
              <span className="font-semibold text-nowrap me-2.5">Filter By:</span>
              <div className="input-icon-group">
                <Icon icon="credit-card" className="input-icon" />
                <select className="form-select" value={(table.getColumn('paymentStatus')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('paymentStatus')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
                  <option value="All">Payment Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>
            </div>
            <div className="input-icon-group">
              <Icon icon="truck" className="input-icon" />
              <select className="form-select" value={(table.getColumn('orderStatus')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('orderStatus')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
                <option value="All">Delivery Status</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="input-icon-group">
              <Icon icon="calendar" className="input-icon" />
              <select className="form-select" value={(table.getColumn('date')?.getFilterValue() as string) ?? ''} onChange={(e) => table.getColumn('date')?.setFilterValue(e.target.value || undefined)}>
                <option value="All">Date Range</option>
                <option value="Today">Today</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="This Year">This Year</option>
              </select>
            </div>
            <div>
              <select className="form-select" value={table.getState().pagination.pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))}>
                {[5, 8, 10, 15, 20].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/apps/ecommerce/order-add" className="btn bg-danger text-white hover:bg-danger-hover">
            <Icon icon="plus" />
            Add Order
          </Link>
        </div>
      </div>
      <DataTable<OrderType> table={table} emptyMessage="No records found" />
      {table.getRowModel().rows.length > 0 && (
        <div className="card-footer">
          <TablePagination
            totalItems={totalItems}
            start={start}
            end={end}
            itemsName="orders"
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

      <DeleteConfirmationModal onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="orders" />
    </div>
  )
}

export default OrdersList
