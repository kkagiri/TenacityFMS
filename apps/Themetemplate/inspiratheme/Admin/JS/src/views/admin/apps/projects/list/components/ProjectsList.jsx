import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { toPascalCase } from '@/utils/helpers'
import { createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { isAfter, isSameDay, isSameYear, parse, startOfDay, subDays } from 'date-fns'
import { useState } from 'react'
import { Button, Card, CardFooter, CardHeader, FormSelect, ProgressBar } from 'react-bootstrap'
import { Link } from 'react-router'
import { projectList } from './data'
function getVariant(status) {
  return status === 'in-progress' ? 'success' : status === 'in-review' ? 'info' : status === 'overdue' ? 'danger' : status === 'on-hold' ? 'dark' : 'primary'
}
const dueDateFilterFn = (row, columnId, value) => {
  if (!value || value === 'All') return true
  const dueDateString = row.getValue(columnId)
  const dueDate = parse(dueDateString, 'd MMM, yyyy', new Date())
  if (isNaN(dueDate.getTime())) return false
  const today = startOfDay(new Date())
  if (value === 'Today') {
    return isSameDay(dueDate, today)
  } else if (value === 'Last 7 Days') {
    return isAfter(dueDate, subDays(today, 7))
  } else if (value === 'Last 30 Days') {
    return isAfter(dueDate, subDays(today, 30))
  } else if (value === 'This Year') {
    return isSameYear(dueDate, today)
  }
  return true
}
const columnHelper = createColumnHelper()
const ProjectsList = () => {
  const columns = [
    {
      id: 'select',
      maxSize: 45,
      size: 45,
      header: ({ table }) => <input type="checkbox" className="form-check-input form-check-input-light fs-14" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }) => <input type="checkbox" className="form-check-input form-check-input-light fs-14" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
    columnHelper.accessor('title', {
      header: 'Project',
      cell: ({ row }) => {
        return (
          <div className="d-flex">
            <div className="avatar-md me-3">
              <span className="avatar-title text-bg-light rounded">
                <Icon icon={row.original.icon} className="fs-20 text-muted" />
              </span>
            </div>
            <div>
              <h5 className="mb-1 d-flex align-items-center">
                <Link to="/apps/projects/details" className="link-reset">
                  {row.original.title}
                </Link>
              </h5>
              <p className="text-muted mb-0 fs-xxs">Updated {row.original.updatedTime}</p>
            </div>
          </div>
        )
      },
    }),
    columnHelper.accessor('members', {
      header: 'Members',
      cell: ({ row }) => (
        <div className="avatar-group avatar-group-xs">
          {row.original.members.map((member, idx) => (
            <div className="avatar" key={idx}>
              <img src={member.image} alt="user" className="rounded-circle avatar-xs" height={24} width={24} />
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
      cell: ({ row }) => <span className={`badge badge-soft-${getVariant(row.original.status)} fs-xxs badge-label`}>{toPascalCase(row.original.status)}</span>,
    }),
    columnHelper.accessor('task', {
      header: 'Tasks',
      cell: ({ row }) => (
        <h5 className="fs-base mb-0 fw-medium">
          {row.original.task.completed}/{row.original.task.total}&nbsp;
          {row.original.task.new && (
            <span className="badge bg-secondary">
              +{row.original.task.new}
              New
            </span>
          )}
          {row.original.status === 'completed' && <span className="badge bg-success">✓</span>}
        </h5>
      ),
      enableSorting: false,
    }),
    columnHelper.accessor('progress', {
      header: 'Progress',
      cell: ({ row }) => (
        <ProgressBar
          variant={getVariant(row.original.status)}
          now={row.original.progress}
          style={{
            height: '5px',
          }}
        />
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
    columnHelper.accessor('dueDate', {
      header: 'Due Date',
      filterFn: dueDateFilterFn,
    }),
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="d-flex gap-1">
          <Button variant="light" size="sm" className="btn-icon rounded-circle">
            <Icon icon="eye" className="fs-lg" />
          </Button>
          <Button variant="light" size="sm" className="btn-icon rounded-circle">
            <Icon icon="edit" className="fs-lg" />
          </Button>
          <Button
            variant="light"
            size="sm"
            className="btn-icon rounded-circle"
            onClick={() => {
              toggleDeleteModal()
              setSelectedRowIds({
                [row.id]: true,
              })
            }}
          >
            <Icon icon="trash" className="fs-lg" />
          </Button>
        </div>
      ),
    },
  ]
  const [data, setData] = useState(() => [...projectList])
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 8,
  })
  const [selectedRowIds, setSelectedRowIds] = useState({})
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
    enableColumnFilters: true,
    enableRowSelection: true,
    filterFns: {
      priceRange: dueDateFilterFn,
    },
  })
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const totalItems = table.getFilteredRowModel().rows.length
  const start = pageIndex * pageSize + 1
  const end = Math.min(start + pageSize - 1, totalItems)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const toggleDeleteModal = () => {
    setShowDeleteModal(!showDeleteModal)
  }
  const handleDelete = () => {
    const selectedIds = new Set(Object.keys(selectedRowIds))
    setData((old) => old.filter((_, idx) => !selectedIds.has(idx.toString())))
    setSelectedRowIds({})
    setPagination({
      ...pagination,
      pageIndex: 0,
    })
    setShowDeleteModal(false)
  }
  return (
    <Card>
      <CardHeader className="border-light justify-content-between">
        <div className="d-flex gap-2">
          <div className="app-search">
            <input onChange={(e) => setGlobalFilter(e.target.value)} value={globalFilter ?? ''} type="search" className="form-control" placeholder="Search project name..." />
            <Icon icon="search" className="app-search-icon text-muted" />
          </div>
          {Object.keys(selectedRowIds).length > 0 && (
            <Button variant="danger" onClick={toggleDeleteModal}>
              Delete
            </Button>
          )}
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="me-2 fw-semibold">Filter By:</span>

          <div className="app-search">
            <FormSelect value={table.getColumn('status')?.getFilterValue() ?? 'All'} onChange={(e) => table.getColumn('status')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)} className="form-control my-1 my-md-0">
              <option value="All">Status</option>
              <option value="In-Progress">In Progress</option>
              <option value="Pending-Review">Pending Review</option>
              <option value="Overdue">Overdue</option>
              <option value="In-Review">In Review</option>
              <option value="Completed">Completed</option>
              <option value="Scheduled">Scheduled</option>
              <option value="On-Hold">On Hold</option>
              <option value="Pending">Pending</option>
            </FormSelect>
            <Icon icon="activity" className="app-search-icon text-muted" />
          </div>

          <div className="app-search">
            <FormSelect value={table.getColumn('dueDate')?.getFilterValue() ?? ''} onChange={(e) => table.getColumn('dueDate')?.setFilterValue(e.target.value || undefined)} className="form-control my-1 my-md-0">
              <option value="All">Deadline</option>
              <option value="Today">Today</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="This Year">This Year</option>
            </FormSelect>
            <Icon icon="calendar-clock" className="app-search-icon text-muted" />
          </div>

          <div>
            <FormSelect value={table.getState().pagination.pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))} className="form-control my-1 my-md-0">
              {[5, 8, 10, 15, 20].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </FormSelect>
          </div>
        </div>

        <div className="d-flex gap-1">
          <Link to="/apps/projects/grid" className="btn btn-soft-primary btn-icon">
            <Icon icon="category" className="fs-lg" />
          </Link>
          <Link to="/apps/projects/list" className="btn btn-primary btn-icon">
            <Icon icon="list-check" className="fs-lg" />
          </Link>
        </div>
      </CardHeader>

      <DataTable table={table} emptyMessage="No records found" />
      {table.getRowModel().rows.length > 0 && (
        <CardFooter className="border-0">
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
        </CardFooter>
      )}

      <DeleteConfirmationModal show={showDeleteModal} onHide={toggleDeleteModal} onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="row" />
    </Card>
  )
}
export default ProjectsList
