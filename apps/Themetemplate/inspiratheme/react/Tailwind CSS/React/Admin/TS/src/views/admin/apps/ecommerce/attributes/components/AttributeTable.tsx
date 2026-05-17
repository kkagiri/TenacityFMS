import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { ColumnDef, ColumnFiltersState, createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, Row as TableRow, Table as TableType, useReactTable } from '@tanstack/react-table'
import { useState } from 'react'
import AddAttributeModal from './AddAttributeModal'
import { attributeData, AttributeType } from './data'

const columnHelper = createColumnHelper<AttributeType>()

const AttributeTable = () => {
  const columns: ColumnDef<AttributeType, any>[] = [
    {
      id: 'select',
      maxSize: 45,
      size: 45,
      header: ({ table }: { table: TableType<AttributeType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }: { row: TableRow<AttributeType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
    columnHelper.accessor('attribute', {
      header: 'Attribute Name',
      cell: ({ row }) => <h6 className="font-medium">{row.original.attribute}</h6>,
    }),
    columnHelper.accessor('inputType', {
      header: 'Type',
    }),
    columnHelper.accessor('options', {
      header: 'Type',
      cell: ({ row }) => <span className="text-default-400">{row.original.options.join(', ')}</span>,
    }),
    columnHelper.accessor('isActive', {
      header: 'Status',
      cell: ({ row }) => <input className="form-switch" type="checkbox" defaultChecked={row.original.isActive} />,
    }),

    columnHelper.accessor('createdDate', {
      header: 'Created Date',
      cell: ({ row }) => (
        <>
          {row.original.createdDate}
          <small className="text-default-400 text-xs">{row.original.createdTime}</small>
        </>
      ),
    }),
    columnHelper.accessor('updatedDate', {
      header: 'Last Updated',
      cell: ({ row }) => (
        <>
          {row.original.updatedDate}
          <small className="text-default-400 text-xs">{row.original.updatedTime}</small>
        </>
      ),
    }),

    columnHelper.accessor('user', {
      header: 'Last Modified By',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="size-8">
            <img src={row.original.user.image} alt={row.original.user.name} className="rounded-full" />
          </div>
          <div>
            <h6 className="text-xs">{row.original.user.name}</h6>
            <p className="text-default-400 text-xs">{row.original.user.role}</p>
          </div>
        </div>
      ),
    }),
    {
      header: 'Actions',
      cell: ({ row }: { row: TableRow<AttributeType> }) => (
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

  const [data, setData] = useState<AttributeType[]>(() => [...attributeData])
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
        <div className="flex gap-2.5">
          <div className="input-icon-group">
            <Icon icon="search" className="input-icon" />
            <input type="search" className="form-input" placeholder="Search Attributes..." value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} />
          </div>
          <button className={cn('btn bg-danger text-white hover:bg-danger-hover', !(Object.keys(selectedRowIds).length > 0) && 'hidden')} type="button" data-hs-overlay="#confirm-delete-modal">
            Delete
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold me-3">Filter By:</span>
          <div className="input-icon-group">
            <Icon icon="wand" className="input-icon" />
            <select className="form-select" value={(table.getColumn('inputType')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('inputType')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
              <option value="All">Type</option>
              <option value="Dropdown">Dropdown</option>
              <option value="Text">Text</option>
              <option value="Number">Number</option>
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

        <div className="flex gap-1">
          <button className="btn bg-danger text-white hover:bg-danger-hover" aria-haspopup="dialog" aria-expanded="false" aria-controls="addAttributeForm" data-hs-overlay="#addAttributeForm">
            <Icon icon="plus" />
            Add Attribute
          </button>
        </div>
      </div>

      <DataTable<AttributeType> table={table} emptyMessage="No records found" />

      {table.getRowModel().rows.length > 0 && (
        <div className="card-footer">
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
        </div>
      )}

      <DeleteConfirmationModal onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="attribute" />
      <AddAttributeModal />
    </div>
  )
}

export default AttributeTable
