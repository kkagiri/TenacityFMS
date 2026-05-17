import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { toPascalCase } from '@/utils/helpers'
import { createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { useState } from 'react'
import { Button, Card, CardFooter, CardHeader, FormControl, FormSelect } from 'react-bootstrap'
import { warehouseData } from './data'
const columnHelper = createColumnHelper()
const WarehouseTable = () => {
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
    columnHelper.accessor('id', {
      header: 'Id',
      cell: ({ row }) => <h5 className="fs-sm mb-0">{row.original.id}</h5>,
    }),
    columnHelper.accessor('name', {
      header: 'Name',
    }),
    columnHelper.accessor('location', {
      header: 'Location',
      cell: ({ row }) => (
        <div className="d-flex align-items-center gap-2">
          <Icon icon="map-pin" className="text-muted fs-sm" />
          <span>{row.original.location}</span>
        </div>
      ),
    }),
    columnHelper.accessor('user', {
      header: 'Manager',
      cell: ({ row }) => (
        <div className="d-flex align-items-center gap-2">
          <div className="avatar avatar-sm">
            <img src={row.original.user.image} alt={row.original.user.name} className="img-fluid rounded-circle" />
          </div>
          <div>
            <h6 className="mb-0 fw-semibold">{row.original.user.name}</h6>
            <p className="text-muted fs-xs mb-0">{row.original.user.email}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('phone', {
      header: 'Contact',
    }),
    columnHelper.accessor('area', {
      header: 'Capacity',
    }),
    columnHelper.accessor('availableStock', {
      header: 'Avail. Stock',
      cell: ({ row }) => <>{row.original.availableStock} units</>,
    }),
    columnHelper.accessor('shippingStock', {
      header: 'Stock Shipping',
      cell: ({ row }) => <>{row.original.shippingStock} units</>,
    }),
    columnHelper.accessor('revenue', {
      header: 'Revenue',
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      filterFn: 'equalsString',
      enableColumnFilter: true,
      cell: ({ row }) => <span className={`badge ${row.original.status === 'closed' ? 'badge-soft-danger' : row.original.status === 'maintenance' ? 'badge-soft-warning' : 'badge-soft-success'} fs-xxs`}>{toPascalCase(row.original.status)}</span>,
    }),
    {
      header: 'Actions',
      cell: ({ row }) => (
        <div className="d-flex gap-1">
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
  const [data, setData] = useState(() => [...warehouseData])
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [selectedRowIds, setSelectedRowIds] = useState({})
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      rowSelection: selectedRowIds,
    },
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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const toggleDeleteModal = () => {
    setShowDeleteModal(!showDeleteModal)
  }
  const handleDelete = () => {
    const selectedIds = new Set(Object.keys(selectedRowIds))
    setData((old) => old.filter((_, idx) => !selectedIds.has(idx.toString())))
    setSelectedRowIds({})
    setShowDeleteModal(false)
  }
  return (
    <Card>
      <CardHeader className="border-light justify-content-between">
        <div className="d-flex gap-2">
          <div className="app-search">
            <FormControl value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} type="search" placeholder="Search..." />
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
            <FormSelect value={table.getColumn('status')?.getFilterValue() ?? 'All'} onChange={(e) => table.getColumn('status')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)} className="form-control my-1 my-md-0">
              <option value="All">Warehouse Status</option>
              <option value="Operational">Operational</option>
              <option value="Maintenance">Under Maintenance</option>
              <option value="Closed">Closed</option>
            </FormSelect>
            <Icon icon="building" className="app-search-icon text-muted"></Icon>
          </div>

          <div className="app-search">
            <FormSelect value={table.getColumn('location')?.getFilterValue() ?? 'All'} onChange={(e) => table.getColumn('location')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)} className="form-control my-1 my-md-0">
              <option value="All">Location</option>
              <option value="New York, USA">New York</option>
              <option value="Boston, USA">Boston</option>
              <option value="Los Angeles, USA">Los Angeles</option>
              <option value="Berlin, Germany">Berlin</option>
              <option value="Singapore">Singapore</option>
              <option value="Dubai, UAE">Dubai</option>
            </FormSelect>
            <Icon icon="map-pin" className="app-search-icon text-muted"></Icon>
          </div>

          <div>
            <FormSelect value={table.getState().pagination.pageSize} className="form-control my-1 my-md-0" onChange={(e) => table.setPageSize(Number(e.target.value))}>
              {[5, 8, 10, 15, 20].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </FormSelect>
          </div>
        </div>

        <div className="d-flex gap-1">
          <Button variant="danger" className="ms-1">
            <Icon icon="plus" className="fs-sm me-2"></Icon> Add New
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
            itemsName="orders"
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

      <DeleteConfirmationModal show={showDeleteModal} onHide={toggleDeleteModal} onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="order" />
    </Card>
  )
}
export default WarehouseTable
