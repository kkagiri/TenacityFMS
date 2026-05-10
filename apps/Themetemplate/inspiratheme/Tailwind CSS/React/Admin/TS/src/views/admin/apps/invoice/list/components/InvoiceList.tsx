import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { cn, toPascalCase } from '@/utils/helpers'
import { ColumnFiltersState, createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, Row as TableRow, Table as TableType, useReactTable } from '@tanstack/react-table'
import { Link } from 'react-router'
import { useState } from 'react'
import { invoiceData, InvoiceType } from './data'

const columnHelper = createColumnHelper<InvoiceType>()

const InvoiceList = () => {
  const columns = [
    {
      id: 'select',
      header: ({ table }: { table: TableType<InvoiceType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }: { row: TableRow<InvoiceType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
      enableColumnFilter: false,
    },

    columnHelper.accessor('id', {
      header: 'ID',
      cell: ({ row }) => (
        <h5 className="flex items-center gap-1.5">
          <Icon icon="invoice" className={cn(row.original.status === 'paid' && 'text-success', row.original.status === 'pending' && 'text-warning', row.original.status === 'overdue' && 'text-danger', row.original.status === 'draft' && 'text-info')} />
          <Link to="/apps-invoice-details" className="font-semibold hover:text-primary">
            #{row.original.id}
          </Link>
        </h5>
      ),
    }),

    columnHelper.accessor('date', {
      header: 'Create & End Date',
    }),

    columnHelper.accessor('user.name', {
      header: 'Clients Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.user.image ? <img src={row.original.user.image} alt="" className="size-8 rounded-full" /> : <div className="size-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">{row.original.user.name.charAt(0)}</div>}
          <div>
            <h5 className="font-medium">{row.original.user.name}</h5>
            <p className="text-default-400 text-xs">{row.original.user.email}</p>
          </div>
        </div>
      ),
    }),

    columnHelper.accessor('purchase', {
      header: 'Purchase',
    }),

    columnHelper.accessor('amount', {
      header: 'Amount',
      cell: ({ getValue }) => `${getValue()} USD`,
    }),

    columnHelper.accessor('status', {
      header: 'Status',
      filterFn: 'equalsString',
      enableColumnFilter: true,
      cell: ({ row }) => (
        <span
          className={cn(
            'badge badge-label',
            row.original.status === 'paid' && 'bg-success/15 text-success',
            row.original.status === 'pending' && 'bg-warning/15 text-warning',
            row.original.status === 'overdue' && 'bg-danger/15 text-danger',
            row.original.status === 'draft' && 'bg-info/15 text-info'
          )}
        >
          {toPascalCase(row.original.status)}
        </span>
      ),
    }),

    {
      header: 'Actions',
      cell: ({ row }: { row: TableRow<InvoiceType> }) => (
        <div className="flex justify-center gap-1.5">
          <button className="btn btn-icon btn-sm border border-default-300">
            <Icon icon="eye" className="text-base" />
          </button>
          <button className="btn btn-icon btn-sm border border-default-300">
            <Icon icon="edit" className="text-base" />
          </button>
          <button className="btn btn-icon btn-sm border border-default-300" onClick={() => setSelectedRowIds({ [row.id]: true })} data-hs-overlay="#confirm-delete-modal">
            <Icon icon="trash" className="text-base" />
          </button>
        </div>
      ),
    },
  ]

  const [data, setData] = useState<InvoiceType[]>(() => [...invoiceData])
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 8 })
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({})

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
    enableRowSelection: true,
    enableColumnFilters: true,
  })

  const { pageIndex, pageSize } = table.getState().pagination
  const totalItems = table.getFilteredRowModel().rows.length
  const start = pageIndex * pageSize + 1
  const end = Math.min(start + pageSize - 1, totalItems)

  const handleDelete = () => {
    const selectedIds = new Set(Object.keys(selectedRowIds))
    setData((prev) => prev.filter((_, idx) => !selectedIds.has(idx.toString())))
    setSelectedRowIds({})
    setPagination({ ...pagination, pageIndex: 0 })
    window.HSOverlay?.close('#confirm-delete-modal')
  }

  return (
    <>
      <div className="card">
        <div className="card-header flex flex-wrap justify-between">
          <div className="flex gap-2.5">
            <div className="input-icon-group">
              <Icon icon="search" className="input-icon" />
              <input className="form-input" placeholder="Search invoices..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} />
            </div>

            <button className={cn('btn bg-danger text-white hover:bg-danger-hover ', Object.keys(selectedRowIds).length === 0 && 'hidden')} data-hs-overlay="#confirm-delete-modal">
              Delete
            </button>

            <Link to="/apps/invoice/create" className="btn btn-icon rounded-full bg-secondary text-white hover:bg-secondary-hover">
              <Icon icon="plus" className="text-base" />
            </Link>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="me-2.5 font-semibold">Filter By:</span>

            <div className="input-icon-group">
              <Icon icon="circle-check" className="input-icon" />
              <select className="form-select" value={(table.getColumn('status')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('status')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
                <option value="All">Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div>
              <select className="form-select" value={pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))}>
                {[5, 8, 10, 15, 20].map((size) => (
                  <option key={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <DataTable table={table} emptyMessage="No invoices found" />

        {table.getRowModel().rows.length > 0 && (
          <div className="card-footer">
            <TablePagination
              totalItems={totalItems}
              start={start}
              end={end}
              itemsName="invoices"
              pageIndex={pageIndex}
              pageCount={table.getPageCount()}
              canPreviousPage={table.getCanPreviousPage()}
              canNextPage={table.getCanNextPage()}
              previousPage={table.previousPage}
              nextPage={table.nextPage}
              setPageIndex={table.setPageIndex}
              showInfo
            />
          </div>
        )}

        <DeleteConfirmationModal onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="invoices" />
      </div>
    </>
  )
}

export default InvoiceList
