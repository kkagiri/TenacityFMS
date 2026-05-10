import Mail from '@/assets/images/message-mail.png'
import Icon from '@/components/wrappers/Icon'
import { discussionMessages } from './data'

const Discussions = () => {
  return (
    <>
      <div className="card">
        <div className="card-header justify-between items-center">
          <h5 className="card-title">
            Discussions&nbsp;
            <span className="badge bg-primary/15 text-2xs text-primary">Pro+</span>
          </h5>
          <a href="" className="badge text-default-800 bg-light text-xs font-semibold">
            Mark all as read
          </a>
        </div>
        <div className="card-body bg-light/15! border-b border-default-300 border-dashed">
          <div className="flex gap-2.5">
            <div className="me-2.5 shrink-0">
              <img src={Mail} className="h-9" alt="message img" height={36} />
            </div>
            <div className="grow">
              <h4 className="text-sm mb-1.25">New messages</h4>
              <p className="text-xs text-default-400">
                You have <span className="text-default-700 font-semibold">22</span> new messages and <span className="text-default-700 font-semibold">16</span> waiting in draft folder.
              </p>
            </div>
          </div>
        </div>
        <div className="card-body pt-1.25!">
          <ul className="mb-5">
            {discussionMessages.map((msg, idx) => (
              <li className="py-2.5 border-b border-light" key={idx}>
                <div className="flex gap-2.5">
                  <div className="me-2.5 shrink-0">
                    {msg.hasAvatar ? (
                      <img src={msg.userImage} className="size-9 rounded-full" alt="user-8" />
                    ) : (
                      <div className="size-9 flex justify-center items-center bg-purple/15 text-purple rounded-full">
                        <span className="font-bold">{msg.userInitials}</span>
                      </div>
                    )}
                  </div>
                  <div className="grow text-default-400">
                    <h6 className="text-default-800 mb-1.25 text-sm flex justify-between">
                      {msg.userName}
                      <small className="text-xs text-default-500">{msg.timeAgo}</small>
                    </h6>
                    <p className="mb-1.25">{msg.message}</p>
                    <a href="" className="badge bg-primary/15 text-primary text-[10px]">
                      Reply
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="text-center mt-5">
            <a href="" className="underline flex gap-1 items-center justify-center font-semibold hover:text-primary">
              {' '}
              Go to Chat Room <Icon icon="send-2" />{' '}
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

export default Discussions
