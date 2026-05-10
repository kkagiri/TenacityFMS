import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, Row as TableRow, Table as TableType, useReactTable } from '@tanstack/react-table'
import { Link } from 'react-router'
import { useState } from 'react'
import AddCustomerModal from './AddCustomerModal'
import { customerData, CustomerType } from './data'

const columnHelper = createColumnHelper<CustomerType>()

const CustomerTable = () => {
  const columns = [
    {
      id: 'select',
      header: ({ table }: { table: TableType<CustomerType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }: { row: TableRow<CustomerType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
    columnHelper.accessor('customer', {
      header: 'Client Name',
      cell: ({ row }) => (
        <div className="flex gap-3 items-center">
          <img src={row.original.customer.image} alt="avatar-7" className="size-8 rounded-full" />
          <h5>
            <Link to="" className="hover:text-primary">
              {row.original.customer.name}
            </Link>
          </h5>
        </div>
      ),
    }),
    columnHelper.accessor('email', { header: 'Email' }),
    columnHelper.accessor('phone', { header: 'Phone' }),
    columnHelper.accessor('country', {
      header: 'Date',
      cell: ({ row }) => (
        <div className="flex gap-3 items-center">
          <div>
            <img src={row.original.country.flag} alt="country-flag" className="size-4 rounded-full" />
          </div>
          <p> {row.original.country.name} </p>
        </div>
      ),
    }),
    columnHelper.accessor('joinedDate', {
      header: 'Date',
      cell: ({ row }) => (
        <>
          {row.original.joinedDate} <small className="text-default-400 ms-1">{row.original.joinedTime}</small>
        </>
      ),
    }),
    columnHelper.accessor('orders', { header: 'Orders' }),
    columnHelper.accessor('totalSpends', {
      header: 'Total Spends',
    }),
    {
      id: 'action',
      header: () => <div className="mx-auto">Actions</div>,
      cell: ({ row }: { row: TableRow<CustomerType> }) => (
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

  const [data, setData] = useState<CustomerType[]>(() => [...customerData])
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 8 })

  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({})

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter, pagination, rowSelection: selectedRowIds },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
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
            <input type="search" placeholder="Search customer..." className="form-input" />
          </div>
          <button className={cn('btn bg-danger text-white hover:bg-danger-hover', !(Object.keys(selectedRowIds).length > 0) && 'hidden')} type="button" data-hs-overlay="#confirm-delete-modal">
            Delete
          </button>
        </div>
        <div className="flex gap-2.5 items-center flex-wrap md:flex-nowrap">
          <select className="form-select" value={table.getState().pagination.pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))}>
            {[5, 8, 10, 15, 20].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <div className="relative">
            <div className="hs-dropdown inline-flex [--placement:bottom-right]">
              <button type="button" className="hs-dropdown-toggle btn border border-default-300 text-default-800 hover:bg-default-100" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
                <Icon icon="download" className="text-sm" />
                Export
                <Icon icon="chevron-down" className="align-middle ms-1" />
              </button>
              <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
                <div className="space-y-0.5">
                  <a className="dropdown-item" href="">
                    Export as PDF
                  </a>
                  <a className="dropdown-item" href="">
                    Export as CSV
                  </a>
                  <a className="dropdown-item" href="">
                    Export as Excel
                  </a>
                </div>
              </div>
            </div>
          </div>
          <button type="button" className="btn bg-primary text-white text-nowrap hover:bg-primary-hover" aria-haspopup="dialog" aria-expanded="false" aria-controls="addCustomerModal" data-hs-overlay="#addCustomerModal">
            <Icon icon="plus" /> Add Customer&nbsp;
          </button>
        </div>
      </div>
      <div className="overflow-x-auto whitespace-normal">
        <DataTable<CustomerType> table={table} emptyMessage="No records found" />
      </div>

      {table.getRowModel().rows.length > 0 && (
        <div className="card-footer">
          <TablePagination
            totalItems={totalItems}
            start={start}
            end={end}
            itemsName="customers"
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

      <DeleteConfirmationModal onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="customers" />

      <AddCustomerModal />
    </div>
  )
}

export default CustomerTable
