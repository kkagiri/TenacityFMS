import Rating from '@/components/Rating'
import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import TablePagination from '@/components/table/TablePagination'
import ApexChart from '@/components/wrappers/ApexChart'
import Icon from '@/components/wrappers/Icon'
import { createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { useState } from 'react'
import { Button, Card, CardFooter, CardHeader, FormSelect } from 'react-bootstrap'
import { Link } from 'react-router'
import { sellerData } from './data'
const orderRangeFilterFn = (row, columnId, value) => {
  const order = row.getValue(columnId)
  if (!value) return true
  if (value === '0') return false
  if (value === '20000+') return order > 20000
  const [min, max] = value.split('-').map(Number)
  return order >= min && order <= max
}
const ratingFilterFn = (row, columnId, value) => {
  const rating = row.getValue(columnId)
  if (!value) return true
  if (value === '0') return false
  if (value === '4-5') return rating >= 4
  if (value === '1-3') return rating >= 0 && rating < 4
  const [min, max] = value.split('-').map(Number)
  return rating >= min && rating <= max
}
const revenueFilterFn = (row, columnId, value) => {
  const balanceStr = row.getValue(columnId)
  if (!value) return true

  // Parse balance string to number (e.g., "$92.5k" -> 92.5, "$600k" -> 600, "$145.7k" -> 145.7)
  const balance = parseFloat(balanceStr.replace('$', '').replace('k', ''))
  if (value === '0') return false
  if (value === '100k+') return balance > 100
  if (value === '50k-100k') return balance >= 50 && balance <= 100
  return true
}
const columnHelper = createColumnHelper()
const SellerTable = () => {
  const columns = [
    {
      id: 'select',
      header: ({ table }) => <input type="checkbox" className="form-check-input form-check-input-light fs-14 mt-0" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }) => <input type="checkbox" className="form-check-input form-check-input-light fs-14 mt-0" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
    columnHelper.accessor('seller', {
      header: 'Seller',
      cell: ({ row }) => (
        <div className="d-flex align-items-center">
          <div className="avatar-md me-3">
            <img src={row.original.seller.image} alt="Product" className="img-fluid rounded" />
          </div>
          <div>
            <h5 className="mb-1">
              <Link to="/apps/ecommerce/seller-details" className="link-reset">
                {row.original.seller.name}
              </Link>
            </h5>
            <p className="text-muted mb-0 fs-xxs">Since {row.original.seller.since}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('products', {
      header: 'Products',
    }),
    columnHelper.accessor('orders', {
      header: 'Orders',
      filterFn: orderRangeFilterFn,
    }),
    columnHelper.accessor('rating', {
      header: 'Rating',
      filterFn: ratingFilterFn,
      cell: ({ row }) => (
        <>
          <Rating rating={row.original.rating} className="d-inline-flex align-items-center gap-1" />
          <span className="ms-1">
            <Link to="" className="link-reset fw-semibold">
              ({row.original.rating})
            </Link>
          </span>
        </>
      ),
    }),
    columnHelper.accessor('country', {
      header: 'Location',
      cell: ({ row }) => (
        <span className="badge p-1 text-bg-light fs-sm">
          <img src={row.original.country.flag} alt="flag" className="rounded-circle me-1" height={12} /> {row.original.country.code}
        </span>
      ),
    }),
    columnHelper.accessor('balance', {
      header: 'Balance',
      filterFn: revenueFilterFn,
    }),
    columnHelper.accessor('rank', {
      header: 'Rank',
    }),
    columnHelper.accessor('reportChartOptions', {
      header: 'Report',
      cell: ({ row }) => <ApexChart getOptions={row.original.reportChartOptions} series={row.original.reportChartOptions().series} type={row.original.reportChartOptions().chart?.type} width={100} height={30} />,
    }),
  ]
  const [data, setData] = useState(() => [...sellerData])
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
      orderRange: orderRangeFilterFn,
      ratingFilter: ratingFilterFn,
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
            <input type="search" className="form-control" placeholder="Search seller..." value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} />
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
            <FormSelect value={table.getColumn('orders')?.getFilterValue() ?? 'All'} onChange={(e) => table.getColumn('orders')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)} className="form-control my-1 my-md-0">
              <option value="All">Orders</option>
              <option value="20000+">Top Orders</option>
              <option value="0-20000">Low Orders</option>
              <option value={0}>No Orders</option>
            </FormSelect>
            <Icon icon="shopping-cart" className="app-search-icon text-muted" />
          </div>
          <div className="app-search">
            <FormSelect className="form-control my-1 my-md-0" value={table.getColumn('balance')?.getFilterValue() ?? 'All'} onChange={(e) => table.getColumn('balance')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
              <option value="All">Revenue</option>
              <option value="100k+">Top Revenue</option>
              <option value="50k-100k">Low Revenue</option>
              <option value={0}>No Revenue</option>
            </FormSelect>
            <Icon icon="currency-dollar" className="app-search-icon text-muted" />
          </div>
          <div className="app-search">
            <FormSelect value={table.getColumn('rating')?.getFilterValue() ?? 'All'} onChange={(e) => table.getColumn('rating')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)} className="form-control my-1 my-md-0">
              <option value="All">Ratings</option>
              <option value="4-5">Top Rated</option>
              <option value="1-3">Low Rated</option>
              <option value={0}>No Ratings</option>
            </FormSelect>
            <Icon icon="star" className="app-search-icon text-muted" />
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
      </CardHeader>
      <DataTable table={table} emptyMessage="No records found" />

      {table.getRowModel().rows.length > 0 && (
        <CardFooter className="border-0">
          <TablePagination
            totalItems={totalItems}
            start={start}
            end={end}
            itemsName="sellers"
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
export default SellerTable
