import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import { generateInitials } from '@/utils/helpers'
import { Link } from 'react-router'
import { Fragment, useMemo, useState } from 'react'
import ChatEditModal from './ChatEditModal'
import ChatToolbar from './ChatToolbar'
import ContactList from './ContactList'
import { contactData, type ContactType, currentUser, messageThreadData } from './data'

const ChatPage = () => {
  const [currentContact, setCurrentContact] = useState<ContactType>(contactData[0])

  const currentThread = useMemo(() => {
    return messageThreadData.find((thread) => thread.participants.some((p) => p.id === currentContact.id)) || null
  }, [currentContact])

  return (
    <>
      <div className="flex h-[calc(100vh-190px)]">
        <div
          id="chatSidebaroffcanvas"
          className="hs-overlay hs-overlay-open:translate-x-0 fixed start-0 top-0 bottom-0 z-70 h-full w-80 -translate-x-full transform bg-card transition-all duration-300 [--auto-close:lg] lg:static lg:block lg:translate-x-0"
          role="dialog"
          tabIndex={-1}
          aria-label="Sidebar"
        >
          <ContactList contacts={contactData} setContact={setCurrentContact} />
        </div>

        <div className="card min-w-0 flex-1 rounded-s-none">
          <div className="card-header">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-start lg:hidden!">
                <button className="btn btn-sm btn-icon border-default-300">
                  <Icon icon="menu-4" className="text-default-600 size-6" aria-haspopup="dialog" aria-expanded="false" aria-controls="chatSidebaroffcanvas" aria-label="Toggle navigation" data-hs-overlay="#chatSidebaroffcanvas"></Icon>
                </button>
              </div>

              <div>
                <h5 className="text-base mb-1.25">
                  <Link to="" className="hover:text-primary">
                    {currentContact.name}
                  </Link>
                </h5>

                <p className="text-default-400 flex items-center leading-tight gap-1.5">
                  <Icon icon="circle-filled" className="text-success" />
                  {currentContact.isOnline ? 'Active' : 'Offline'}
                </p>
              </div>
            </div>
            <ChatToolbar />
          </div>

          <SimpleBar className="h-[calc(100vh-333px)]">
            <div id="chat-container" className="card-body pb-2.5 py-0">
              {currentThread ? (
                currentThread.messages.map((message, idx) => (
                  <Fragment key={idx}>
                    {currentContact.id === message.senderId && (
                      <div className="my-5 flex items-start gap-2.5">
                        {currentContact.image ? (
                          <img src={currentContact.image} className="size-9 rounded-full" alt="User" />
                        ) : (
                          <div className="bg-primary flex size-8 items-center justify-center rounded-full font-semibold text-white">{generateInitials(currentContact.name)}</div>
                        )}
                        <div>
                          <div className="bg-warning/15 rounded px-6 py-3">{message.text}</div>
                          <div className="text-default-400 mt-1.5 flex items-center gap-1 text-xs">
                            <Icon icon="clock" /> {message.time}
                          </div>
                        </div>
                      </div>
                    )}

                    {currentUser.id === message.senderId && (
                      <div className="my-5 flex items-start justify-end gap-2.5">
                        <div>
                          <div className="bg-info/15 rounded px-6 py-3">{message.text}</div>
                          <div className="text-default-400 mt-1.5 flex items-center justify-end gap-1 text-xs">
                            <Icon icon="clock" />
                            {message.time}
                          </div>
                        </div>
                        {currentUser.image ? <img src={currentUser.image} className="size-9 rounded-full" alt="User" /> : <div className="bg-primary flex size-8 items-center justify-center rounded-full font-semibold text-white">{generateInitials(currentUser.name)}</div>}
                      </div>
                    )}
                  </Fragment>
                ))
              ) : (
                <p>No messages yet</p>
              )}
            </div>
          </SimpleBar>

          <div className="border-t border-default-300 border-dashed px-6 py-3.75">
            <div className="flex gap-2">
              <div className="input-icon-group grow">
                <Icon icon="message" className="input-icon" />
                <input type="text" className="form-input bg-light/20" placeholder="Enter message..." />
              </div>
              <button className="btn bg-primary text-white hover:bg-primary-hover">
                Send <Icon icon="send-2" className="ms-1 text-xl" />
              </button>
            </div>
          </div>
        </div>

        <ChatEditModal />
      </div>
    </>
  )
}

export default ChatPage
