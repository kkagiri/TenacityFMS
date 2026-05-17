import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import { cn, toPascalCase } from '@/utils/helpers'
import { ColumnDef, type ColumnFiltersState, createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, Row as TableRow, Table as TableType, useReactTable } from '@tanstack/react-table'
import { Link } from 'react-router'
import { useState } from 'react'
import { productStockData, ProductStockType } from './data'

const columnHelper = createColumnHelper<ProductStockType>()

const ProductStockTable = () => {
  const columns: ColumnDef<ProductStockType, any>[] = [
    {
      id: 'select',
      maxSize: 45,
      size: 45,
      header: ({ table }: { table: TableType<ProductStockType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }: { row: TableRow<ProductStockType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
    columnHelper.accessor('product', {
      header: 'Product',
      enableColumnFilter: false,
      cell: ({ row }) => (
        <div className="flex items-center">
          <div className="me-6 size-9">
            <img src={row.original.product.image} alt="Product" className="rounded" />
          </div>
          <div>
            <h5 className="mb-1">
              <Link to="/apps/ecommerce/product-details" className="hover:text-primary">
                {row.original.product.name}
              </Link>
            </h5>
            <p className="text-default-400 text-xs">Supplier: {row.original.product.supplier}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('sku', { header: 'Sku', enableSorting: false }),
    columnHelper.accessor('category', { header: 'Category' }),
    columnHelper.accessor('availableStock', {
      header: 'Available Stock',
      cell: ({ row }) => <h5 className={cn('px-2.25 py-3 font-semibold', row.original.availableStock === 0 ? 'text-danger' : 'text-success')}>{row.original.availableStock}</h5>,
    }),
    columnHelper.accessor('lowStock', {
      header: 'Low Stock',
      cell: ({ row }) => <h5 className={cn('px-2.25 py-3 font-semibold', row.original.lowStock < 20 ? 'text-danger' : 'text-warning')}>{row.original.lowStock}</h5>,
    }),
    columnHelper.accessor('price', {
      header: 'Unit Price',
      enableColumnFilter: true,
    }),

    columnHelper.accessor('status', {
      header: 'Status',
      filterFn: 'equalsString',
      enableColumnFilter: true,
      cell: ({ row }) => <span className={cn('badge badge-label', row.original.status === 'out-of-stock' ? 'bg-danger/15 text-danger' : row.original.status === 'low-stock' ? 'bg-warning/15 text-warning' : 'bg-success/15 text-success')}>{toPascalCase(row.original.status)}</span>,
    }),
    columnHelper.accessor('date', {
      header: 'Last Updated',
      filterFn: 'equalsString',
      cell: ({ row }) => (
        <>
          {row.original.date} <small className="text-default-400 text-2xs">{row.original.time}</small>
        </>
      ),
    }),
    {
      header: 'Actions',
      cell: ({ row }: { row: TableRow<ProductStockType> }) => (
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

  const [data, setData] = useState<ProductStockType[]>(() => [...productStockData])
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
    <div className="card">
      <div className="card-header">
        <div className="flex gap-2.5">
          <div className="input-icon-group">
            <Icon icon="search" className="input-icon"></Icon>
            <input value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} className="form-input" placeholder="Search product name or SKU..." />
          </div>

          <button className={cn('btn bg-danger text-white hover:bg-danger-hover', !(Object.keys(selectedRowIds).length > 0) && 'hidden')} type="button" data-hs-overlay="#confirm-delete-modal">
            Delete
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
          <div className="flex flex-wrap items-center gap-3 md:flex-nowrap">
            <div className="items-center gap-2 md:flex">
              <span className="font-semibold">Filter By:</span>

              <div className="input-icon-group">
                <Icon icon="tag" className="input-icon"></Icon>
                <select className="form-select" value={(table.getColumn('category')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('category')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
                  <option value="All">Category</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Mobiles">Mobiles</option>
                  <option value="Audio">Audio</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Appliances">Appliances</option>
                  <option value="Wearables">Wearables</option>
                  <option value="Cameras">Cameras</option>
                  <option value="Computers">Computers</option>
                  <option value="Accessories">Accessories</option>
                </select>
              </div>
            </div>

            <div className="input-icon-group">
              <Icon icon="activity" className="input-icon"></Icon>
              <select className="form-select" value={(table.getColumn('status')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('status')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
                <option value="All">Stock Status</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>

            <div className="input-icon-group">
              <Icon icon="currency-dollar" className="input-icon"></Icon>
              <select className="form-select">
                <option value="All">Price Range</option>
                <option value="0-50">$0 - $50</option>
                <option value="51-150">$51 - $150</option>
                <option value="151-500">$151 - $500</option>
                <option value="501-1000">$501 - $1,000</option>
                <option value="1000+">$1,000+</option>
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

        <Link to="/apps/ecommerce/product-add" className="btn bg-danger text-white hover:bg-danger-hover">
          <Icon icon="plus" />
          Add Product
        </Link>
      </div>

      <DataTable<ProductStockType> table={table} emptyMessage="No records found" />

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

export default ProductStockTable
