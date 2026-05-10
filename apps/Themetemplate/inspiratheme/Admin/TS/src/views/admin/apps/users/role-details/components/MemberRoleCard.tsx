import user10 from '@/assets/images/users/user-10.jpg'
import user7 from '@/assets/images/users/user-7.jpg'
import user8 from '@/assets/images/users/user-8.jpg'
import user9 from '@/assets/images/users/user-9.jpg'
import Icon from '@/components/wrappers/Icon'
import { Button, Card, CardBody, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, FormControl, FormLabel, FormSelect, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'react-bootstrap'
import { useToggle } from 'usehooks-ts'

const MemberRoleCard = () => {
  const [show, toggle] = useToggle(false)
  return (
    <>
      <Card>
        <CardBody className="d-flex flex-column justify-content-between">
          <div className="d-flex mb-4">
            <div className="flex-shrink-0">
              <div className="avatar-xl rounded bg-primary-subtle d-flex align-items-center justify-content-center">
                <Icon icon="shield-lock" className="fs-24 text-primary" />
              </div>
            </div>
            <div className="ms-3">
              <h5 className="mb-1">Security Officer</h5>
              <p className="text-muted mb-0 fs-base">Handles platform safety and protocol reviews.</p>
            </div>
            <div className="ms-auto">
              <Dropdown>
                <DropdownToggle as="a" className="text-muted fs-xl drop-arrow-none">
                  <Icon icon="dots-vertical" />
                </DropdownToggle>
                <DropdownMenu align="end" className="dropdown-menu-end">
                  <DropdownItem>
                    <Icon icon="eye" className="me-2" />
                    View
                  </DropdownItem>
                  <DropdownItem className=" text-danger">
                    <Icon icon="trash" className="me-2" />
                    Remove
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
          <ul className="list-unstyled mb-3">
            <li className="d-flex align-items-center mb-2">
              <Icon icon="check" className="fs-lg text-success me-2" /> Daily Risk Assessment
            </li>
            <li className="d-flex align-items-center mb-2">
              <Icon icon="check" className="fs-lg text-success me-2" /> Manage Security Logs
            </li>
            <li className="d-flex align-items-center mb-2">
              <Icon icon="check" className="fs-lg text-success me-2" /> Control Access Rights
            </li>
            <li className="d-flex align-items-center">
              <Icon icon="check" className="fs-lg text-success me-2" /> Emergency Protocols
            </li>
          </ul>
          <p className="mb-2 text-muted">Total 17 users</p>
          <div className="avatar-group avatar-group-sm mb-3">
            <div className="avatar">
              <img src={user7} alt="user7" className="rounded-circle avatar-sm" />
            </div>
            <div className="avatar">
              <img src={user8} alt="user8" className="rounded-circle avatar-sm" />
            </div>
            <div className="avatar">
              <img src={user9} alt="user9" className="rounded-circle avatar-sm" />
            </div>
            <div className="avatar">
              <img src={user10} alt="user10" className="rounded-circle avatar-sm" />
            </div>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-muted fs-xs">
              <Icon icon="clock" className="me-1" />
              Updated 1 hour ago
            </span>
            <Button variant="outline-primary" size="sm" onClick={toggle} className="rounded-pill">
              Edit Role
            </Button>
          </div>
        </CardBody>
      </Card>
      <Modal show={show} onHide={toggle} className="fade" dialogClassName="modal-lg" id="editRoleModal" tabIndex={-1} aria-labelledby="editRoleModalLabel" aria-hidden="true">
        <ModalHeader>
          <h5 className="modal-title" id="editRoleModalLabel">
            Edit Role
          </h5>
          <button type="button" onClick={toggle} className="btn-close" aria-label="Close" />
        </ModalHeader>
        <form id="editRoleForm">
          <ModalBody>
            <Row className="g-3">
              <Col md={6}>
                <FormLabel htmlFor="editRoleName">Role Name</FormLabel>
                <FormControl type="text" id="editRoleName" defaultValue="Developer" required />
              </Col>
              <Col md={6}>
                <FormLabel htmlFor="editRoleDescription">Description</FormLabel>
                <FormControl type="text" id="editRoleDescription" defaultValue="Builds and maintains the platform core features." required />
              </Col>
              <Col xs={12}>
                <FormLabel htmlFor="editRoleResponsibilities">Key Responsibilities</FormLabel>
                <textarea className="form-control" id="editRoleResponsibilities" rows={4} required defaultValue={'Codebase Maintenance\nAPI Integration\nUnit Testing\nFeature Deployment'} />
                <small className="text-muted">Separate each item by comma or line</small>
              </Col>
              <Col md={6}>
                <FormLabel htmlFor="editRoleUsers">Assign Users</FormLabel>
                <FormSelect id="editRoleUsers" multiple>
                  <option value={1}>Leah Kim</option>
                  <option value={2}>David Tran</option>
                  <option value={3}>Michael Brown</option>
                  <option value={4}>Emma Wilson</option>
                </FormSelect>
                <small className="text-muted">Hold Ctrl (Windows) or Cmd (Mac) to select multiple users</small>
              </Col>
            </Row>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" type="button" onClick={toggle}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Changes
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </>
  )
}

export default MemberRoleCard
