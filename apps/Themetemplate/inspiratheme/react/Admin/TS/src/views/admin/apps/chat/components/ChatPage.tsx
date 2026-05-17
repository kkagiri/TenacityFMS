import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import { generateInitials } from '@/utils/helpers'
import { Link } from 'react-router'
import { Fragment, useMemo, useRef, useState } from 'react'
import { Button, Card, CardFooter, CardHeader, FormControl, ListGroup, ListGroupItem, Offcanvas } from 'react-bootstrap'
import ChatToolbar from './ChatToolbar'
import { contactData, type ContactType, currentUser, messageThreadData } from './data'

type PropsType = {
  contacts: ContactType[]
  setContact: (contact: ContactType) => void
}

const ChatPage = () => {
  const [show, setShow] = useState(false)
  const [message, setMessage] = useState('')
  const chatRef = useRef<HTMLDivElement | null>(null)

  const [currentContact, setCurrentContact] = useState<ContactType>(contactData[0])
  const responses = ["Can't chat, calls only", '😑😑😑', '👍', 'Thanks!', 'Talk soon.', 'No worries 😄']

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight
      }
    }, 100)
  }

  const simulateIncomingMessage = () => {
    if (!currentThread) return

    const randomText = responses[Math.floor(Math.random() * responses.length)]

    const replyMessage = {
      id: crypto.randomUUID(),
      senderId: currentContact.id,
      text: randomText,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    currentThread.messages.push(replyMessage)

    setCurrentContact({ ...currentContact })
  }

  const handleSendMessage = () => {
    if (!message.trim() || !currentThread) return

    const newMessage = {
      id: crypto.randomUUID(),
      senderId: currentUser.id,
      text: message,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    currentThread.messages.push(newMessage)

    setMessage('')
    scrollToBottom()

    setTimeout(
      () => {
        simulateIncomingMessage()
        scrollToBottom()
      },
      Math.random() * 2000 + 1000
    )
  }

  const currentThread = useMemo(() => {
    return messageThreadData.find((thread) => thread.participants.some((p) => p.id === currentContact.id)) || null
  }, [currentContact])

  return (
    <div className="outlook-box">
      <Offcanvas responsive="lg" show={show} onHide={() => setShow(!show)} className="outlook-left-menu outlook-left-menu-lg">
        <ContactList contacts={contactData} setContact={setCurrentContact} />
      </Offcanvas>

      <Card className="h-100 mb-0 rounded-start-0 flex-grow-1">
        <CardHeader className="card-bg">
          <div className="d-lg-none d-inline-flex gap-2">
            <button className="btn btn-default btn-icon" type="button" onClick={() => setShow(!show)}>
              <Icon icon="menu-4" className="fs-lg" />
            </button>
          </div>

          <div className="flex-grow-1">
            <h5 className="mb-1 lh-base fs-lg">
              <Link to="/pages/profile" className="link-reset">
                {currentContact.name}
              </Link>
            </h5>
            <p className="mb-0 lh-sm text-muted" style={{ paddingTop: '1px' }}>
              <Icon icon="circle-filled" className={`me-1 ${currentContact.isOnline ? 'text-success' : 'text-danger'}`} /> {currentContact.isOnline ? 'Active' : 'Offline'}
            </p>
          </div>

          <ChatToolbar />
        </CardHeader>

        <SimpleBar scrollableNodeProps={{ ref: chatRef }} className="card-body pt-0 mb-5 pb-2" style={{ maxHeight: 'calc(100vh - 317px)' }}>
          {currentThread ? (
            currentThread.messages.map((message) => (
              <Fragment key={message.id}>
                {currentContact.id === message.senderId && (
                  <div className="d-flex align-items-start gap-2 my-3 chat-item">
                    {currentContact.image ? (
                      <img src={currentContact.image} width={36} height={36} className="avatar-md rounded-circle" alt="User" />
                    ) : (
                      <span className="avatar-sm flex-shrink-0">
                        <span className="avatar-title text-bg-primary fw-bold rounded-circle">{generateInitials(currentContact.name)}</span>
                      </span>
                    )}
                    <div>
                      <div className="chat-message py-2 px-3 bg-warning-subtle rounded">{message.text}</div>
                      <div className="text-muted d-inline-flex align-items-center gap-1 fs-xs mt-1">
                        <Icon icon="clock" /> {message.time}
                      </div>
                    </div>
                  </div>
                )}

                {currentUser.id === message.senderId && (
                  <div className="d-flex align-items-start gap-2 my-3 text-end chat-item justify-content-end">
                    <div>
                      <div className="chat-message py-2 px-3  bg-info-subtle rounded">{message.text}</div>
                      <div className="text-muted d-inline-flex align-items-center gap-1 fs-xs mt-1">
                        <Icon icon="clock" /> {message.time}
                      </div>
                    </div>
                    {currentUser.image ? (
                      <img src={currentUser.image} width={36} height={36} className="avatar-md rounded-circle" alt="User" />
                    ) : (
                      <span className="avatar-sm flex-shrink-0">
                        <span className="avatar-title text-bg-primary fw-bold rounded-circle w-25 h-25">{generateInitials(currentUser.name)}</span>
                      </span>
                    )}
                  </div>
                )}
              </Fragment>
            ))
          ) : (
            <div className="d-flex align-items-center justify-content-center my-5">
              <Icon icon="message" className="text-muted me-1 fs-1" />
              <span>No messages found.</span>
            </div>
          )}
        </SimpleBar>

        <CardFooter className="bg-body-secondary border-top border-dashed border-bottom-0 position-absolute bottom-0 w-100">
          <div className="d-flex gap-2">
            <div className="app-search flex-grow-1">
              <FormControl
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage()
                }}
                className="py-2 bg-light-subtle border-light"
                placeholder="Enter message..."
              />

              <Icon icon="message" className="app-search-icon text-muted" />
            </div>
            <Button variant="primary" onClick={handleSendMessage}>
              Send <Icon icon="send-2" className="ms-1 fs-xl" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default ChatPage

const ContactList = ({ contacts, setContact }: PropsType) => {
  const [currentContact, setCurrentContact] = useState<ContactType>(contacts[0])

  return (
    <>
      <Card className="h-100 mb-0 border-end-0 rounded-end-0">
        <CardHeader className="p-3 border-light card-bg d-block">
          <div className="d-flex gap-2">
            <div className="app-search flex-grow-1">
              <FormControl type="text" className="bg-light-subtle border-light" placeholder="Search here..." />
              <Icon icon="search" className="app-search-icon text-muted" />
            </div>
            <Button variant="dark" className="btn-icon">
              <Icon icon="pencil" className="fs-xl" />
            </Button>
          </div>
        </CardHeader>
        <SimpleBar className="card-body p-2" style={{ height: 'calc(100% - 100px)' }}>
          <ListGroup variant="flush" className="chat-list">
            {contacts.map((contact) => (
              <ListGroupItem
                key={contact.id}
                action
                className={`d-flex gap-2 justify-content-between ${contact.id === currentContact.id ? 'active' : ''}`}
                onClick={() => {
                  setContact(contact)
                  setCurrentContact(contact)
                }}
              >
                <span className="d-flex justify-content-start align-items-center gap-2 overflow-hidden">
                  <span className="avatar avatar-sm flex-shrink-0">
                    {contact.image ? <img src={contact.image} alt="" height={36} width={36} className="img-fluid rounded-circle" /> : <span className="avatar-title text-bg-primary fw-bold rounded-circle">{generateInitials(contact.name)}</span>}
                  </span>
                  <span className="overflow-hidden">
                    <span className="text-nowrap fw-semibold fs-base mb-0 lh-base">{contact.name}</span>
                    {contact.lastMessage && <span className="text-muted d-block fs-xs mb-0 text-truncate">{contact.lastMessage}</span>}
                  </span>
                </span>
                <span className="d-flex flex-column gap-1 justify-content-center flex-shrink-0 align-items-end">
                  {contact.timestamp && <span className="text-muted fs-xs">{contact.timestamp}</span>}
                  {contact.unreadMessages && <span className="badge text-bg-primary fs-xxs">{contact.unreadMessages}</span>}
                </span>
              </ListGroupItem>
            ))}
          </ListGroup>
        </SimpleBar>
      </Card>
    </>
  )
}
