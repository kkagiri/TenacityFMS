import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { cn, toPascalCase } from '@/utils/helpers'
import { type ColumnFiltersState, createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, Row as TableRow, Table as TableType, useReactTable } from '@tanstack/react-table'
import { Link } from 'react-router'
import { useState } from 'react'
import AddClientModal from './AddClientModal'
import { clientData, ClientType } from './data'

const columnHelper = createColumnHelper<ClientType>()
const ClientsTable = () => {
  const columns = [
    {
      id: 'select',
      header: ({ table }: { table: TableType<ClientType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }: { row: TableRow<ClientType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
    columnHelper.accessor('user.name', {
      header: 'Clients Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img src={row.original.user.image} alt="" className="size-8 rounded-full" />
          <div>
            <h5 className="font-medium">
              <Link to="" className="hover:text-primary">
                {row.original.user.name}
              </Link>
            </h5>
            <p className="text-default-400 text-xs">{row.original.user.email}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('phone', { header: 'Phone' }),
    columnHelper.accessor('country', {
      header: 'Country',
      filterFn: 'equalsString',
      enableColumnFilter: true,
      cell: ({ row }) => (
        <div className="inline-flex items-center font-bold">
          <img src={row.original.country.flag} alt="flag" className="me-1.25 size-3 rounded-full" />
          {row.original.country.code}
        </div>
      ),
    }),
    columnHelper.accessor('date', { header: 'Enrolled' }),
    columnHelper.accessor('type', {
      header: 'Type',
      filterFn: 'equalsString',
      enableColumnFilter: true,
    }),
    columnHelper.accessor('role', { header: 'Job Title' }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ row }) => <span className={cn('badge  badge-label', row.original.status === 'active' ? 'bg-success/15 text-success' : row.original.status === 'pending' ? 'bg-warning/15 text-warning' : 'bg-danger/15 text-danger')}>{toPascalCase(row.original.status)}</span>,
    }),
    {
      header: 'Actions',
      cell: ({ row }: { row: TableRow<ClientType> }) => (
        <div className="flex justify-center gap-1.5">
          <button type="button" className="btn btn-icon btn-sm border border-default-300 hover:border-default-400">
            <Icon icon="eye" className="text-base" />
          </button>
          <button type="button" className="btn btn-icon btn-sm border border-default-300 hover:border-default-400">
            <Icon icon="edit" className="text-base" />
          </button>
          <button
            className="btn btn-icon btn-sm border border-default-300 hover:border-default-400"
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

  const [data, setData] = useState<ClientType[]>(() => [...clientData])
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
    <div className="card">
      <div className="card-header">
        <div className="flex gap-3">
          <div className="input-icon-group">
            <Icon icon="search" className="input-icon" />
            <input type="search" placeholder="Search clients..." className="form-input" value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} />
          </div>
          <button className="btn bg-secondary btn-icon text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="addClientModal" data-hs-overlay="#addClientModal">
            <Icon icon="plus" className="text-base" />
          </button>
          <button className={cn('btn bg-danger text-white hover:bg-danger-hover', !(Object.keys(selectedRowIds).length > 0) && 'hidden')} type="button" data-hs-overlay="#confirm-delete-modal">
            Delete
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="me-3 font-semibold">Filter By:</span>
          <div className="input-icon-group">
            <Icon icon="world" className="input-icon" />
            <select className="form-select">
              <option value="All">Country</option>
              <option value="US">USA</option>
              <option value="UK">UK</option>
              <option value="AU">Australia</option>
              <option value="DE">Germany</option>
              <option value="IN">India</option>
            </select>
          </div>
          <div className="input-icon-group">
            <Icon icon="briefcase" className="input-icon" />
            <select className="form-select" value={(table.getColumn('type')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('type')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
              <option value="All">Project Type</option>
              <option value="Project">Project</option>
              <option value="Contract">Contract</option>
              <option value="Retainer">Retainer</option>
              <option value="Dashboard">Dashboard</option>
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
      <DataTable<ClientType> table={table} emptyMessage="No records found" />
      {table.getRowModel().rows.length > 0 && (
        <div className="card-footer">
          <TablePagination
            totalItems={totalItems}
            start={start}
            end={end}
            itemsName="clients"
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

      <DeleteConfirmationModal onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="client" />

      <AddClientModal />
    </div>
  )
}

export default ClientsTable
