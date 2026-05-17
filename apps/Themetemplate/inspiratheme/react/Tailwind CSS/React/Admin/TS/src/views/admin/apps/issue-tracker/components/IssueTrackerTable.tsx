import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { cn, toPascalCase } from '@/utils/helpers'
import { createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, Row as TableRow, useReactTable } from '@tanstack/react-table'
import { useState } from 'react'
import { issueData, IssueType } from './data'
import IssueDetailModal from './IssueDetailModal'

const columnHelper = createColumnHelper<IssueType>()

const IssueTrackerTable = () => {
  const columns = [
    columnHelper.accessor('status', {
      header: () => null,
      cell: ({ row }) => <span className={cn('badge badge-label text-2xs  text-white', row.original.className)}>{toPascalCase(row.original.status)}</span>,
    }),
    columnHelper.accessor('id', {
      header: () => null,
      cell: ({ row }) => (
        <>
          <span aria-haspopup="dialog" aria-expanded="false" aria-controls="taskDetailsModal" data-hs-overlay="#taskDetailsModal" className="hover:text-primary text-sm font-semibold uppercase">
            {row.original.id}
          </span>
          <p className="text-default-400">{row.original.description}</p>
        </>
      ),
    }),
    columnHelper.accessor('user.name', {
      header: () => null,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img src={row.original.user.image} className="size-6 rounded-full" alt="user" />
          <h5 className="text-default-800">{row.original.user.name}</h5>
        </div>
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: () => null,
      cell: ({ row }) => (
        <>
          <p className="flex items-center gap-1">
            <Icon icon="calendar" />
            <span className="font-semibold">Created:</span>
            {row.original.createdAt}
          </p>
          <p className="flex items-center gap-1">
            <Icon icon="clock" />
            <span className="font-semibold">Due:</span>
            {row.original.dueDate}
          </p>
        </>
      ),
    }),
    columnHelper.accessor('tags', {
      header: () => null,
      cell: ({ row }) => (
        <>
          {row.original.tags.map((tag, idx) => (
            <span key={idx} className="badge badge-label border border-default-300">
              {tag}
            </span>
          ))}
        </>
      ),
    }),
    columnHelper.accessor('progress', {
      header: () => null,
      cell: ({ row }) => (
        <>
          <div className="bg-default-100 h-1.5 w-full rounded-full">
            <div className={cn('h-1.5 rounded-s-full', row.original.className)} role="progressbar" style={{ width: `${row.original.progress}%` }} aria-valuenow={row.original.progress} aria-valuemin={0} aria-valuemax={100}></div>
          </div>
          <small className="text-default-400 text-xs">{row.original.progress}% Complete</small>
        </>
      ),
    }),
    columnHelper.accessor('comments', {
      header: () => null,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Icon icon="message-circle" className="text-default-400 me-1.5" />
          {row.original.comments} comments
        </div>
      ),
    }),
    columnHelper.accessor('files', {
      header: () => null,
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <Icon icon="paperclip" className="text-default-400 me-1.5" />
          {row.original.files} files
        </div>
      ),
    }),
    {
      header: 'Actions',
      cell: ({ row }: { row: TableRow<IssueType> }) => (
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

  const [data, setData] = useState<IssueType[]>(() => [...issueData])
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 8 })

  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({})

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, pagination, rowSelection: selectedRowIds },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onRowSelectionChange: setSelectedRowIds,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: 'includesString',
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
        <div className="input-icon-group">
          <Icon icon="search" className="input-icon" />
          <input type="text" placeholder="Search issues..." className="form-input" value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} />
        </div>
        <div>
          <button className="btn bg-success text-white hover:bg-success-hover">Add New Issues</button>
        </div>
      </div>
      <div className="card-body">
        <DataTable<IssueType> table={table} emptyMessage="No records found" showHeaders={false} />
      </div>
      {table.getRowModel().rows.length > 0 && (
        <div className="card-footer">
          <TablePagination
            totalItems={totalItems}
            start={start}
            end={end}
            itemsName="issues"
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

      <DeleteConfirmationModal onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="issue" />

      <IssueDetailModal />
    </div>
  )
}

export default IssueTrackerTable
