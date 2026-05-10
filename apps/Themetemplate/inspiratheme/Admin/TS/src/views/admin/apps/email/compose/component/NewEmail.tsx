import Quill from '@/components/wrappers/Quill'
import Icon from '@/components/wrappers/Icon'
import { useState } from 'react'
import { Button, Card, CardHeader, CardTitle, Collapse, Dropdown, DropdownDivider, DropdownItem, DropdownMenu, DropdownToggle, Offcanvas, OverlayTrigger, Tooltip } from 'react-bootstrap'
import SimpleBar from 'simplebar-react'
import { useToggle } from 'usehooks-ts'
import EmailSidebar from '../../components/EmailSidebar'


const NewEmail = () => {
  const modules = {
    toolbar: [[{ header: [false, 1, 2, 3, 4, 5, 6] }], ['bold', 'italic', 'underline', 'strike'], [{ color: [] }, { background: [] }], ['blockquote', 'code-block'], [{ list: 'ordered' }, { list: 'bullet' }], ['link', 'image', 'video']],
  }
  const [show, setShow] = useState(false)
  const [isCcOpen, toggleCc] = useToggle()
  const [isBccOpen, toggleBcc] = useToggle()
  const [value, setValue] = useState<string>(
    `    <p>
                  Hi
                  <strong>
                    <em>James</em>
                  </strong>
                  ,
                </p>
                <p>I hope you're doing well.</p>
                <p>I'm reaching out regarding the latest updates on our project. Please find the summary below:</p>
                <ul>
                  <li>All UI components have been reviewed and finalized.</li>
                  <li>The mobile responsiveness is now optimized across all breakpoints.</li>
                  <li>We’re awaiting final client feedback before deployment.</li>
                </ul>
                <p>Let me know if you need anything else or if there's anything you'd like us to adjust.</p>
                <p>
                  <br />
                </p>
                <p>Best regards,</p>
                <p>
                  <em>Damian</em>
                </p>`
  )

  return (
    <>
      <Offcanvas responsive="lg" show={show} onHide={() => setShow(false)} className="offcanvas-lg offcanvas-start outlook-left-menu outlook-left-menu-sm" tabIndex={-1} id="emailSidebaroffcanvas">
        <EmailSidebar />
      </Offcanvas>
      <Card className="h-100 mb-0 rounded-start-0 flex-grow-1 border-start-0">
        <CardHeader className="d-lg-none d-flex gap-2">
          <button className="btn btn-default btn-icon" type="button" onClick={() => setShow(true)}>
            <Icon icon="menu-4" className="fs-lg" />
          </button>
          <div className="app-search">
            <input type="text" className="form-control" placeholder="Search mails..." />
            <Icon icon="search" className="app-search-icon text-muted" />
          </div>
        </CardHeader>
        <CardHeader className="card-bg justify-content-between">
          <CardTitle as="h4">Compose Message</CardTitle>
        </CardHeader>
        <SimpleBar className="card-body p-0" style={{ height: 'calc(100% - 120px)' }}>
          <div className="app-search input-group border-bottom border-dashed ps-2 pe-4">
            <input type="text" className="form-control py-3 border-0" placeholder="Enter emails.." />
            <span className="app-search-icon fw-semibold fs-sm">To:</span>
            <button className="btn btn-link fs-sm px-2 text-decoration-underline text-reset fw-semibold" type="button" onClick={toggleCc}>
              Cc
            </button>
            <button className="btn btn-link fs-sm px-2 text-decoration-underline text-reset fw-semibold" type="button" onClick={toggleBcc}>
              Bcc
            </button>
          </div>
          <Collapse in={isCcOpen}>
            <div className="app-search input-group border-bottom border-dashed ps-2 pe-4">
              <input type="text" className="form-control py-3 border-0" placeholder="Enter emails.." />
              <span className="app-search-icon fw-semibold fs-sm">Cc:</span>
              <button className="btn btn-link px-2 text-muted fw-semibold" type="button" onClick={toggleCc}>
                <Icon icon="x" className="fs-xl" />
              </button>
            </div>
          </Collapse>
          <Collapse in={isBccOpen}>
            <div className="app-search input-group border-bottom border-dashed ps-2 pe-4">
              <input type="text" className="form-control py-3 border-0" placeholder="Enter emails.." />
              <span className="app-search-icon fw-semibold fs-sm">Bcc:</span>
              <button className="btn btn-link px-2 text-muted fw-semibold" type="button" onClick={toggleBcc}>
                <Icon icon="x" className="fs-xl" />
              </button>
            </div>
          </Collapse>
          <div className="border-bottom border-dashed ps-2 pe-4">
            <input type="text" className="form-control py-3 fs-sm fw-semibold border-0" placeholder="Subject" />
          </div>
          <div className="email-editor">
            <Quill theme="snow" modules={modules} value={value} onChange={setValue} />
          </div>
          <div className="bg-light-subtle p-2 border-light border-bottom">
            <div className="d-flex gap-1 align-items-center">
              <Dropdown className="btn-group">
                <Button variant="primary" type="button">
                  <Icon icon="send-2" className="me-2" /> Send
                </Button>
                <DropdownToggle as="button" variant="primary" type="button" className="btn btn-primary dropdown-toggle dropdown-toggle-split drop-arrow-none" aria-haspopup="true" aria-expanded="false">
                  <Icon icon="chevron-down" className="ti ti-chevron-down align-middle" />
                </DropdownToggle>
                <DropdownMenu>
                  <DropdownItem href="#">Send &amp; Archive</DropdownItem>
                  <DropdownItem href="#">Schedule Send</DropdownItem>
                  <DropdownItem href="#">Save as Draft</DropdownItem>
                  <DropdownDivider />
                  <DropdownItem href="#">Discard</DropdownItem>
                </DropdownMenu>
              </Dropdown>
              <OverlayTrigger overlay={<Tooltip>Settings</Tooltip>}>
                <button type="button" className="btn btn-sm btn-icon btn-light ms-auto">
                  <Icon icon="settings" />
                </button>
              </OverlayTrigger>
              <OverlayTrigger overlay={<Tooltip>Delete</Tooltip>}>
                <button type="button" className="btn btn-sm btn-icon btn-soft-danger">
                  <Icon icon="trash" />
                </button>
              </OverlayTrigger>
            </div>
          </div>
        </SimpleBar>
      </Card>
    </>
  )
}

export default NewEmail
