import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { useState } from 'react'
import { Button, Card, CardFooter, CardHeader, FormCheck, FormControl, FormSelect } from 'react-bootstrap'
import { useToggle } from 'usehooks-ts'
import AddAttributeModal from './AddAttributeModal'
import { attributeData } from './data'
const columnHelper = createColumnHelper()
const AttributeTable = () => {
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
    columnHelper.accessor('attribute', {
      header: 'Attribute Name',
      cell: ({ row }) => <h6 className="mb-0 fw-medium fs-base">{row.original.attribute}</h6>,
    }),
    columnHelper.accessor('inputType', {
      header: 'Type',
    }),
    columnHelper.accessor('options', {
      header: 'Type',
      cell: ({ row }) => <span className="text-muted">{row.original.options.join(', ')}</span>,
    }),
    columnHelper.accessor('isActive', {
      header: 'Status',
      cell: ({ row }) => <FormCheck type="switch" defaultChecked={row.original.isActive} />,
    }),
    columnHelper.accessor('createdDate', {
      header: 'Created Date',
      cell: ({ row }) => (
        <>
          {row.original.createdDate}
          <small className="text-muted">{row.original.createdTime}</small>
        </>
      ),
    }),
    columnHelper.accessor('updatedDate', {
      header: 'Last Updated',
      cell: ({ row }) => (
        <>
          {row.original.updatedDate}
          <small className="text-muted">{row.original.updatedTime}</small>
        </>
      ),
    }),
    columnHelper.accessor('user', {
      header: 'Last Modified By',
      cell: ({ row }) => (
        <div className="d-flex align-items-center gap-2">
          <div className="avatar avatar-sm">
            <img src={row.original.user.image} alt={row.original.user.name} className="img-fluid rounded-circle" />
          </div>
          <div>
            <h6 className="mb-0 fw-semibold">{row.original.user.name}</h6>
            <p className="text-muted fs-xs mb-0">{row.original.user.role}</p>
          </div>
        </div>
      ),
    }),
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="d-flex justify-content-center gap-1">
          <Button size="sm" variant="light" className="btn-icon rounded-circle">
            <Icon icon="eye" className="fs-lg" />
          </Button>
          <Button size="sm" variant="light" className="btn-icon rounded-circle">
            <Icon icon="edit" className="fs-lg" />
          </Button>
          <Button
            size="sm"
            variant="light"
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
  const [data, setData] = useState(() => [...attributeData])
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 8,
  })
  const [selectedRowIds, setSelectedRowIds] = useState({})
  const [showModal, toggleModal] = useToggle()
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
    onRowSelectionChange: setSelectedRowIds,
    onPaginationChange: setPagination,
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
            <FormControl type="search" value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Search attributes..." />
            <Icon icon="search" className="app-search-icon text-muted" />
          </div>
          {Object.keys(selectedRowIds).length > 0 && (
            <Button variant="danger" onClick={toggleDeleteModal}>
              Delete
            </Button>
          )}
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <span className="me-2 fw-semibold">Filter By:</span>

          <div className="app-search">
            <FormSelect value={table.getColumn('inputType')?.getFilterValue() ?? 'All'} onChange={(e) => table.getColumn('inputType')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)} className="form-control my-1 my-md-0">
              <option value="All">Type</option>
              <option value="Dropdown">Dropdown</option>
              <option value="Text">Text</option>
              <option value="Number">Number</option>
            </FormSelect>
            <Icon icon="wand" className="app-search-icon text-muted"></Icon>
          </div>

          <div>
            <FormSelect className="form-control my-1 my-md-0" value={table.getState().pagination.pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))}>
              {[5, 8, 10, 15, 20].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </FormSelect>
          </div>
        </div>

        <div className="d-flex gap-1">
          <Button variant="danger" className="ms-1" onClick={toggleModal}>
            <Icon icon="plus" className="fs-sm me-2"></Icon>
            Add Attribute
          </Button>
        </div>
      </CardHeader>

      <DataTable table={table} emptyMessage="No records found" />

      {table.getRowModel().rows.length > 0 && (
        <CardFooter className="border-0">
          <TablePagination
            totalItems={totalItems}
            start={start}
            end={end}
            itemsName="attributes"
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

      <DeleteConfirmationModal show={showDeleteModal} onHide={toggleDeleteModal} onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="attribute" />
      <AddAttributeModal show={showModal} handleClose={toggleModal} />
    </Card>
  )
}
export default AttributeTable
