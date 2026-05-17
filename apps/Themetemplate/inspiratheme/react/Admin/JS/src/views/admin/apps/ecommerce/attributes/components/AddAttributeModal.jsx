import Icon from '@/components/wrappers/Icon'
import { Button, Col, Form, FormCheck, FormControl, FormLabel, FormSelect, Modal, ModalHeader, ModalTitle, Row } from 'react-bootstrap'
const AddAttributeModal = ({ show, handleClose }) => {
  return (
    <Modal show={show} onHide={handleClose} centered size="lg" backdrop="static">
      <ModalHeader closeButton>
        <ModalTitle as="h5" className="fw-semibold">
          <Icon icon="circle-dashed-plus" className="me-2"></Icon>
          Add New Attribute
        </ModalTitle>
      </ModalHeader>

      <Form id="addAttributeForm">
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <FormLabel htmlFor="attributeName" className="fw-semibold">
                Attribute Name
              </FormLabel>
              <FormControl type="text" id="attributeName" placeholder="e.g. Color, Size, Material" required />
            </Col>

            <Col md={6}>
              <FormLabel htmlFor="attributeType" className="fw-semibold">
                Type
              </FormLabel>
              <FormSelect required>
                <option value="">Select Type</option>
                <option value="Dropdown">Dropdown</option>
                <option value="Text">Text</option>
                <option value="Number">Number</option>
              </FormSelect>
            </Col>

            <Col xs={12}>
              <FormLabel htmlFor="attributeValues" className="fw-semibold">
                Values
              </FormLabel>
              <textarea className="form-control" id="attributeValues" rows={2} placeholder="Separate multiple values with commas (e.g. Red, Blue, Green)" />
              <small className="text-muted d-block mt-1">Applicable only for Dropdown or selectable attributes.</small>
            </Col>

            <Col xs={12}>
              <FormCheck type="switch" id="attributeStatus" label="Active" className="fw-semibold" defaultChecked />
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="light" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="danger" type="submit">
            <Icon icon="device-floppy" className="me-1"></Icon>
            Save Attribute
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
export default AddAttributeModal
