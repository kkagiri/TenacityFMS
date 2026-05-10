import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { cn, toPascalCase } from '@/utils/helpers'
import { ColumnDef, ColumnFiltersState, createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, Row as TableRow, Table as TableType, useReactTable } from '@tanstack/react-table'
import { useState } from 'react'
import AddWarehouseModal from './AddWarehouseModal'
import { warehouseData, type WarehouseType } from './data'

const columnHelper = createColumnHelper<WarehouseType>()
const WarehouseTable = () => {
  const columns: ColumnDef<WarehouseType, any>[] = [
    {
      id: 'select',
      maxSize: 45,
      size: 45,
      header: ({ table }: { table: TableType<WarehouseType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }: { row: TableRow<WarehouseType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
    columnHelper.accessor('id', { header: 'Id', cell: ({ row }) => <h5 className="fs-sm mb-0">{row.original.id}</h5> }),
    columnHelper.accessor('name', { header: 'Name' }),
    columnHelper.accessor('location', {
      header: 'Location',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <Icon icon="map-pin" className="text-default-500" />
          <span>{row.original.location}</span>
        </div>
      ),
    }),
    columnHelper.accessor('user', {
      header: 'Manager',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="size-8">
            <img src={row.original.user.image} alt={row.original.user.name} className="rounded-full" />
          </div>
          <div>
            <h6 className="text-xs">{row.original.user.name}</h6>
            <p className="text-default-400 text-xs">{row.original.user.email}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('phone', { header: 'Contact' }),
    columnHelper.accessor('area', { header: 'Capacity' }),

    columnHelper.accessor('availableStock', {
      header: 'Avail. Stock',
      cell: ({ row }) => <>{row.original.availableStock} units</>,
    }),

    columnHelper.accessor('shippingStock', {
      header: 'Stock Shipping',
      cell: ({ row }) => <>{row.original.shippingStock} units</>,
    }),
    columnHelper.accessor('revenue', { header: 'Revenue' }),
    columnHelper.accessor('status', {
      header: 'Status',
      filterFn: 'equalsString',
      enableColumnFilter: true,
      cell: ({ row }) => <span className={cn('badge text-2xs', row.original.status === 'closed' ? 'bg-danger/15 text-danger' : row.original.status === 'maintenance' ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success')}>{toPascalCase(row.original.status)}</span>,
    }),

    {
      header: 'Actions',
      cell: ({ row }: { row: TableRow<WarehouseType> }) => (
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

  const [data, setData] = useState<WarehouseType[]>(() => [...warehouseData])
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
    <div data-table data-table-rows-per-page={10} className="card">
      <div className="card-header">
        <div className="flex gap-2.5">
          <div className="input-icon-group">
            <Icon icon="search" className="input-icon" />
            <input value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} type="text" className="form-input" placeholder="Search..." />
          </div>
          <button className={cn('btn bg-danger text-white hover:bg-danger-hover', !(Object.keys(selectedRowIds).length > 0) && 'hidden')} type="button" data-hs-overlay="#confirm-delete-modal">
            Delete
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 lg:flex-nowrap">
          <div className="flex flex-wrap items-center gap-2.5 md:flex-nowrap">
            <div className="items-center gap-2.5 md:flex">
              <span className="text-default-800 font-semibold text-nowrap me-2.5">Filter By:</span>
              <div className="input-icon-group">
                <Icon icon="building" className="input-icon" />
                <select className="form-select" value={(table.getColumn('status')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('status')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
                  <option value="All">Warehouse Status</option>
                  <option value="Operational">Operational</option>
                  <option value="Maintenance">Under Maintenance</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
            <div className="input-icon-group">
              <Icon icon="map-pin" className="input-icon" />
              <select className="form-select" value={(table.getColumn('location')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('location')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
                <option value="All">Location</option>
                <option value="New York, USA">New York</option>
                <option value="Boston, USA">Boston</option>
                <option value="Los Angeles, USA">Los Angeles</option>
                <option value="Berlin, Germany">Berlin</option>
                <option value="Singapore">Singapore</option>
                <option value="Dubai, UAE">Dubai</option>
              </select>
            </div>
            <div className="relative">
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
        <div className="flex gap-1">
          <button className="btn bg-danger text-white hover:bg-danger-hover" aria-haspopup="dialog" aria-expanded="false" aria-controls="addWarehouseModal" data-hs-overlay="#addWarehouseModal">
            <Icon icon="plus" />
            Add New
          </button>
        </div>
      </div>
      <DataTable<WarehouseType> table={table} emptyMessage="No records found" />
      {table.getRowModel().rows.length > 0 && (
        <div className="card-footer">
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
        </div>
      )}

      <DeleteConfirmationModal onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="order" />
      <AddWarehouseModal />
    </div>
  )
}

export default WarehouseTable
