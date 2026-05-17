import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { cn, toPascalCase } from '@/utils/helpers'
import { ColumnDef, ColumnFiltersState, createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, Row as TableRow, Table as TableType, useReactTable } from '@tanstack/react-table'
import { Link } from 'react-router'
import { useState } from 'react'
import CreateRefundModal from './CreateRefundModal'
import { refundData, RefundType } from './data'

const columnHelper = createColumnHelper<RefundType>()

const RefundTable = () => {
  const columns: ColumnDef<RefundType, any>[] = [
    {
      id: 'select',
      maxSize: 45,
      size: 45,
      header: ({ table }: { table: TableType<RefundType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }: { row: TableRow<RefundType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
    columnHelper.accessor('orderId', {
      header: 'Order Id',
      cell: ({ row }) => (
        <h5 className="text-sm">
          <Link to="/apps/ecommerce/order/details" className="hover:text-primary">
            {row.original.orderId}
          </Link>
        </h5>
      ),
    }),
    columnHelper.accessor('product', {
      header: 'Product',
      enableColumnFilter: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img src={row.original.product.image} alt="avatar-5" className="size-8 rounded-full" />
          <div>
            <p className="font-medium">{row.original.product.name}</p>
            <p className="text-default-400 text-xs">SKU: {row.original.product.sku}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('customer', {
      header: 'Customer',
      enableColumnFilter: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img src={row.original.customer.image} alt="" className="size-8 rounded-full" />
          <div>
            <h5 className="font-medium">{row.original.customer.name}</h5>
            <p className="text-default-400 text-xs">{row.original.customer.email}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('reason', { header: 'Reason', enableColumnFilter: false }),

    columnHelper.accessor('payment', {
      header: 'Payment',
      enableColumnFilter: true,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img src={row.original.payment.image} alt="" className="h-7" width={28} height={28} />
          {row.original.payment.type === 'card' ? row.original.payment.number : row.original.payment.name}
        </div>
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
        <span
          className={cn(
            'badge badge-label fs-xxs',
            row.original.status === 'rejected' ? 'bg-danger/15 text-danger' : row.original.status === 'pending' ? 'bg-warning/15 text-warning' : row.original.status === 'refunded' ? 'bg-secondary/15 text-secondary' : 'bg-success/15 text-success'
          )}
        >
          {toPascalCase(row.original.status)}
        </span>
      ),
    }),
    columnHelper.accessor('requestedDate', { header: 'Requested', enableColumnFilter: false }),
    columnHelper.accessor('processedDate', {
      header: 'Processed',
      enableColumnFilter: false,
      cell: ({ row }) => (row.original.processedDate ? row.original.processedDate : '-'),
    }),
    {
      header: 'Actions',
      cell: ({ row }: { row: TableRow<RefundType> }) => (
        <div className="flex justify-center gap-1.5">
          <button type="button" className="btn btn-icon btn-sm border border-default-300 text-default-800 hover:border-default-400">
            <Icon icon="check" className="text-base" />
          </button>
          <button type="button" className="btn btn-icon btn-sm border border-default-300 text-default-800 hover:border-default-400">
            <Icon icon="x" className="text-base" />
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
          <div className="hs-dropdown relative inline-flex [--placement:bottom-right]">
            <button type="button" className="hs-dropdown-toggle btn btn-icon btn-sm border border-default-300 text-default-800 hover:border-default-400">
              <Icon icon="dots-vertical" className="text-base" />
            </button>
            <div className="hs-dropdown-menu">
              <div className="space-y-0.5">
                <Link to="" className="text-default-600 hover:bg-default-100 flex items-center gap-3 px-3.75 py-1.5">
                  View order
                </Link>
                <Link to="" className="text-default-600 hover:bg-default-100 flex items-center gap-3 px-3.75 py-1.5">
                  Contact customer
                </Link>
                <hr className="dropdown-divider" />
                <Link to="" className="text-default-600 hover:bg-default-100 flex items-center gap-3 px-3.75 py-1.5">
                  Add note
                </Link>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ]

  const [data, setData] = useState<RefundType[]>(() => [...refundData])
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

  const handleDelete = () => {
    const selectedIds = new Set(Object.keys(selectedRowIds))
    setData((old) => old.filter((_, idx) => !selectedIds.has(idx.toString())))
    setSelectedRowIds({})
    setPagination({ ...pagination, pageIndex: 0 })
    window.HSOverlay?.close('#confirm-delete-modal')
  }
  return (
    <div data-table data-table-rows-per-page={8} className="card">
      <div className="card-header">
        <div className="flex gap-2.5">
          <div className="input-icon-group">
            <Icon icon="search" className="input-icon" />
            <input value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} type="search" className="form-input" placeholder="Search refunds..." />
          </div>
          <button className={cn('btn bg-danger text-white hover:bg-danger-hover', !(Object.keys(selectedRowIds).length > 0) && 'hidden')} type="button" data-hs-overlay="#confirm-delete-modal">
            Delete
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 md:flex-nowrap">
          <div className="items-center gap-2.5 md:flex">
            <span className="font-semibold me-2.5">Filter By:</span>
            <div className="input-icon-group">
              <Icon icon="credit-card-refund" className="input-icon" />
              <select value={(table.getColumn('status')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('status')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)} className="form-select">
                <option value="All">Refund Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
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
        <div className="flex items-center gap-3">
          <button className="btn bg-primary text-white hover:bg-primary-hover" aria-haspopup="dialog" aria-expanded="false" aria-controls="createRefundModal" data-hs-overlay="#createRefundModal">
            <Icon icon="plus" />
            Create Refund
          </button>
        </div>
      </div>
      <DataTable<RefundType> table={table} emptyMessage="No records found" />
      {table.getRowModel().rows.length > 0 && (
        <div className="card-footer">
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
        </div>
      )}

      <DeleteConfirmationModal onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="refund" />

      <CreateRefundModal />
    </div>
  )
}

export default RefundTable
