import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import { cn, formatBytes } from '@/utils/helpers'
import { ColumnFiltersState, createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, SortingState, Row as TableRow, Table as TableType, useReactTable } from '@tanstack/react-table'
import { Link } from 'react-router'
import { useState } from 'react'

import { fileRecordData, folderData, type FileRecordType } from './data'
import FolderCard from './FolderCard'

const columnHelper = createColumnHelper<FileRecordType>()

const FilesTable = () => {
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})

  const columns = [
    {
      id: 'select',
      header: ({ table }: { table: TableType<FileRecordType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }: { row: TableRow<FileRecordType> }) => <input type="checkbox" className="form-checkbox form-checkbox-light size-4.5" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
    columnHelper.accessor('name', {
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="bg-light/50 text-default-400 flex size-9 items-center justify-center rounded-md">
            <Icon icon={row.original.icon} className="text-2xl" />
          </div>
          <div>
            <h5 className="mb-1.25 text-xs">
              <Link to="" className="hover:text-primary">
                {row.original.name}
              </Link>
            </h5>
            <p className="text-default-400 text-xs">{formatBytes(row.original.size)}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('type', { header: 'Type', filterFn: 'equalsString' }),
    columnHelper.accessor('modifiedDate', { header: 'Modified' }),
    columnHelper.accessor('user.email', {
      header: 'Owner',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <img src={row.original.user.image} alt="" className="size-6 rounded-full" />
          <h5>
            <Link to="" className="hover:text-primary transition-all">
              {row.original.user.email}
            </Link>
          </h5>
        </div>
      ),
    }),
    columnHelper.accessor('sharedWith', {
      header: 'Shared With',
      cell: ({ row }) => (
        <div className="flex items-center -space-x-2">
          {row.original.sharedWith.map((item, idx) => (
            <img src={item.image} alt="" className="transitio-all size-6 rounded-full duration-200 hover:-translate-y-1" key={idx} />
          ))}
        </div>
      ),
    }),
    {
      header: 'Actions',
      cell: ({ row }: { row: TableRow<FileRecordType> }) => {
        const fileId = row.original.id
        const isFavorite = favorites[fileId] ?? row.original.isFavorite
        return (
          <div className="flex items-center justify-end gap-3">
            <div className="relative">
              <span id="star-1"></span>
              <button
                type="button"
                onClick={() => {
                  setFavorites((prev) => ({
                    ...prev,
                    [fileId]: !isFavorite,
                  }))
                }}
              >
                <div className="flex items-center gap-1">{isFavorite ? <Icon icon="star-filled" className="text-warning text-base" /> : <Icon icon="star-filled" className="text-default-400 text-base" />}</div>
              </button>
            </div>

            <div className="relative">
              <div className="hs-dropdown relative inline-flex [--placement:bottom-right]">
                <button type="button" className="hs-dropdown-toggle text-xl text-default-400" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
                  <Icon icon="dots-vertical" className="size-5" />
                </button>

                <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
                  <div className="space-y-0.5">
                    <Link className="dropdown-item" to="">
                      <Icon icon="share" />
                      Share
                    </Link>

                    <Link className="dropdown-item" to="">
                      <Icon icon="link" />
                      Get Sharable Link
                    </Link>

                    <Link className="dropdown-item" to="/images/users/user-1.jpg" download>
                      <Icon icon="download" />
                      Download
                    </Link>

                    <Link className="dropdown-item" to="">
                      <Icon icon="pin" />
                      Pin
                    </Link>

                    <Link className="dropdown-item" to="">
                      <Icon icon="edit" />
                      Edit
                    </Link>

                    <Link className="dropdown-item" to="">
                      <Icon icon="trash" />
                      Delete
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      },
    },
  ]

  const [data, setData] = useState<FileRecordType[]>(() => [...fileRecordData])
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

  const handleDelete = () => {
    const selectedIds = new Set(Object.keys(selectedRowIds))
    setData((old) => old.filter((_, idx) => !selectedIds.has(idx.toString())))
    setSelectedRowIds({})
    window.HSOverlay?.close('#confirm-delete-modal')
  }

  return (
    <div className="card h-full">
      <div className="card-header">
        <div className="flex gap-3">
          <div className="flex items-center gap-2 text-start lg:hidden">
            <button className="btn btn-sm btn-icon border-default-300" aria-controls="fileSidebaroffcanvas" aria-label="Toggle navigation" data-hs-overlay="#fileSidebaroffcanvas" aria-haspopup="dialog" aria-expanded="false">
              <Icon icon="menu-4" className="text-default-600 size-6" />
            </button>
          </div>
          <div className="input-icon-group">
            <Icon icon="search" className="input-icon" />
            <input type="text" placeholder="Search files..." className="form-input" value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} />
          </div>

          <button className={cn('btn bg-danger text-white hover:bg-danger-hover', !(Object.keys(selectedRowIds).length > 0) && 'hidden')} type="button" data-hs-overlay="#confirm-delete-modal">
            Delete
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:flex-nowrap">
          <span className="me-3 font-semibold text-nowrap">Filter By:</span>

          <div className="input-icon-group">
            <Icon icon="file" className="input-icon" />
            <select className="form-select" value={(table.getColumn('type')?.getFilterValue() as string) ?? 'All'} onChange={(e) => table.getColumn('type')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
              <option value="" defaultChecked>
                File Type
              </option>
              <option value="Folder">Folder</option>
              <option value="MySQL">MySQL</option>
              <option value="MP4">MP4</option>
              <option value="Audio">Audio</option>
              <option value="Figma">Figma</option>
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

      <SimpleBar className="card-body h-[calc(100%-100px)]">
        <div className="mb-base grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {folderData.map((folder, idx) => (
            <FolderCard key={idx} folder={folder} />
          ))}
        </div>

        <DataTable<FileRecordType> table={table} emptyMessage="No records found" />

        <div className="border-default-300 flex items-center justify-center gap-3 border-t p-3 md:p-6">
          <strong>Loading...</strong>
          <div className="text-danger inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" role="status" aria-label="loading">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      </SimpleBar>
      <DeleteConfirmationModal onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="clients" />
    </div>
  )
}

export default FilesTable
