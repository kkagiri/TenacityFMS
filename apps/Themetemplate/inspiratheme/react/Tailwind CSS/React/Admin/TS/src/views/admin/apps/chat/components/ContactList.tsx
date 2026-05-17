import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import { cn, generateInitials } from '@/utils/helpers'
import { Link } from 'react-router'
import { useState } from 'react'
import { ContactType } from './data'

type PropsType = {
  contacts: ContactType[]
  setContact: (contact: ContactType) => void
}

const ContactList = ({ contacts, setContact }: PropsType) => {
  const [currentContact, setCurrentContact] = useState<ContactType>(contacts[0])
  return (
    <>
      <div className="card rounded-e-none">
        <div className="card-header p-5 gap-3">
          <div className="input-icon-group grow">
            <Icon icon="search" className="input-icon" />
            <input type="search" placeholder="Search here..." className="form-input bg-light/30" />
          </div>

          <button className="btn bg-dark btn-icon size-9.25 text-white" aria-haspopup="dialog" aria-expanded="false" aria-controls="createSingleChatModal" data-hs-overlay="#createSingleChatModal">
            <Icon icon="pencil" className="text-lg" />
          </button>
        </div>

        <SimpleBar id="chat-sidebar" className="lg:h-[calc(100vh-265px)] h-screen p-2.5">
          <div className="*:[.active]:bg-default-100 *:hover:bg-default-100 space-y-0.5">
            {contacts.map((contact, idx) => (
              <Link
                to=""
                onClick={() => {
                  setContact(contact)
                  setCurrentContact(contact)
                }}
                className={cn('block w-full rounded', { active: contact.id === currentContact.id })}
                key={idx}
              >
                <div className="flex justify-between gap-2.5 px-3.75 py-3">
                  <div className="flex items-center gap-2.5">
                    {contact.image ? <img src={contact.image} alt="avatar-4" className="size-8 rounded-full" /> : <div className="bg-primary flex size-8 items-center justify-center rounded-full font-semibold text-white">{generateInitials(contact.name)}</div>}
                    <span className="text-start overflow-hidden">
                      <span className="font-semibold text-nowrap">{contact.name}</span>
                      <span className="text-default-400 block truncate text-xs max-w-40">{contact.lastMessage}</span>
                    </span>
                  </div>

                  <span className="flex shrink-0 flex-col items-end justify-center gap-1.25">
                    {contact.timestamp && <span className="text-default-400 text-xs">{contact.timestamp}</span>}
                    {contact.unreadMessages && <span className="badge text-2xs bg-primary text-white">{contact.unreadMessages}</span>}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </SimpleBar>
      </div>
    </>
  )
}

export default ContactList
