import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'

const InputGroup = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Input Group</h4>
      </div>

      <div className="card-body">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-base">
          <div>
            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Username</label>
              </div>

              <div className="lg:col-span-2">
                <div className="input-group">
                  <span className="input-group-text">@</span>
                  <input type="text" placeholder="Username" className="form-input" />
                </div>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Amount</label>
              </div>

              <div className="lg:col-span-2">
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input type="text" className="form-input" />
                  <span className="input-group-text">.00</span>
                </div>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Textarea</label>
              </div>

              <div className="lg:col-span-2">
                <div className="input-group">
                  <span className="input-group-text">With textarea</span>
                  <textarea rows={2} className="form-textarea"></textarea>
                </div>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="mt-2 block font-semibold">Wrapping</label>
              </div>

              <div className="lg:col-span-2">
                <div className="input-group">
                  <span className="input-group-text">@</span>
                  <input type="text" placeholder="Username" className="form-input" />
                </div>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Input + Button</label>
              </div>

              <div className="lg:col-span-2">
                <div className="input-group">
                  <input type="text" placeholder="Recipient's username" className="form-input" />
                  <button type="button" className="btn bg-dark text-white hover:bg-dark-hover">
                    Button
                  </button>
                </div>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="formFileMultiple01" className="form-label py-2 mb-0!">
                  Multiple Files
                </label>
              </div>

              <div className="lg:col-span-2">
                <input type="file" name="file-input" id="formFileMultiple01" className="form-input" multiple />
              </div>
            </div>
          </div>

          <div>
            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Recipient</label>
              </div>

              <div className="lg:col-span-2">
                <div className="input-group">
                  <input type="text" placeholder="Recipient's username" className="form-input" />
                  <span className="input-group-text">@example.com</span>
                </div>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Email Login</label>
              </div>

              <div className="lg:col-span-2">
                <div className="input-group">
                  <input type="text" placeholder="Username" className="form-input" />
                  <span className="input-group-text">@</span>
                  <input type="text" placeholder="Server" className="form-input" />
                </div>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Vanity URL</label>
              </div>

              <div className="lg:col-span-2">
                <div className="input-group">
                  <span className="input-group-text text-nowrap">https://example.com/users/</span>
                  <input type="text" className="form-input" />
                </div>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="mt-2 block font-semibold">Dropdown + Input</label>
              </div>

              <div className="lg:col-span-2">
                <div className="input-group">
                  <div className="hs-dropdown relative inline-flex [--auto-close:inside]">
                    <button type="button" className="hs-dropdown-toggle btn bg-primary rounded-e-none text-white hover:bg-primary-hover" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
                      Dropdown <Icon icon="chevron-down" className="text-base text-white" />
                    </button>

                    <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
                      <div className="space-y-0.5">
                        <Link className="dropdown-item" to="">
                          Action
                        </Link>

                        <Link className="dropdown-item active" to="">
                          Another action
                        </Link>

                        <Link className="dropdown-item" to="">
                          Something else here
                        </Link>
                      </div>
                    </div>
                  </div>
                  <input type="text" className="form-input" />
                </div>
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label htmlFor="inputGroupFile04" className="form-label py-2 mb-0!">
                  File Input
                </label>
              </div>

              <div className="lg:col-span-2">
                <input type="file" name="file-input" id="inputGroupFile04" className="form-input" />
              </div>
            </div>

            <div className="border-default-300 my-base border-t border-dashed"></div>

            <div className="grid grid-cols-1 gap-1.5 lg:grid-cols-3 lg:gap-9">
              <div>
                <label className="form-label py-2 mb-0!">Input Group Select</label>
              </div>

              <div className="lg:col-span-2">
                <div className="input-group">
                  <span className="input-group-text">Options</span>
                  <select className="form-input rounded-s-none!">
                    <option defaultValue={'one'}>Choose...</option>
                    <option>One</option>
                    <option>Two</option>
                    <option>Three</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InputGroup
