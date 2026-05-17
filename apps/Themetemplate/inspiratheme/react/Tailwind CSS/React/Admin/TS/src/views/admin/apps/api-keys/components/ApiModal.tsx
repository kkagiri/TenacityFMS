
import Flatpickr from '@/components/wrappers/Flatpickr'
import Icon from '@/components/wrappers/Icon'
import { useState } from 'react'

const ApiModal = () => {
  const [apiKey, setApiKey] = useState('')

  const generateApiKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let key = ''

    for (let i = 0; i < 26; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    setApiKey(key)
  }

  return (
    <div id="addApiKeyModal" className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto" role="dialog" tabIndex={-1} aria-labelledby="addApiKeyModalLabel">
      <div className="hs-overlay-animation-target flex items-start justify-end m-3 max-w-sm md:w-full md:max-w-2xl lg:max-w-3xl">
        <div className="card pointer-events-auto flex w-full flex-col">
          <div className="border-default-300 flex items-center justify-between border-b p-6">
            <h3 id="addApiKeyModalLabel" className="card-title">
              Add New API Key
            </h3>
            <button type="button" aria-label="Close" data-hs-overlay="#addApiKeyModal">
              <Icon icon="x" className="text-xl" />
            </button>
          </div>
          <div className="card-body overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Client Name</label>
                <input type="text" className="form-input" placeholder="Enter client name" />
              </div>
              <div>
                <label className="form-label">Created By</label>
                <select className="form-select">
                  <option>Select user</option>
                  <option>Mark Reynolds</option>
                  <option>Sophia Turner</option>
                  <option>Liam Watson</option>
                  <option>Ava Turner</option>
                </select>
              </div>
              <div>
                <label className="form-label">API Key</label>
                <div className="relative">
                  <input type="text" value={apiKey} readOnly id="apiKeyInput" className="form-input" placeholder="Enter or generate API key" />
                  <button onClick={generateApiKey} type="button" className="btn bg-secondary absolute end-0 top-0 rounded-s-none text-white">
                    Generate
                  </button>
                </div>
              </div>
              <div>
                <label className="form-label">Status</label>
                <select className="form-select">
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Revoked">Revoked</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Trial">Trial</option>
                </select>
              </div>
              <div>
                <label className="form-label">Usage Limit</label>
                <input type="text" className="form-input" placeholder="e.g. 1000" />
              </div>
              <div>
                <label className="form-label">Region</label>
                <select className="form-select">
                  <option value="DE">🇩🇪 Germany</option>
                  <option value="UK">🇬🇧 UK</option>
                  <option value="IN">🇮🇳 India</option>
                  <option value="US">🇺🇸 USA</option>
                  <option value="AU">🇦🇺 Australia</option>
                  <option value="CA">🇨🇦 Canada</option>
                </select>
              </div>
              <div>
                <label className="form-label">Created On</label>
                <Flatpickr type="text" options={{ dateFormat: 'd M, Y', defaultDate: 'today' }} className="form-input" readOnly />
              </div>
              <div>
                <label className="form-label">Expires On</label>
                <Flatpickr type="text" options={{ dateFormat: 'd M, Y', defaultDate: 'today' }} className="form-input" readOnly />
              </div>
            </div>
          </div>
          <div className="p-4 flex items-center justify-end gap-x-2 border-t border-default-300">
            <button type="button" className="btn bg-light hover:text-primary" data-hs-overlay="#addApiKeyModal">
              Cancel
            </button>
            <button type="button" className="btn bg-primary text-white hover:bg-primary-hover">
              Add API Key
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApiModal
