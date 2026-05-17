import Rating from '@/components/Rating'
import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import ApexChart from '@/components/wrappers/ApexChart'
import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { ColumnFiltersState, createColumnHelper, FilterFn, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, Row as TableRow, Table as TableType, useReactTable } from '@tanstack/react-table'
import { Link } from 'react-router'
import { useState } from 'react'
import { productData, ProductType } from './data'

const orderFilterFn: FilterFn<any> = (row, columnId, value) => {
  const orders = row.getValue<number>(columnId)
  if (!value) return true

  if (value === '1000+') return orders > 1000

  const [min, max] = value.split('-').map(Number)
  return orders >= min && orders <= max
}

const columnHelper = createColumnHelper<ProductType>()

const ProductViewsTable = () => {
  const columns = [
    {
      id: 'select',
      header: ({ table }: { table: TableType<ProductType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }: { row: TableRow<ProductType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
    columnHelper.accessor('name', {
      header: 'Product',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div>
            <img src={row.original.image} alt={row.original.name} height={36} width={36} className="img-fluid rounded" />
          </div>
          <h5>
            <Link to="" className="hover:text-primary">
              {row.original.name}
            </Link>
          </h5>
        </div>
      ),
    }),
    columnHelper.accessor('sku', { header: 'SKU' }),
    columnHelper.accessor('price', {
      header: 'Price',
      enableColumnFilter: true,
    }),
    columnHelper.accessor('rating', {
      header: 'Rating',
      cell: ({ row }) => (
        <>
          <Rating rating={row.original.rating} />
          <span className="ms-1">
            <Link to="" className="link-reset fw-semibold">
              ({row.original.reviews})
            </Link>
          </span>
        </>
      ),
    }),
    columnHelper.accessor('views', { header: 'Views' }),
    columnHelper.accessor('orders', { header: 'Orders', filterFn: orderFilterFn, enableColumnFilter: true }),
    columnHelper.accessor('conversion', {
      header: 'Conversion',
    }),
    columnHelper.accessor('chartOption', {
      header: 'Report',
      cell: ({ row }) => <ApexChart getOptions={row.original.chartOption} series={row.original.chartOption().series} type={row.original.chartOption().chart?.type} width={100} height={30} />,
    }),
  ]

  const [data, setData] = useState<ProductType[]>(() => [...productData])
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
    filterFns: {
      priceRange: orderFilterFn,
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
        <div className="flex items-center gap-3">
          <div className="input-icon-group">
            <Icon icon="search" className="input-icon" />
            <input value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} type="search" placeholder="Search report..." className="form-input" />
          </div>
        </div>

        <button className={cn('btn bg-danger text-white hover:bg-danger-hover', !(Object.keys(selectedRowIds).length > 0) && 'hidden')} type="button" data-hs-overlay="#confirm-delete-modal">
          Delete
        </button>

        <div className="flex flex-wrap items-center gap-3 md:flex-nowrap">
          <span className="me-3 font-semibold text-nowrap">Filter By:</span>

          <div className="input-icon-group">
            <Icon icon="trending-up" className="input-icon" />
            <select className="form-select" value={(table.getColumn('orders')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('orders')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
              <option value="All">Sales Performance</option>
              <option value="1000+">Top Selling</option>
              <option value="1-1000">Low Selling</option>
              <option value="0">No Sales</option>
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
      </div>

      <DataTable<ProductType> table={table} emptyMessage="No records found" />

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

      <DeleteConfirmationModal onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="report" />
    </div>
  )
}

export default ProductViewsTable
