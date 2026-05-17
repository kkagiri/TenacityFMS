import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { cn, toPascalCase } from '@/utils/helpers'
import { ColumnDef, ColumnFiltersState, createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, Row as TableRow, Table as TableType, useReactTable } from '@tanstack/react-table'
import { Link } from 'react-router'
import { useState } from 'react'
import { projectData, type ProjectType } from './data'

const columnHelper = createColumnHelper<ProjectType>()
const ProjectsList = () => {
  const columns: ColumnDef<ProjectType, any>[] = [
    {
      id: 'select',
      maxSize: 45,
      size: 45,
      header: ({ table }: { table: TableType<ProjectType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }: { row: TableRow<ProjectType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
    columnHelper.accessor('title', {
      header: 'Project',
      cell: ({ row }) => {
        return (
          <div className="flex gap-base">
            <div className="bg-light flex size-9 items-center justify-center rounded">
              <Icon icon={row.original.icon} className="text-default-400 size-5" />
            </div>

            <div className="flex-1">
              <h5 className="hover:text-primary mb-1.25 flex items-center">
                <Link to="/apps/projects/details">{row.original.title}</Link>
              </h5>
              <p className="text-default-400 text-2xs">Updated {row.original.updatedTime}</p>
            </div>
          </div>
        )
      },
    }),
    columnHelper.accessor('members', {
      header: 'Members',
      cell: ({ row }) => (
        <div className="flex">
          {row.original.members.map((member, idx) => (
            <div className={cn({ '-ms-1.5': idx != 0 })} key={idx}>
              <img src={member.image} alt="user-img" className="size-6 rounded-full transition-all duration-200 hover:-translate-y-0.5" />
            </div>
          ))}
        </div>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      filterFn: 'equalsString',
      enableColumnFilter: true,
      cell: ({ row }) => (
        <span
          className={cn(
            'badge badge-label',
            row.original.status === 'in-progress'
              ? 'bg-success/15 text-success'
              : row.original.status === 'pending-review'
                ? 'bg-warning/15 text-warning'
                : row.original.status === 'in-review'
                  ? 'bg-info/15 text-info'
                  : row.original.status === 'overdue'
                    ? 'bg-danger/15 text-danger'
                    : row.original.status === 'on-hold'
                      ? 'bg-dark/15 text-dark'
                      : row.original.status === 'completed'
                        ? 'bg-primary/15 text-primary'
                        : row.original.status === 'scheduled'
                          ? 'bg-secondary/15 text-secondary'
                          : 'bg-success/15 text-success'
          )}
        >
          {toPascalCase(row.original.status)}
        </span>
      ),
    }),
    columnHelper.accessor('task', {
      header: 'Tasks',
      cell: ({ row }) => (
        <h5>
          {row.original.task.completed}/{row.original.task.total}&nbsp;
          {row.original.task.new && <span className="badge bg-secondary text-white">+{row.original.task.new} New</span>}
          {row.original.status === 'completed' && <span className="badge bg-success text-white">✓</span>}
        </h5>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor('progress', {
      header: 'Progress',
      cell: ({ row }) => (
        <div className="bg-default-100 h-1.25 w-full overflow-hidden rounded-full">
          <div
            className={cn(
              'h-full',
              row.original.status === 'in-progress' ? 'bg-success' : row.original.status === 'in-review' ? 'bg-info' : row.original.status === 'overdue' ? 'bg-danger' : row.original.status === 'on-hold' ? 'bg-dark' : 'bg-success',
              row.original.status === 'scheduled' && 'bg-secondary',
              row.original.status === 'completed' && 'bg-primary',
              row.original.status === 'pending-review' && 'bg-warning'
            )}
            style={{ width: `${row.original.progress}%` }}
          ></div>
        </div>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor('attachments', {
      header: 'Attechments',
      cell: ({ row }) => <>{row.original.attachments} files</>,
      enableSorting: false,
    }),
    columnHelper.accessor('comments', {
      header: 'Comments',
      cell: ({ row }) => <>{row.original.comments} comments</>,
      enableSorting: false,
    }),
    columnHelper.accessor('dueDate', { header: 'Due Date' }),
    {
      header: 'Actions',
      cell: ({ row }: { row: TableRow<ProjectType> }) => (
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

  const [data, setData] = useState<ProjectType[]>(() => [...projectData])
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
    <div data-table data-table-rows-per-page="8" className="card mb-base">
      <div className="card-header">
        <div className="flex gap-base w-full items-center justify-between">
          <div className="flex gap-2.5">
            <div className="input-icon-group">
              <Icon icon="search" className="input-icon" />
              <input onChange={(e) => setGlobalFilter(e.target.value)} value={globalFilter ?? ''} type="text" className="form-input" placeholder="Search project name..." />
            </div>

            <button className={cn('btn bg-danger text-white hover:bg-danger-hover', !(Object.keys(selectedRowIds).length > 0) && 'hidden')} type="button" data-hs-overlay="#confirm-delete-modal">
              Delete
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 md:flex-nowrap">
            <div className="items-center gap-2.5 md:flex">
              <span className="font-semibold me-2.5">Filter By:</span>

              <div className="input-icon-group">
                <Icon icon="activity" className="input-icon" />
                <select className="form-select" value={(table.getColumn('status')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('status')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
                  <option value="All">Status</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Overdue">Overdue</option>
                  <option value="In Review">In Review</option>
                  <option value="Completed">Completed</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="input-icon-group">
              <Icon icon="calendar-clock" className="input-icon" />
              <select className="form-select" value={(table.getColumn('dueDate')?.getFilterValue() as string) ?? ''} onChange={(e) => table.getColumn('dueDate')?.setFilterValue(e.target.value || undefined)}>
                <option value="All">Deadline</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="Next Month">Next Month</option>
                <option value="No Deadline">No Deadline</option>
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

          <div>
            <nav className="flex items-center gap-x-1">
              <Link to="/apps/projects/grid" className="btn bg-primary/15 text-primary btn-icon hover:bg-primary hover:text-white">
                <Icon icon="category" className="text-lg" />
              </Link>

              <Link to="/apps/projects/list" className="btn bg-primary btn-icon text-white hover:bg-primary-hover">
                <Icon icon="list-check" className="text-lg" />
              </Link>
            </nav>
          </div>
        </div>
      </div>

      <DataTable<ProjectType> table={table} emptyMessage="No records found" />

      {table.getRowModel().rows.length > 0 && (
        <div className="card-footer">
          <TablePagination
            totalItems={totalItems}
            start={start}
            end={end}
            itemsName="projects"
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
    </div>
  )
}

export default ProjectsList
