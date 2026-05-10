import { useState } from 'react'
import { Button, Card, CardBody, CardHeader, CardTitle, Form, FormControl, FormGroup, FormLabel, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from 'react-bootstrap'
import { useToggle } from 'usehooks-ts'
export const BootstrapModal = () => {
  const [isStandardOpen, toggleStandard] = useToggle(false)
  const [isLargeOpen, toggleLarge] = useToggle(false)
  const [isSmallOpen, toggleSmall] = useToggle(false)
  const [isFullOpen, toggleFull] = useToggle(false)
  const [isScrollableOpen, toggleScrollable] = useToggle(false)
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Bootstrap Modals</CardTitle>
        </div>
      </CardHeader>
      <CardBody>
        <p className="text-muted">A rendered modal with header, body, and set of actions in the footer.</p>
        <Modal show={isStandardOpen} onHide={toggleStandard} id="standard-modal" className="fade" tabIndex={-1}>
          <ModalHeader closeButton>
            <ModalTitle as="h4" id="standard-modalLabel">
              Modal Heading
            </ModalTitle>
          </ModalHeader>
          <ModalBody>
            <h5>Text in a modal</h5>
            <p>Duis mollis, est non commodo luctus, nisi erat porttitor ligula.</p>
            <hr />
            <h5>Overflowing text to show scroll behavior</h5>
            <p>Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.</p>
            <p>Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.</p>
            <p className="mb-0">Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec sed odio dui. Donec ullamcorper nulla non metus auctor fringilla.</p>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="light" onClick={toggleStandard}>
              Close
            </Button>
            <Button type="button" className="btn-primary">
              Save changes
            </Button>
          </ModalFooter>
        </Modal>

        <Modal className="fade" show={isLargeOpen} onHide={toggleLarge} size="lg" id="bs-example-modal-lg" tabIndex={-1}>
          <ModalHeader closeButton>
            <ModalTitle as="h4" id="myLargeModalLabel">
              Large modal
            </ModalTitle>
          </ModalHeader>
          <ModalBody>...</ModalBody>
        </Modal>

        <Modal className="fade" id="bs-example-modal-sm" tabIndex={-1} show={isSmallOpen} onHide={toggleSmall} size="sm">
          <ModalHeader closeButton>
            <ModalTitle as="h4" id="mySmallModalLabel">
              Small modal
            </ModalTitle>
          </ModalHeader>
          <ModalBody>...</ModalBody>
        </Modal>

        <Modal id="full-width-modal" className="fade modal-full-width" show={isFullOpen} onHide={toggleFull} tabIndex={-1} dialogClassName="modal-full-width">
          <ModalHeader closeButton>
            <ModalTitle as="h4" id="fullWidthModalLabel">
              Modal Heading
            </ModalTitle>
          </ModalHeader>
          <ModalBody>
            <h5>Text in a modal</h5>
            <p>Duis mollis, est non commodo luctus, nisi erat porttitor ligula.</p>
            <hr />
            <h5>Overflowing text to show scroll behavior</h5>
            <p>Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.</p>
            <p>Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.</p>
            <p className="mb-0">Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec sed odio dui. Donec ullamcorper nulla non metus auctor fringilla.</p>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="light" onClick={toggleFull}>
              Close
            </Button>
            <Button type="button" className="btn btn-primary">
              Save changes
            </Button>
          </ModalFooter>
        </Modal>

        <Modal className="fade" id="scrollable-modal" tabIndex={-1} scrollable show={isScrollableOpen} onHide={toggleScrollable}>
          <ModalHeader closeButton>
            <h5 className="modal-title" id="scrollableModalTitle">
              Modal title
            </h5>
          </ModalHeader>
          <ModalBody>
            <p>Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.</p>
            <p>Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.</p>
            <p>Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec sed odio dui. Donec ullamcorper nulla non metus auctor fringilla.</p>
            <p>Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.</p>
            <p>Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.</p>
            <p>Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec sed odio dui. Donec ullamcorper nulla non metus auctor fringilla.</p>
            <p>Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.</p>
            <p>Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.</p>
            <p>Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec sed odio dui. Donec ullamcorper nulla non metus auctor fringilla.</p>
            <p>Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.</p>
            <p>Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.</p>
            <p>Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec sed odio dui. Donec ullamcorper nulla non metus auctor fringilla.</p>
            <p>Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.</p>
            <p>Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.</p>
            <p>Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec sed odio dui. Donec ullamcorper nulla non metus auctor fringilla.</p>
            <p>Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.</p>
            <p>Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.</p>
            <p className="mb-0">Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Donec sed odio dui. Donec ullamcorper nulla non metus auctor fringilla.</p>
          </ModalBody>
          <ModalFooter>
            <Button type="button" className="btn btn-secondary" onClick={toggleScrollable}>
              Close
            </Button>
            <Button type="button" className="btn btn-primary">
              Save changes
            </Button>
          </ModalFooter>
        </Modal>

        <div className="d-flex flex-wrap gap-2">
          <Button type="button" variant="primary" onClick={toggleStandard}>
            Standard Modal
          </Button>

          <Button type="button" variant="info" onClick={toggleLarge}>
            Large Modal
          </Button>

          <Button type="button" variant="success" onClick={toggleSmall}>
            Small Modal
          </Button>

          <Button type="button" variant="primary" onClick={toggleFull}>
            Full Width Modal
          </Button>

          <Button type="button" variant="secondary" onClick={toggleScrollable}>
            Scrollable Modal
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
export const ModalPosition = () => {
  const [topModal, toggleTopModal] = useToggle(false)
  const [bottomModal, toggleBottomModal] = useToggle(false)
  const [centerModal, toggleCenterModal] = useToggle(false)
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Modal Position</CardTitle>
        </div>
      </CardHeader>

      <CardBody>
        <p className="text-muted">
          Specify the position for the modal. You can display modal at top, bottom, or center of page by specifying classes <code>modal-top</code>, <code>modal-bottom</code>and <code>modal-dialog-centered</code>
          respectively.
        </p>

        <Modal id="top-modal" show={topModal} onHide={toggleTopModal} className="fade" tabIndex={-1} dialogClassName="modal-top">
          <ModalHeader closeButton>
            <ModalTitle as="h4" id="topModalLabel">
              Modal Heading
            </ModalTitle>
          </ModalHeader>
          <ModalBody>
            <h5 className="mt-0">Text in a modal</h5>
            <p className="mb-0">Duis mollis, est non commodo luctus, nisi erat porttitor ligula.</p>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="light" onClick={toggleTopModal}>
              Close
            </Button>
            <Button type="button" className="btn btn-primary">
              Save changes
            </Button>
          </ModalFooter>
        </Modal>

        <Modal id="bottom-modal" className="fade" tabIndex={-1} dialogClassName="modal-bottom" show={bottomModal} onHide={toggleBottomModal}>
          <ModalHeader closeButton>
            <ModalTitle as="h4" id="bottomModalLabel">
              Modal Heading
            </ModalTitle>
          </ModalHeader>
          <ModalBody>
            <h5 className="mt-0">Text in a modal</h5>
            <p className="mb-0">Duis mollis, est non commodo luctus, nisi erat porttitor ligula.</p>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="light" onClick={toggleBottomModal}>
              Close
            </Button>
            <Button type="button" className="btn btn-primary">
              Save changes
            </Button>
          </ModalFooter>
        </Modal>

        <Modal className="fade" id="centermodal" tabIndex={-1} centered show={centerModal} onHide={toggleCenterModal}>
          <ModalHeader closeButton>
            <ModalTitle as="h4" id="myCenterModalLabel">
              Center modal
            </ModalTitle>
          </ModalHeader>
          <ModalBody>
            <h5 className="mt-0">Overflowing text to show scroll behavior</h5>
            <p>Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.</p>
            <p className="mb-0">Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.</p>
          </ModalBody>
        </Modal>

        <div className="d-flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={toggleTopModal}>
            Top Modal
          </Button>

          <Button type="button" variant="secondary" onClick={toggleBottomModal}>
            Bottom Modal
          </Button>

          <Button type="button" variant="secondary" onClick={toggleCenterModal}>
            Center modal
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
export const MultipleModal = () => {
  const [isFirstOpen, toggleFirst] = useToggle(false)
  const [isSecondOpen, toggleSecond] = useToggle(false)
  const handleNext = () => {
    toggleFirst()
    toggleSecond()
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Multiple Modal</CardTitle>
        </div>
      </CardHeader>

      <CardBody>
        <p className="text-muted">Display a series of modals one by one to guide your users on multiple aspects or take step wise input.</p>

        <Modal show={isFirstOpen} onHide={toggleFirst}>
          <ModalHeader closeButton>
            <ModalTitle id="multiple-oneModalLabel">Modal Heading</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <h5 className="mt-0">Text in a modal</h5>
            <p className="mb-0">Duis mollis, est non commodo luctus, nisi erat porttitor ligula.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="primary" onClick={handleNext}>
              Next
            </Button>
          </ModalFooter>
        </Modal>

        <Modal show={isSecondOpen} onHide={toggleSecond}>
          <ModalHeader closeButton>
            <ModalTitle id="multiple-twoModalLabel">Modal Heading</ModalTitle>
          </ModalHeader>
          <ModalBody>
            <h5 className="mt-0">Text in a modal</h5>
            <p className="mb-0">Duis mollis, est non commodo luctus, nisi erat porttitor ligula.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={toggleSecond}>
              Close
            </Button>
          </ModalFooter>
        </Modal>

        <div className="d-flex flex-wrap gap-2">
          <Button variant="primary" onClick={toggleFirst}>
            Multiple Modal
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
export const ToggleBetweenModals = () => {
  const [isFirstOpen, toggleFirst] = useToggle(false)
  const [isSecondOpen, toggleSecond] = useToggle(false)
  const goToSecond = () => {
    toggleFirst()
    toggleSecond()
  }
  const goToFirst = () => {
    toggleSecond()
    toggleFirst()
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Toggle Between Modals</CardTitle>
        </div>
      </CardHeader>

      <CardBody>
        <p className="text-muted">Toggle between multiple modals with some clever placement of the buttons.</p>

        <Modal show={isFirstOpen} onHide={toggleFirst} centered>
          <ModalHeader closeButton>
            <ModalTitle>Modal 1</ModalTitle>
          </ModalHeader>
          <ModalBody>Show a second modal and hide this one with the button below.</ModalBody>
          <ModalFooter>
            <Button variant="primary" onClick={goToSecond}>
              Open second modal
            </Button>
          </ModalFooter>
        </Modal>

        <Modal show={isSecondOpen} onHide={toggleSecond} centered>
          <ModalHeader closeButton>
            <ModalTitle>Modal 2</ModalTitle>
          </ModalHeader>
          <ModalBody>Hide this modal and show the first with the button below.</ModalBody>
          <ModalFooter>
            <Button variant="primary" onClick={goToFirst}>
              Back to first
            </Button>
          </ModalFooter>
        </Modal>

        <Button variant="secondary" onClick={toggleFirst}>
          Open first modal
        </Button>
      </CardBody>
    </Card>
  )
}
export const FullscreenModal = () => {
  const [full, toggleFull] = useToggle(false)
  const [sm, toggleSm] = useToggle(false)
  const [md, toggleMd] = useToggle(false)
  const [lg, toggleLg] = useToggle(false)
  const [xl, toggleXl] = useToggle(false)
  const [xxl, toggleXxl] = useToggle(false)
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Fullscreen Modal</CardTitle>
        </div>
      </CardHeader>

      <CardBody>
        <p className="text-muted">
          Fullscreen modals cover the user viewport using modifier classes on
          <code>.modal-dialog</code>.
        </p>

        <div className="hstack gap-2 flex-wrap">
          <Button variant="primary" onClick={toggleFull}>
            Fullscreen Modal
          </Button>
          <Button variant="primary" onClick={toggleSm}>
            Full Screen Below sm
          </Button>
          <Button variant="primary" onClick={toggleMd}>
            Full Screen Below md
          </Button>
          <Button variant="primary" onClick={toggleLg}>
            Full Screen Below lg
          </Button>
          <Button variant="primary" onClick={toggleXl}>
            Full Screen Below xl
          </Button>
          <Button variant="primary" onClick={toggleXxl}>
            Full Screen Below xxl
          </Button>
        </div>

        <Modal show={full} onHide={toggleFull} dialogClassName="modal-fullscreen">
          <ModalHeader closeButton>
            <h5 className="modal-title">Full Screen Modal</h5>
          </ModalHeader>
          <ModalBody>...</ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={toggleFull}>
              Close
            </Button>
            <Button variant="primary">Save Changes</Button>
          </ModalFooter>
        </Modal>

        <Modal show={sm} onHide={toggleSm} dialogClassName="modal-fullscreen-sm-down">
          <ModalHeader closeButton>
            <h5 className="modal-title">Full Screen Below sm</h5>
          </ModalHeader>
          <ModalBody>...</ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={toggleSm}>
              Close
            </Button>
            <Button variant="primary">Save Changes</Button>
          </ModalFooter>
        </Modal>

        <Modal show={md} onHide={toggleMd} dialogClassName="modal-fullscreen-md-down">
          <ModalHeader closeButton>
            <h5 className="modal-title">Full Screen Below md</h5>
          </ModalHeader>
          <ModalBody>...</ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={toggleMd}>
              Close
            </Button>
            <Button variant="primary">Save Changes</Button>
          </ModalFooter>
        </Modal>

        <Modal show={lg} onHide={toggleLg} dialogClassName="modal-fullscreen-lg-down">
          <ModalHeader closeButton>
            <h5 className="modal-title">Full Screen Below lg</h5>
          </ModalHeader>
          <ModalBody>...</ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={toggleLg}>
              Close
            </Button>
            <Button variant="primary">Save Changes</Button>
          </ModalFooter>
        </Modal>

        <Modal show={xl} onHide={toggleXl} dialogClassName="modal-fullscreen-xl-down">
          <ModalHeader closeButton>
            <h5 className="modal-title">Full Screen Below xl</h5>
          </ModalHeader>
          <ModalBody>...</ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={toggleXl}>
              Close
            </Button>
            <Button variant="primary">Save Changes</Button>
          </ModalFooter>
        </Modal>

        <Modal show={xxl} onHide={toggleXxl} dialogClassName="modal-fullscreen-xxl-down">
          <ModalHeader closeButton>
            <h5 className="modal-title">Full Screen Below xxl</h5>
          </ModalHeader>
          <ModalBody>...</ModalBody>
          <ModalFooter>
            <Button variant="light" onClick={toggleXxl}>
              Close
            </Button>
            <Button variant="primary">Save Changes</Button>
          </ModalFooter>
        </Modal>
      </CardBody>
    </Card>
  )
}
export const StaticBackdrop = () => {
  const [isOpen, toggle] = useToggle(false)
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Static Backdrop</CardTitle>
        </div>
      </CardHeader>

      <CardBody>
        <p className="text-muted">
          When backdrop is set to <code>static</code>, the modal will not close when clicking outside it. Click the button below to try it.
        </p>

        <div className="d-flex flex-wrap gap-2">
          <Button variant="info" onClick={toggle}>
            Static Backdrop
          </Button>
        </div>

        <Modal show={isOpen} onHide={toggle} backdrop="static" keyboard={false} centered>
          <ModalHeader closeButton>
            <h5 className="modal-title">Modal title</h5>
          </ModalHeader>
          <ModalBody>
            <p className="m-0">I will not close if you click outside me. Don&apos;t even try to press escape key.</p>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={toggle}>
              Close
            </Button>
            <Button variant="primary">Understood</Button>
          </ModalFooter>
        </Modal>
      </CardBody>
    </Card>
  )
}
export const VaryingModalContent = () => {
  const [isOpen, toggle] = useToggle(false)
  const [recipient, setRecipient] = useState('')
  const openModal = (recipientName) => {
    setRecipient(recipientName)
    toggle()
  }
  return (
    <Card>
      <CardHeader>
        <div className="flex-grow-1">
          <CardTitle as="h4">Varying Modal Content</CardTitle>
        </div>
      </CardHeader>

      <CardBody>
        <p className="text-muted">Use buttons that trigger the same modal but with slightly different contents.</p>

        <div className="hstack gap-2 flex-wrap">
          <Button variant="primary" onClick={() => openModal('@mdo')}>
            Open modal for @mdo
          </Button>
          <Button variant="primary" onClick={() => openModal('@fat')}>
            Open modal for @fat
          </Button>
          <Button variant="primary" onClick={() => openModal('@getbootstrap')}>
            Open modal for @getbootstrap
          </Button>
        </div>

        <Modal show={isOpen} onHide={toggle}>
          <ModalHeader closeButton>
            <h5 className="modal-title">New message</h5>
          </ModalHeader>
          <ModalBody>
            <Form>
              <FormGroup className="mb-3">
                <FormLabel>Recipient:</FormLabel>
                <FormControl type="text" value={recipient} readOnly />
              </FormGroup>
              <FormGroup className="mb-3">
                <FormLabel>Message:</FormLabel>
                <FormControl as="textarea" aria-rowspan={3} />
              </FormGroup>
            </Form>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={toggle}>
              Close
            </Button>
            <Button variant="primary">Send message</Button>
          </ModalFooter>
        </Modal>
      </CardBody>
    </Card>
  )
}
