import Rating from '@/components/Rating'
import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { cn, toPascalCase } from '@/utils/helpers'
import { ColumnDef, ColumnFiltersState, createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, Row as TableRow, Table as TableType, useReactTable } from '@tanstack/react-table'
import { Link } from 'react-router'
import { useState } from 'react'
import { productData, ProductType } from './data'

const columnHelper = createColumnHelper<ProductType>()

const ProductsListing = () => {
  const columns: ColumnDef<ProductType, any>[] = [
    {
      id: 'select',
      maxSize: 45,
      size: 45,
      header: ({ table }: { table: TableType<ProductType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }: { row: TableRow<ProductType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
    columnHelper.accessor('name', {
      header: 'Product',
      cell: ({ row }) => (
        <div className="flex">
          <div className="me-5 size-9">
            <img src={row.original.image} alt="Product" className="rounded" />
          </div>
          <div>
            <h5 className="mb-1.25">
              <Link to="/apps/ecommerce/product-details" className="hover:text-primary">
                {row.original.name}
              </Link>
            </h5>
            <p className="text-default-400 text-2xs">by: {row.original.brand}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('sku', { header: 'Sku', enableSorting: false }),
    columnHelper.accessor('category', {
      header: 'Category',
      filterFn: 'equalsString',
      enableColumnFilter: true,
    }),
    columnHelper.accessor('stock', { header: 'Stock', cell: ({ row }) => <h5>{row.original.stock}</h5> }),
    columnHelper.accessor('price', {
      header: 'Price',
      enableColumnFilter: true,
    }),
    columnHelper.accessor('orders', { header: 'Orders' }),
    columnHelper.accessor('rating', {
      header: 'Rating',
      cell: ({ row }) => (
        <>
          <Rating rating={row.original.rating} />
          <span className="ms-1.5">
            <Link to="/" className="hover:text-primary font-semibold">
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
      cell: ({ row }) => (
        <span className={cn('badge py-0 font-semibold text-2xs', row.original.status === 'published' ? 'text-success bg-success/15' : row.original.status === 'pending' ? 'text-warning bg-warning/15' : 'text-danger bg-danger/15')}>{toPascalCase(row.original.status)}</span>
      ),
    }),
    columnHelper.accessor('date', {
      header: '	Published',
      cell: ({ row }) => (
        <>
          {row.original.date} <small className="text-default-400">{row.original.time}</small>
        </>
      ),
    }),
    {
      id: 'action',
      header: () => <div className="text-center mx-auto">Actions</div>,
      cell: ({ row }: { row: TableRow<ProductType> }) => (
        <div className="flex justify-center gap-1.25">
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
            <input value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} type="text" className="form-input" placeholder="Search product name..." />
          </div>
          <button className={cn('btn bg-danger text-white hover:bg-danger-hover', !(Object.keys(selectedRowIds).length > 0) && 'hidden')} type="button" data-hs-overlay="#confirm-delete-modal">
            Delete
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 md:flex-nowrap">
          <div className="items-center gap-3 md:flex">
            <span className="font-semibold">Filter By:</span>
            <div className="input-icon-group">
              <Icon icon="tag" className="input-icon" />
              <select value={(table.getColumn('category')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('category')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)} className="form-select">
                <option value="All">Category</option>
                <option value="Electronics">Electronics</option>
                <option value="Fashion">Fashion</option>
                <option value="Home">Home</option>
                <option value="Sports">Sports</option>
                <option value="Beauty">Beauty</option>
              </select>
            </div>
          </div>
          <div className="input-icon-group">
            <Icon icon="activity" className="input-icon" />
            <select value={(table.getColumn('status')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('status')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)} className="form-select">
              <option>Status</option>
              <option value="Published">Published</option>
              <option value="Pending">Pending</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
          <div className="input-icon-group">
            <Icon icon="currency-dollar" className="input-icon" />
            <select data-table-range-filter="price" className="form-select">
              <option>Price Range</option>
              <option value="0-50">$0 - $50</option>
              <option value="51-150">$51 - $150</option>
              <option value="151-500">$151 - $500</option>
              <option value="500+">$500+</option>
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
        <div className="flex flex-wrap items-center gap-2.5">
          <nav className="flex items-center gap-1.25" aria-label="Tabs" role="tablist" aria-orientation="horizontal">
            <Link to="/apps/ecommerce/products-grid" className="btn btn-icon bg-primary/10 text-primary hover:bg-primary hover:text-white">
              <Icon icon="apps" className="text-lg" />
            </Link>
            <Link to="/apps/ecommerce/products" className="btn btn-icon bg-primary text-white hover:bg-primary-hover">
              <Icon icon="list-check" className="text-lg" />
            </Link>
          </nav>
          <Link to="/apps/ecommerce/product-add" className="btn bg-danger text-white hover:bg-danger-hover">
            <Icon icon="plus" />
            Add Product
          </Link>
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

      <DeleteConfirmationModal onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="product" />
    </div>
  )
}

export default ProductsListing
