import user2 from '@/assets/images/users/user-2.jpg'
import user5 from '@/assets/images/users/user-5.jpg'
import Icon from '@/components/wrappers/Icon'
import { SimpleBar } from '@/components/wrappers/SimpleBar'
import { cn } from '@/utils/helpers'
import { useState } from 'react'
import { messages } from './data'

const CommentCard = () => {
  const [chatMessages, setChatMessages] = useState(messages)
  const [input, setInput] = useState('')

  const handleSend = (e: any) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    const now = new Date()
    const h = now.getHours()
    const m = now.getMinutes()
    const ampm = h >= 12 ? 'pm' : 'am'
    const hour = h % 12 || 12
    const min = m < 10 ? `0${m}` : m
    const timeStr = `${hour}:${min} ${ampm}`
    setChatMessages((prev) => [
      ...prev,
      {
        message: text,
        time: timeStr,
        fromUser: true,
        avatar: user2,
      },
    ])
    setInput('')
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          message: text,
          time: timeStr,
          fromUser: false,
          avatar: user5,
        },
      ])
    }, 1000)
  }
  return (
    <div className="flex flex-col gap-base">
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Chat</h4>
        </div>

        <SimpleBar className="card-body h-95 py-0">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={cn('my-5 flex items-start gap-2.5', msg.fromUser && 'justify-end')}>
              {!msg.fromUser && <img src={msg.avatar} className="size-9 rounded-full" alt="User" />}

              <div>
                <div className={cn('font-medium rounded px-5 py-2.5', msg.fromUser ? 'bg-info/15' : 'bg-warning/15')}>{msg.message}</div>

                <div className={cn('text-default-400 mt-1.25 flex items-center gap-1 text-xs', msg.fromUser && 'justify-end')}>
                  <Icon icon="clock"></Icon>
                  {msg.time}
                </div>
              </div>

              {msg.fromUser && <img src={msg.avatar} className="size-9 rounded-full" alt="User" />}
            </div>
          ))}
        </SimpleBar>

        <div className="border-default-300 border-t border-dashed px-5 py-3.75">
          <div className="flex gap-2.5" onSubmit={handleSend}>
            <div className="input-icon-group grow">
              <Icon icon="message-dots" className="input-icon text-default-400"></Icon>
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} className="form-input border-light bg-light/20" placeholder="Enter message..." />
            </div>

            <a href="" className="btn btn-icon bg-primary size-9.5 text-white">
              <Icon icon="send-2" className="text-xl"></Icon>
            </a>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 grid-cols-1 gap-base">
        <div>
          <div className="card text-white bg-purple border-0">
            <div className="card-body">
              <div className="flex items-center mb-5 gap-2.5">
                <div className="">
                  <span className="flex justify-center items-center size-9 bg-light/20 text-white rounded-full">
                    <Icon icon="phone" className="text-xl" />
                  </span>
                </div>
                <p className="font-semibold">PHONE</p>
              </div>
              <h5 className="mb-1.25 text-white/75">+1 800 123 4567</h5>
              <h5 className="mb-0 text-white/75">+1 800 765 4321</h5>
            </div>
          </div>
        </div>
        <div>
          <div className="card text-white bg-success border-0">
            <div className="card-body">
              <div className="flex items-center mb-5 gap-2.5">
                <div className="">
                  <span className="flex justify-center items-center size-9 bg-light/20 text-white rounded-full">
                    <Icon icon="mail" className="text-xl" />
                  </span>
                </div>
                <p className="font-semibold">EMAIL</p>
              </div>
              <h5 className="mb-1.25 text-white/75">support@example.com</h5>
              <h5 className="mb-0 text-white/75">sales@example.com</h5>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommentCard
