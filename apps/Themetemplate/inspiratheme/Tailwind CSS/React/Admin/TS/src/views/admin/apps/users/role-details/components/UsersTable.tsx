import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import { cn, toPascalCase } from '@/utils/helpers'
import { ColumnDef, ColumnFiltersState, createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, Row as TableRow, Table as TableType, useReactTable } from '@tanstack/react-table'
import { useState } from 'react'
import { userData, type UserType } from './data'

import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'

const columnHelper = createColumnHelper<UserType>()

const UsersTable = () => {
  const columns: ColumnDef<UserType, any>[] = [
    {
      id: 'select',
      maxSize: 45,
      size: 45,
      header: ({ table }: { table: TableType<UserType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }: { row: TableRow<UserType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
    columnHelper.accessor('id', {
      cell: ({ row }) => (
        <h5 className="m-0">
          <Link to="" className="hover:text-primary">
            {row.original.id}
          </Link>
        </h5>
      ),
    }),
    columnHelper.accessor('name', {
      header: 'User',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div>
            <img src={row.original.image} alt="" className="size-8 rounded-full" />
          </div>
          <div>
            <h5>
              <Link to="" className="hover:text-primary">
                {row.original.name}
              </Link>
            </h5>
            <p className="text-default-400 text-xs">{row.original.email}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('date', {
      header: 'Last Updated',
      cell: ({ row }) => (
        <>
          {row.original.date} <small className="text-default-400">{row.original.time}</small>
        </>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      filterFn: 'equalsString',
      enableColumnFilter: true,
      cell: ({ row }) => <span className={cn('badge  badge-label', row.original.status === 'suspended' ? 'bg-danger/15 text-danger' : row.original.status === 'inactive' ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success')}>{toPascalCase(row.original.status)}</span>,
    }),

    {
      header: 'Actions',
      cell: ({ row }: { row: TableRow<UserType> }) => (
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

  const [data, setData] = useState<UserType[]>(() => [...userData])
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
    <div data-table data-table-rows-per-page="8" className="card">
      <div className="card-header">
        <div className="flex gap-2">
          <div className="input-icon-group">
            <Icon icon="search" className="input-icon" />
            <input type="search" placeholder="Search Users..." className="form-input" />
          </div>

          <button className={cn('btn bg-danger text-white hover:bg-danger-hover', !(Object.keys(selectedRowIds).length > 0) && 'hidden')} type="button" data-hs-overlay="#confirm-delete-modal">
            Delete
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="items-center gap-3 md:flex">
            <span className="me-3 font-semibold text-nowrap">Filter By:</span>
          </div>

          <div className="input-icon-group">
            <Icon icon="user-check" className="input-icon" />
            <select className="form-select" value={(table.getColumn('status')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('status')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
              <option value="">Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
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

          <button className="btn bg-secondary text-white hover:bg-secondary-hover" type="button" aria-haspopup="dialog" aria-expanded="false" data-hs-overlay="#addUserModal">
            Add User
          </button>
        </div>
      </div>

      <DataTable<UserType> table={table} emptyMessage="No records found" />
      {table.getRowModel().rows.length > 0 && (
        <div className="card-footer">
          <TablePagination
            totalItems={totalItems}
            start={start}
            end={end}
            itemsName="roles"
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

      <DeleteConfirmationModal onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="row" />

      <div id="addUserModal" className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto" role="dialog" tabIndex={-1} aria-labelledby="addUserModalLabel">
        <div className="hs-overlay-animation-target hs-overlay-open:scale-100 hs-overlay-open:opacity-100 m-3 flex max-w-sm scale-95 items-center opacity-0 transition-all duration-200 ease-in-out md:mx-auto md:w-full md:max-w-2xl lg:max-w-3xl">
          <div className="card pointer-events-auto flex w-full flex-col">
            <div className="border-default-300 flex items-center justify-between border-b p-5">
              <h3 id="addUserModalLabel" className="text-sm">
                Add New User
              </h3>

              <button type="button" aria-label="Close" data-hs-overlay="#addUserModal">
                <Icon icon="x" className="size-5" />
              </button>
            </div>

            <div className="card-body overflow-y-auto">
              <div className="grid grid-cols-2 gap-base">
                <div>
                  <label htmlFor="userFullName" className="form-label">
                    Full Name
                  </label>
                  <input type="text" className="form-input" id="userFullName" placeholder="Enter full name" required />
                </div>

                <div>
                  <label htmlFor="userEmail" className="form-label">
                    Email Address
                  </label>
                  <input type="email" className="form-input" id="userEmail" placeholder="Enter email" required />
                </div>

                <div>
                  <label htmlFor="userRole" className="form-label">
                    Role
                  </label>
                  <select className="form-input" id="userRole" required>
                    <option value="">Select role</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Developer">Developer</option>
                    <option value="Support Lead">Support Lead</option>
                    <option value="Security Officer">Security Officer</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="userStatus" className="form-label">
                    Status
                  </label>
                  <select className="form-input" id="userStatus" required>
                    <option value="">Select status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="userAvatar" className="form-label">
                    User Avatar
                  </label>
                  <input type="file" name="file-input" id="userAvatar" className="form-input" />
                  <small className="text-default-400 text-xs">Optional: Upload avatar image</small>
                </div>
              </div>
            </div>

            <div className="border-default-300 flex items-center justify-end gap-x-2 border-t p-4">
              <button type="button" className="btn bg-light hover:text-primary" data-hs-overlay="#addUserModal">
                Cancel
              </button>

              <button type="button" className="btn bg-primary text-white hover:bg-primary-hover">
                Add User
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default UsersTable
