import Rating from '@/components/Rating'
import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { cn, toPascalCase } from '@/utils/helpers'
import { type ColumnFiltersState, createColumnHelper, FilterFn, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, Row as TableRow, Table as TableType, useReactTable } from '@tanstack/react-table'
import { Link } from 'react-router'
import { useState } from 'react'
import { customTableData, CustomTableType } from './data'

const priceRangeFilterFn: FilterFn<CustomTableType> = (row, columnId, value) => {
  const price = row.getValue<number>(columnId)
  if (!value) return true

  if (value === '500+') return price > 500

  const [min, max] = value.split('-').map(Number)
  return price >= min && price <= max
}

const columnHelper = createColumnHelper<CustomTableType>()

const TableWithSort = () => {
  const columns = [
    {
      id: 'select',
      header: ({ table }: { table: TableType<CustomTableType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }: { row: TableRow<CustomTableType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
    columnHelper.accessor('product.name', {
      header: 'Product',
      cell: ({ row }) => (
        <div className="flex">
          <div>
            <div className="me-5 size-5 lg:size-9">
              <img src={row.original.product.image} alt="Product" className="size-5 rounded lg:size-9" />
            </div>
          </div>
          <div>
            <h5 className="text-default-800 hover:text-primary mb-1">
              <Link to="/ecommerce/product/details">{row.original.product.name}</Link>
            </h5>
            <p className="text-default-400 text-2xs">by: {row.original.product.manufacturer}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('sku', { header: 'Code' }),
    columnHelper.accessor('category', {
      header: 'Category',
      filterFn: 'equalsString',
      enableColumnFilter: true,
    }),
    columnHelper.accessor('stock', { header: 'Stock' }),
    columnHelper.accessor('price', {
      header: 'Price',
      filterFn: priceRangeFilterFn,
      enableColumnFilter: true,
      cell: ({ row }) => <>{row.original.price}</>,
    }),
    columnHelper.accessor('orders', { header: 'Orders' }),
    columnHelper.accessor('rating', {
      header: 'Rating',
      cell: ({ row }) => (
        <>
          <Rating rating={row.original.rating} />
          <span className="ms-1">
            <Link to="/ecommerce/reviews" className="hover:text-primary font-semibold">
              ({row.original.reviews})
            </Link>
          </span>
        </>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      filterFn: 'equalsString',
      enableColumnFilter: true,
      cell: ({ row }) => <span className={`badge ${row.original.status === 'published' ? 'bg-success/15 text-success' : row.original.status === 'pending' ? 'bg-warning/15 text-warning' : 'bg-danger/15 text-danger'} text-2xs`}>{toPascalCase(row.original.status)}</span>,
    }),
    columnHelper.accessor('date', {
      header: 'Date',
      cell: ({ row }) => (
        <>
          {row.original.date} <small className="text-default-400">{row.original.time}</small>
        </>
      ),
    }),
    {
      header: 'Actions',
      cell: ({ row }: { row: TableRow<CustomTableType> }) => (
        <div className="flex justify-center gap-1.5">
          <button type="button" className="btn bg-default-100 btn-icon btn-sm text-default-800 hover:text-primary size-7.5 rounded-full">
            <Icon icon="eye" className="text-base" />
          </button>
          <button type="button" className="btn bg-default-100 btn-icon btn-sm text-default-800 hover:text-primary size-7.5 rounded-full">
            <Icon icon="edit" className="text-base" />
          </button>
          <button
            className="btn bg-danger btn-icon btn-sm text-white hover:text-primary size-7.5 rounded-full"
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

  const [data, setData] = useState<CustomTableType[]>(() => [...customTableData])
  const [globalFilter, setGlobalFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 })

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
    filterFns: {
      priceRange: priceRangeFilterFn,
    },
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
        <h4 className="card-title">Custom table with sort</h4>
      </div>
      <div className="border-default-300 flex flex-wrap justify-between gap-2.5 border-b border-dashed px-5 py-4">
        <div className="flex gap-2">
          <div className="input-icon-group">
            <Icon icon="search" className="input-icon" />
            <input type="search" placeholder="Search product name..." className="form-input" value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} />
          </div>
          <button className={cn('btn bg-danger text-white hover:bg-danger-hover', !(Object.keys(selectedRowIds).length > 0) && 'hidden')} type="button" data-hs-overlay="#confirm-delete-modal">
            Delete
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 md:flex-nowrap">
          <span className="me-2.5 font-semibold text-nowrap">Filter By:</span>
          <div className="input-icon-group">
            <Icon icon="tag" className="input-icon" />
            <select className="form-select" value={(table.getColumn('category')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('category')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
              <option value="All">Category</option>
              <option value="Electronics">Electronics</option>
              <option value="Fashion">Fashion</option>
              <option value="Home">Home</option>
              <option value="Sports">Sports</option>
              <option value="Beauty">Beauty</option>
            </select>
          </div>
          <div className="input-icon-group">
            <Icon icon="box" className="input-icon" />
            <select className="form-select" value={(table.getColumn('status')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('status')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
              <option value="All">Status</option>
              <option value="Published">Published</option>
              <option value="Pending">Pending</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
          <div className="input-icon-group">
            <Icon icon="currency-dollar" className="input-icon" />
            <select className="form-select" value={(table.getColumn('price')?.getFilterValue() as string) ?? ''} onChange={(e) => table.getColumn('price')?.setFilterValue(e.target.value || undefined)}>
              <option value="All">Price Range</option>
              <option value="0-50">$0 - $50</option>
              <option value="51-150">$51 - $150</option>
              <option value="151-500">$151 - $500</option>
              <option value="500+">$500+</option>
            </select>
          </div>
          <div>
            <select className="form-select" value={table.getState().pagination.pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))}>
              {[5, 10, 15, 20].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <DataTable<CustomTableType> table={table} emptyMessage="No records found" />

      {table.getRowModel().rows.length > 0 && (
        <div className="card-footer">
          <TablePagination
            totalItems={totalItems}
            start={start}
            end={end}
            itemsName="products"
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
      <DeleteConfirmationModal onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="product" />
    </div>
  )
}

export default TableWithSort
