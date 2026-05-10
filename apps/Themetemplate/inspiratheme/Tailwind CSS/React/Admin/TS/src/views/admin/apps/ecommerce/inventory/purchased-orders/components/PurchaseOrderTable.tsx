import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { cn, toPascalCase } from '@/utils/helpers'
import { ColumnDef, ColumnFiltersState, createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, Row as TableRow, Table as TableType, useReactTable } from '@tanstack/react-table'
import { Link } from 'react-router'
import { useState } from 'react'
import AddPurchaseModal from './AddPurchaseModal'
import { purchasedOrderData, PurchasedOrderType } from './data'

const columnHelper = createColumnHelper<PurchasedOrderType>()

const PurchaseOrderTable = () => {
  const columns: ColumnDef<PurchasedOrderType, any>[] = [
    {
      id: 'select',
      maxSize: 45,
      size: 45,
      header: ({ table }: { table: TableType<PurchasedOrderType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }: { row: TableRow<PurchasedOrderType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
    columnHelper.accessor('id', {
      header: 'Po Number',
      cell: ({ row }) => (
        <Link to="" className="hover:text-primary font-semibold">
          {row.original.id}
        </Link>
      ),
    }),
    columnHelper.accessor('supplier', {
      header: 'Supplier',
      enableColumnFilter: false,
      cell: ({ row }) => (
        <div>
          <h6 className="font-medium">{row.original.supplier.name}</h6>
          <p className="text-default-400 text-xs">{row.original.supplier.email}</p>
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
          <small className="text-default-400 text-2xs"> {row.original.orderTime}</small>
        </>
      ),
    }),
    columnHelper.accessor('delivery', {
      header: 'Available Stock',
      cell: ({ row }) => (
        <>
          {row.original.delivery.date}
          <small className="text-default-400 text-2xs"> {toPascalCase(row.original.delivery.status)}</small>
        </>
      ),
    }),
    columnHelper.accessor('amount', {
      header: 'Total Amount',
      cell: ({ row }) => <h5 className="font-medium">{row.original.amount}</h5>,
    }),

    columnHelper.accessor('paymentStatus', {
      header: 'Payment Status',
      filterFn: 'equalsString',
      enableColumnFilter: true,
      cell: ({ row }) => (
        <span className={cn('badge badge-label font-semibold text-2xs', row.original.paymentStatus === 'pending' ? 'bg-warning/15 text-warning' : row.original.paymentStatus === 'paid' ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger')}>
          {toPascalCase(row.original.paymentStatus)}
        </span>
      ),
    }),

    columnHelper.accessor('orderStatus', {
      header: 'Order Status',
      filterFn: 'equalsString',
      enableColumnFilter: true,
      cell: ({ row }) => (
        <span
          className={cn(
            'badge badge-label font-semibold text-2xs',
            row.original.orderStatus === 'cancelled' ? 'bg-danger/15 text-danger' : row.original.orderStatus === 'in-progress' ? 'bg-warning/15 text-warning' : row.original.orderStatus === 'partially-received' ? 'bg-info/15 text-info' : 'bg-success/15 text-success'
          )}
        >
          {toPascalCase(row.original.orderStatus)}
        </span>
      ),
    }),
    {
      header: 'Actions',
      cell: ({ row }: { row: TableRow<PurchasedOrderType> }) => (
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

  const handleDelete = () => {
    const selectedIds = new Set(Object.keys(selectedRowIds))
    setData((old) => old.filter((_, idx) => !selectedIds.has(idx.toString())))
    setSelectedRowIds({})
    window.HSOverlay?.close('#confirm-delete-modal')
  }

  return (
    <div data-table data-table-rows-per-page="10" className="card">
      <div className="card-header">
        <div className="flex gap-2.5">
          <div className="input-icon-group">
            <Icon icon="search" className="input-icon"></Icon>
            <input value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} type="search" className="form-input" placeholder="Search..." />
          </div>

          <button className={cn('btn bg-danger text-white hover:bg-danger-hover', !(Object.keys(selectedRowIds).length > 0) && 'hidden')} type="button" data-hs-overlay="#confirm-delete-modal">
            Delete
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
          <div className="flex flex-wrap items-center gap-3 md:flex-nowrap">
            <div className="items-center gap-2 md:flex">
              <span className="font-semibold">Filter By:</span>

              <div className="input-icon-group">
                <Icon icon="credit-card" className="input-icon"></Icon>
                <select className="form-select" value={(table.getColumn('paymentStatus')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('paymentStatus')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
                  <option value="All">Payment Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>
            </div>

            <div className="input-icon-group">
              <Icon icon="truck" className="input-icon"></Icon>
              <select className="form-select" value={(table.getColumn('orderStatus')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('orderStatus')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
                <option value="All">Order Status</option>
                <option value="Completed">Completed</option>
                <option value="Processing">Processing</option>
                <option value="Partially Received">Partially Received</option>
                <option value="Pending Delivery">Pending Delivery</option>
                <option value="Awaiting Delivery">Awaiting Delivery</option>
                <option value="Awaiting Shipment">Awaiting Shipment</option>
                <option value="Cancelled">Cancelled</option>
                <option value="In Progress">In Progress</option>
              </select>
            </div>

            <div className="relative">
              <select className="form-select" value={table.getState().pagination.pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))}>
                {[5, 10, 15, 20].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button type="button" className="btn bg-danger text-white hover:bg-danger-hover" aria-haspopup="dialog" aria-expanded="false" aria-controls="addPurchaseOrderModal" data-hs-overlay="#addPurchaseOrderModal">
          <Icon icon="plus" />
          Add New
        </button>
      </div>

      <DataTable<PurchasedOrderType> table={table} emptyMessage="No records found" />

      {table.getRowModel().rows.length > 0 && (
        <div className="card-footer">
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
        </div>
      )}

      <DeleteConfirmationModal onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="product" />

      <AddPurchaseModal />
    </div>
  )
}

export default PurchaseOrderTable
