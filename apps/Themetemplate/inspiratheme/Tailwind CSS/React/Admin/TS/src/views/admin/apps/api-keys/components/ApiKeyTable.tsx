import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { cn, toPascalCase } from '@/utils/helpers'
import { type ColumnFiltersState, createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, Row as TableRow, Table as TableType, useReactTable } from '@tanstack/react-table'
import { useState } from 'react'
import ApiModal from './ApiModal'
import { apiClientsData, ApiClientType } from './data'

const columnHelper = createColumnHelper<ApiClientType>()

const ApiKeyTable = () => {
  const columns = [
    {
      id: 'select',
      header: ({ table }: { table: TableType<ApiClientType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }: { row: TableRow<ApiClientType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
    columnHelper.accessor('name', { header: 'Name' }),
    columnHelper.accessor('author', {
      header: 'Created By',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img src={row.original.image} className="size-6 rounded-full" alt="user-avatar" />
          <div>
            <h5 data-sort="name" className="text-sm font-medium text-nowrap">
              {row.original.author}
            </h5>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('apiKey', {
      header: 'Api Key',
      cell: ({ row }) => {
        const apiKey = row.original.apiKey

        const handleCopy = async () => {
          try {
            await navigator.clipboard.writeText(apiKey)
            console.log('Copied:', apiKey)
          } catch (err) {
            console.error('Copy failed', err)
          }
        }

        return (
          <div className="input-group">
            <input type="text" className="form-input form-input-sm" readOnly value={apiKey} />
            <button className="btn btn-sm btn-icon border-default-300" type="button" onClick={handleCopy}>
              <Icon icon="copy" className="text-lg" />
            </button>
          </div>
        )
      },
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      filterFn: 'equalsString',
      enableColumnFilter: true,
      cell: ({ row }) => <span className={cn('badge  badge-label', row.original.status === 'active' ? 'bg-success/15 text-success' : row.original.status === 'pending' ? 'bg-warning/15 text-warning' : 'bg-danger/15 text-danger')}>{toPascalCase(row.original.status)}</span>,
    }),
    columnHelper.accessor('keyUsage', {
      header: 'Usage',
      filterFn: 'equalsString',
      enableColumnFilter: true,
      cell: ({ row }) => (
        <>
          {row.original.keyUsage} / {row.original.totalKeys}
        </>
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created At',
    }),
    columnHelper.accessor('expiresAt', {
      header: 'Expires At',
    }),
    columnHelper.accessor('region', {
      header: 'Region',
      filterFn: 'equalsString',
      enableColumnFilter: true,
      cell: ({ row }) => (
        <div className="inline-flex items-center gap-1.5 font-bold">
          <img src={row.original.flag} className="size-3.5 rounded-full" alt="flag" />
          {row.original.region}
        </div>
      ),
    }),
    {
      header: 'Actions',
      cell: ({ row }: { row: TableRow<ApiClientType> }) => (
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

  const [data, setData] = useState<ApiClientType[]>(() => [...apiClientsData])
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
        <div className="flex gap-2.5">
          <div className="input-icon-group">
            <Icon icon="search" className="input-icon" />
            <input type="text" placeholder="Search API clients..." className="form-input" value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} />
          </div>
          <button type="button" className="btn btn-icon bg-secondary text-white hover:bg-secondary-hover" aria-haspopup="dialog" aria-expanded="false" aria-controls="addApiKeyModal" data-hs-overlay="#addApiKeyModal">
            <Icon icon="plus" className="text-base" />
          </button>
          <button className={cn('btn bg-danger text-white hover:bg-danger-hover', !(Object.keys(selectedRowIds).length > 0) && 'hidden')} type="button" data-hs-overlay="#confirm-delete-modal">
            Delete
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 md:flex-nowrap">
          <span className="me-2.5 font-semibold text-nowrap">Filter By:</span>
          <div className="input-icon-group">
            <Icon icon="circle-check" className="input-icon" />
            <select className="form-select" value={(table.getColumn('status')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('status')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
              <option value="All">Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Revoked">Revoked</option>
              <option value="Suspended">Suspended</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
          <div className="input-icon-group">
            <Icon icon="world" className="input-icon" />
            <select className="form-select" value={(table.getColumn('region')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('region')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
              <option value="All">Region</option>
              <option value="US">USA</option>
              <option value="UK">UK</option>
              <option value="IN">India</option>
              <option value="DE">Germany</option>
              <option value="AU">Australia</option>
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

      <DataTable<ApiClientType> table={table} emptyMessage="No records found" />

      {table.getRowModel().rows.length > 0 && (
        <div className="card-footer">
          <TablePagination
            totalItems={totalItems}
            start={start}
            end={end}
            itemsName="apis"
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

      <DeleteConfirmationModal onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="apies" />

      <ApiModal />
    </div>
  )
}

export default ApiKeyTable
