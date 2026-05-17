import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import clsx from 'clsx'
import { useState } from 'react'
import { Button, CardBody, CardHeader, Form, ListGroup, ListGroupItem, Offcanvas, OverlayTrigger, Tooltip } from 'react-bootstrap'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MessageType, messageData } from './data'

const OutlookPage = () => {
  const [message, setMessages] = useState<MessageType>(messageData[1])

  const [show, setShow] = useState(false)

  return (
    <div className="outlook-box">
      <Offcanvas responsive="lg" show={show} onHide={() => setShow(!show)} className="offcanvas-lg offcanvas-start outlook-left-menu">
        <SideBar messages={messageData} setMessages={setMessages} />
      </Offcanvas>

      <SimpleBar className="card h-100 mb-0 rounded-start-0 border-start-0 flex-grow-1" data-simplebar-md>
        <CardHeader className="d-lg-none d-flex">
          <Button size="sm" className="btn-default btn-icon" type="button" onClick={() => setShow(!show)}>
            <Icon icon="menu-4" className="fs-lg" />
          </Button>
        </CardHeader>

        <CardBody>
          <div>
            <div className="d-flex justify-content-between gap-2">
              <div>
                <div className="text-muted mb-2">
                  <Icon icon="clock" /> {message.body.timestamp}
                </div>
                <h2 className="fs-xl mb-3">{message.body.title}</h2>
              </div>

              <div>
                <OverlayTrigger placement="left" overlay={<Tooltip>Plug this message</Tooltip>}>
                  <Button size="sm" className="btn-default me-1">
                    <Icon icon="plug" className="me-1" /> Plug it
                  </Button>
                </OverlayTrigger>
                <OverlayTrigger placement="top" overlay={<Tooltip>Mark as read</Tooltip>}>
                  <Button size="sm" className="btn-icon btn-default me-1">
                    <Icon icon="eye" />
                  </Button>
                </OverlayTrigger>
                <OverlayTrigger placement="top" overlay={<Tooltip>Mark as important</Tooltip>}>
                  <Button size="sm" className="btn-icon btn-default me-1">
                    <Icon icon="alert-circle" />
                  </Button>
                </OverlayTrigger>
                <OverlayTrigger placement="top" overlay={<Tooltip>Move to trash</Tooltip>}>
                  <Button size="sm" className="btn-icon btn-default">
                    <Icon icon="trash" />
                  </Button>
                </OverlayTrigger>
              </div>
            </div>

            <Markdown remarkPlugins={[remarkGfm]}>{message.body.content}</Markdown>

            <Form className="my-3">
              <div className="mb-3">
                <textarea className="form-control" rows={4} placeholder="Enter your reply..." />
              </div>
              <div className="text-end">
                <Button variant="secondary" type="submit">
                  Submit <Icon icon="send-2" className="align-baseline ms-1" />
                </Button>
              </div>
            </Form>
          </div>
        </CardBody>
      </SimpleBar>
    </div>
  )
}

export default OutlookPage

const SideBar = ({ messages, setMessages }: { messages: MessageType[]; setMessages: (message: MessageType) => void }) => {
  const [active, setActive] = useState(messages[1])

  return (
    <SimpleBar className="card h-100 mb-0 rounded-end-0">
      <CardBody className="p-0">
        <ListGroup as="ul" variant="flush" className="outlook-list mb-0">
          {messages.map((item, idx) => (
            <ListGroupItem
              as="li"
              key={idx}
              className="p-0"
              role="button"
              onClick={() => {
                setMessages(item)
                setActive(item)
              }}
            >
              <span className={clsx('nav-link p-3', { active: item.id === active.id })}>
                <span className="d-flex justify-content-between align-items-center mb-1">
                  <span className="ff-secondary fw-semibold">{item.name}</span>
                  <small className="float-end text-muted">{item.date}</small>
                </span>

                <span className="mb-2 d-block fs-xs text-muted">{item.summary}</span>

                <span className="d-flex align-items-center flex-wrap justify-content-between">
                  <span>
                    <Icon icon="map-pin" /> {item.location}
                  </span>
                  {item.badge && <span className={`badge text-bg-${item.badge.variant} badge-label`}>{item.badge.label}</span>}
                </span>
              </span>
            </ListGroupItem>
          ))}
        </ListGroup>
      </CardBody>
    </SimpleBar>
  )
}
