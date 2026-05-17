import Icon from '@/components/wrappers/Icon'

const ChatEditModal = () => {
  return (
    <div
      id="createSingleChatModal"
      className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto"
      role="dialog"
      tabIndex={-1}
      aria-labelledby="createSingleChatModalLabel"
    >
      <div className="hs-overlay-animation-target hs-overlay-open:scale-100 hs-overlay-open:opacity-100 m-3 flex min-h-[calc(100%-56px)] scale-95 opacity-0 transition-all duration-200 ease-in-out md:mx-auto md:w-full md:max-w-lg">
        <div className="card pointer-events-auto flex w-full flex-col">
          <div className="card-header">
            <h3 id="createSingleChatModalLabel" className="text-sm font-bold">
              Start New Chat
            </h3>

            <button type="button" aria-label="Close" data-hs-overlay="#createSingleChatModal">
              <Icon icon="x" className="text-xl"></Icon>
            </button>
          </div>

          <div className="card-body overflow-y-auto">
            <div className="mb-5">
              <label htmlFor="recipientUser" className="form-label">
                Recipient
              </label>
              <input type="text" className="form-input" id="recipientUser" placeholder="Enter username or email" required />
            </div>

            <div>
              <label htmlFor="initialMessage" className="form-label">
                Message
              </label>
              <textarea className="form-textarea" id="initialMessage" rows={3} placeholder="Type your message here..." required></textarea>
            </div>
          </div>

          <div className="border-default-300 flex items-center justify-end gap-x-2 border-t border-dashed p-4">
            <button type="button" className="btn bg-light hover:text-primary" data-hs-overlay="#createSingleChatModal">
              Cancel
            </button>

            <button type="button" className="btn bg-primary text-white hover:bg-primary-hover">
              Send Message
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatEditModal
