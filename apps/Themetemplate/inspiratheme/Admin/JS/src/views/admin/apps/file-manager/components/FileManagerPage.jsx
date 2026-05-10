import user1 from '@/assets/images/users/user-1.jpg'
import DataTable from '@/components/table/DataTable'
import DeleteConfirmationModal from '@/components/table/DeleteConfirmationModal'
import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import { formatBytes } from '@/utils/helpers'
import { createColumnHelper, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import clsx from 'clsx'
import { useState } from 'react'
import { Button, Card, CardBody, CardHeader, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, FormSelect, ListGroup, ListGroupItem, Offcanvas, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import { categoryData, fileRecordData, folderData, sidebarMenuItemData } from './data'
const columnHelper = createColumnHelper()
const FileManagerPage = () => {
  const [show, setShow] = useState(false)
  const [favorites, setFavorites] = useState({})
  const columns = [
    {
      id: 'select',
      header: ({ table }) => <input type="checkbox" className="form-check-input form-check-input-light fs-14 file-item-check" checked={table.getIsAllRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />,
      cell: ({ row }) => <input type="checkbox" className="form-check-input form-check-input-light fs-14 file-item-check" checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />,
      enableSorting: false,
      enableColumnFilter: false,
    },
    columnHelper.accessor('name', {
      header: 'Name',
      cell: ({ row }) => (
        <div className="d-flex align-items-center gap-2">
          <div className="flex-shrink-0 avatar-md bg-light bg-opacity-50 text-muted rounded-2">
            <span className="avatar-title">
              <Icon icon={row.original.icon} className="fs-xl" />
            </span>
          </div>
          <div className="flex-grow-1">
            <h5 className="mb-1 fs-base">
              <Link to="" className="link-reset">
                {row.original.name}
              </Link>
            </h5>
            <p className="text-muted mb-0 fs-xs">{formatBytes(row.original.size)}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('type', {
      header: 'Type',
      filterFn: 'equalsString',
    }),
    columnHelper.accessor('modifiedDate', {
      header: 'Modified',
    }),
    columnHelper.accessor('user.email', {
      header: 'Owner',
      cell: ({ row }) => (
        <div className="d-flex align-items-center gap-2">
          <div className="flex-shrink-0 bg-light bg-opacity-50 text-muted d-inline-flex align-items-center justify-content-center rounded-2">
            <img src={row.original.user.image} height={24} width={24} alt="" className="avatar-xs rounded-circle" />
          </div>
          <h5 className="mb-0 fs-base">
            <Link to="" className="link-reset">
              {row.original.user.email}
            </Link>
          </h5>
        </div>
      ),
    }),
    columnHelper.accessor('sharedWith', {
      header: 'Shared With',
      cell: ({ row }) => (
        <div className="avatar-group avatar-group-xs">
          {row.original.sharedWith.map((item, index) => (
            <div className="avatar" key={index}>
              <img src={item.image} height={24} width={24} alt="" className="rounded-circle avatar-xs" />
            </div>
          ))}
        </div>
      ),
    }),
    {
      header: 'Actions',
      cell: ({ row }) => {
        const fileId = row.original.id
        const isFavorite = favorites[fileId] ?? row.original.isFavorite
        return (
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-icon btn-sm btn-link"
              onClick={() => {
                setFavorites((prev) => ({
                  ...prev,
                  [fileId]: !isFavorite,
                }))
              }}
            >
              {isFavorite ? <Icon icon="star-filled" className="text-warning fs-lg" /> : <Icon icon="star-filled" className="text-muted fs-lg" />}
            </button>
            <Dropdown align="end" className="flex-shrink-0 text-muted">
              <DropdownToggle as="a" role="button" className="dropdown-toggle drop-arrow-none fs-xxl link-reset p-0">
                <Icon icon="dots-vertical" />
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem>
                  <Icon icon="share" className="me-1" />
                  Share
                </DropdownItem>
                <DropdownItem>
                  <Icon icon="link" className="me-1" />
                  Get Sharable Link
                </DropdownItem>
                <DropdownItem>
                  <Icon icon="download" className="me-1" /> Download
                </DropdownItem>
                <DropdownItem>
                  <Icon icon="pin" className="me-1" /> Pin
                </DropdownItem>
                <DropdownItem>
                  <Icon icon="edit" className="me-1" />
                  Edit
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    toggleDeleteModal()
                    setSelectedRowIds({
                      [row.id]: true,
                    })
                  }}
                >
                  <Icon icon="trash" className="me-1" />
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        )
      },
    },
  ]
  const [data, setData] = useState(() => [...fileRecordData])
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
      pagination,
      columnFilters,
      rowSelection: selectedRowIds,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
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
    <div className="outlook-box">
      <Offcanvas responsive="lg" show={show} onHide={() => setShow(!show)} className="offcanvas-start outlook-left-menu outlook-left-menu-md">
        <SideBar />
      </Offcanvas>

      <Card className="h-100 mb-0 border-start-0 flex-grow-1 rounded-start-0">
        <CardHeader className="justify-content-between">
          <div className="d-flex gap-2">
            <div className="d-lg-none d-inline-flex gap-2">
              <button className="btn btn-default btn-icon" type="button" onClick={() => setShow(!show)}>
                <Icon icon="menu-4" className="fs-lg" />
              </button>
            </div>

            <div className="app-search">
              <input type="search" className="form-control" placeholder="Search files..." value={globalFilter ?? ''} onChange={(e) => setGlobalFilter(e.target.value)} />
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
              <FormSelect className="form-control my-1 my-md-0" value={table.getColumn('type')?.getFilterValue() ?? 'All'} onChange={(e) => table.getColumn('type')?.setFilterValue(e.target.value === 'All' ? undefined : e.target.value)}>
                <option value="All">File Type</option>
                <option value="Folder">Folder</option>
                <option value="MySQL">MySQL</option>
                <option value="MP4">MP4</option>
                <option value="Audio">Audio</option>
                <option value="Figma">Figma</option>
              </FormSelect>
              <Icon icon="file" className="app-search-icon text-muted" />
            </div>

            <div>
              <FormSelect className="form-control my-1 my-md-0" value={table.getState().pagination.pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))}>
                {[5, 8, 10, 15, 20].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </FormSelect>
            </div>
          </div>
        </CardHeader>

        <SimpleBar
          data-simplebar-md
          className="card-body"
          style={{
            height: 'calc(100% - 100px)',
          }}
        >
          <Row>
            {folderData.map((folder, idx) => (
              <Col md={6} lg={4} xxl={3} key={idx}>
                <FolderCard folder={folder} />
              </Col>
            ))}
          </Row>

          <DataTable table={table} emptyMessage="No records found" />

          <DeleteConfirmationModal show={showDeleteModal} onHide={toggleDeleteModal} onConfirm={handleDelete} selectedCount={Object.keys(selectedRowIds).length} itemName="clients" />

          <div className="d-flex align-items-center justify-content-center gap-2 p-3">
            <strong>Loading...</strong>
            <div className="spinner-border spinner-border-sm text-danger" role="status" aria-hidden="true"></div>
          </div>
        </SimpleBar>
      </Card>
    </div>
  )
}
export default FileManagerPage
const SideBar = () => {
  return (
    <SimpleBar className="card h-100 mb-0 rounded-end-0">
      <CardBody>
        <Button variant="danger" className="fw-medium w-100">
          Upload Files
        </Button>

        <ListGroup variant="flush" className="list-custom mt-3">
          {sidebarMenuItemData.map((item, idx) => (
            <ListGroupItem key={item.name} as={Link} href="" action className={idx === 0 ? 'active' : ''}>
              <Icon icon={item.icon} className="align-middle me-1 opacity-75 fs-lg" />
              &nbsp;
              <span className="align-middle">{item.name}</span>
              {item.badge && <span className={clsx('badge align-middle  fs-xxs float-end', item.badge.className)}>{item.badge.label}</span>}
            </ListGroupItem>
          ))}

          <ListGroupItem className="mt-2">
            <span className="align-middle">Categories</span>
          </ListGroupItem>

          {categoryData.map((item) => (
            <ListGroupItem key={item.name} as={Link} href="" action>
              <Icon icon={item.icon} className={clsx('me-1 align-middle fs-sm', item.iconClassName)} />
              &nbsp;
              <span className="align-middle">{item.name}</span>
            </ListGroupItem>
          ))}
        </ListGroup>
      </CardBody>
    </SimpleBar>
  )
}
const FolderCard = ({ folder }) => {
  return (
    <Card>
      <CardBody className="p-2">
        <div className="d-flex align-items-center justify-content-between gap-2">
          <div className="flex-shrink-0 avatar-md d-flex justify-content-center align-items-center bg-light bg-opacity-50 text-muted rounded-2">
            <Icon icon="folder" className="fs-24 avatar-title h-75" />
          </div>
          <div className="flex-grow-1">
            <h5 className="mb-1 fs-sm">
              <Link to="" className="link-reset">
                {folder.name}
              </Link>
            </h5>
            <p className="text-muted mb-0 fs-xs">{formatBytes(folder.size)}</p>
          </div>
          <Dropdown align="end" className="flex-shrink-0 text-muted">
            <DropdownToggle as="a" role="button" className="dropdown-toggle drop-arrow-none fs-xxl link-reset p-0">
              <Icon icon="dots-vertical" />
            </DropdownToggle>
            <DropdownMenu>
              <DropdownItem>
                <Icon icon="share" className="me-1" /> Share
              </DropdownItem>
              <DropdownItem>
                <Icon icon="link" className="me-1" /> Get Sharable Link
              </DropdownItem>
              <a href={user1} download="user-1.jpg" className="dropdown-item">
                <Icon icon="download" className="me-1"></Icon>
                Download
              </a>
              <DropdownItem>
                <Icon icon="pin" className="me-1" /> Pin
              </DropdownItem>
              <DropdownItem>
                <Icon icon="edit" className="me-1" /> Edit
              </DropdownItem>
              <DropdownItem>
                <Icon icon="trash" className="me-1" /> Delete
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </CardBody>
    </Card>
  )
}
