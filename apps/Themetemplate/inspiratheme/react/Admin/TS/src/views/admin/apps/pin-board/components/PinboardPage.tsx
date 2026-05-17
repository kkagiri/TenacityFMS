import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { Link } from 'react-router'
import { FormEvent, useState } from 'react'
import { Button, Card, CardBody, Col, Form, FormControl, FormLabel, FormSelect, Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle, Row } from 'react-bootstrap'
import { useToggle } from 'usehooks-ts'
import { pinNoteData, PinNoteType } from './data'

const PinboardPage = () => {
  const [pinNotes, setPinNotes] = useState<PinNoteType[]>(pinNoteData)
  const [showModal, toggleModal] = useToggle(false)

  const handleAddNote = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const title = (form.elements.namedItem('noteTitle') as HTMLInputElement).value
    const description = (form.elements.namedItem('noteContent') as HTMLTextAreaElement).value
    const className = (form.elements.namedItem('noteColor') as HTMLSelectElement).value

    const newNote: PinNoteType = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString(),
      title,
      description,
      className: className,
    }

    setPinNotes((prev) => [...prev, newNote])
    toggleModal()
    form.reset()
  }

  const handleDelete = (id: string) => {
    setPinNotes((prev) => prev.filter((note) => note.id !== id))
  }
  return (
    <>
      <Row>
        <Col xs={12}>
          <Card className="bg-transparent">
            <CardBody>
              <div className="pin-board d-flex flex-wrap">
                {pinNotes.map((note) => (
                  <div key={note.id} className={clsx('pin-board-item', note.className)}>
                    <p className="text-end fs-10">{note.timestamp}</p>
                    <h4 className="fs-md">{note.title}</h4>
                    <p>{note.description}</p>
                    <Link
                      to=""
                      className="pin-board-delete fs-lg"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(note.id)
                      }}
                    >
                      <Icon icon="trash" />
                    </Link>
                  </div>
                ))}
                <div className="pin-board-item pin-board-add d-flex align-items-center justify-content-center">
                  <Button variant="primary" className="btn-icon" onClick={toggleModal}>
                    <Icon icon="plus" />
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
      <AddPinNoteModal show={showModal} toggleModal={toggleModal} handleSubmit={handleAddNote} />
    </>
  )
}

export default PinboardPage

const AddPinNoteModal = ({ show, toggleModal, handleSubmit }: { show: boolean; toggleModal: () => void; handleSubmit: (e: FormEvent<HTMLFormElement>) => void }) => {
  return (
    <Modal show={show} onHide={toggleModal} centered aria-labelledby="addNoteModalLabel">
      <ModalHeader>
        <ModalTitle as="h5">Add New Note</ModalTitle>
        <Button variant="" className="btn-close" onClick={toggleModal} aria-label="Close" />
      </ModalHeader>

      <Form onSubmit={handleSubmit}>
        <ModalBody>
          <div className="mb-3">
            <FormLabel className="form-label fw-semibold">Title</FormLabel>
            <FormControl type="text" name="noteTitle" placeholder="Enter note title" required />
          </div>

          <div className="mb-3">
            <FormLabel className="form-label fw-semibold">Note Content</FormLabel>
            <textarea className="form-control" name="noteContent" rows={3} placeholder="Write your note..." required />
          </div>

          <div>
            <FormLabel className="form-label fw-semibold">Color Theme</FormLabel>
            <FormSelect name="noteColor" defaultValue="success">
              <option value="bg-success-subtle">Green (Success)</option>
              <option value="bg-primary-subtle">Blue (Primary)</option>
              <option value="bg-warning-subtle">Yellow (Warning)</option>
              <option value="bg-danger-subtle">Red (Danger)</option>
              <option value="bg-light-subtle">Light</option>
            </FormSelect>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="secondary" onClick={toggleModal}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Add Note
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  )
}
