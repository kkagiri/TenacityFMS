import Icon from '@/components/wrappers/Icon'

const ActiveTable = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Active Tables</h4>
      </div>
      <div className="card-body">
        <div className="table-wrapper">
          <table className="table">
            <thead className="font-semibold">
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Rating</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-default-300 bg-default-100 border-b">
                <td className="font-medium">Bluetooth Speaker</td>
                <td>Audio</td>
                <td>$49.00</td>
                <td>200</td>
                <td>4.6 ★</td>
                <td>
                  <span className="badge badge-label bg-primary/10 text-primary">Active</span>
                </td>
                <td className="text-end">
                  <div className="hs-dropdown relative inline-flex">
                    <button type="button" className="hs-dropdown-toggle flex h-7.5 w-11.25 items-center justify-center font-semibold" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown" hs-dropdown-placement="bottom-end">
                      <Icon icon="dots-vertical" className="text-xl" />
                    </button>
                    <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
                      <div>
                        <a className="dropdown-item" href="">
                          <Icon icon="eye" className="text-xs" />
                          Overview
                        </a>
                        <a className="dropdown-item" href="">
                          <Icon icon="edit" className="text-xs" />
                          Edit
                        </a>
                        <a className="dropdown-item text-danger" href="">
                          <Icon icon="trash" className="text-xs" />
                          Delete
                        </a>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="font-medium">Leather Wallet</td>
                <td>Accessories</td>
                <td>$29.99</td>
                <td>150</td>
                <td>4.3 ★</td>
                <td>
                  <span className="badge badge-label bg-primary/10 text-primary">Active</span>
                </td>
                <td className="text-end">
                  <div className="hs-dropdown relative inline-flex">
                    <button type="button" className="hs-dropdown-toggle flex h-7.5 w-11.25 items-center justify-center font-semibold" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown" hs-dropdown-placement="bottom-end">
                      <Icon icon="dots-vertical" className="text-xl" />
                    </button>
                    <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
                      <div>
                        <a className="dropdown-item" href="">
                          <Icon icon="eye" className="text-xs" />
                          Overview
                        </a>
                        <a className="dropdown-item" href="">
                          <Icon icon="edit" className="text-xs" />
                          Edit
                        </a>
                        <a className="dropdown-item text-danger" href="">
                          <Icon icon="trash" className="text-xs" />
                          Delete
                        </a>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="font-medium">Fitness Tracker</td>
                <td>Wearables</td>
                <td className="bg-default-100 px-2 py-3">$89.00</td>
                <td>60</td>
                <td>4.1 ★</td>
                <td>
                  <span className="badge badge-label bg-warning/10 text-warning">Limited Stock</span>
                </td>
                <td className="text-end">
                  <div className="hs-dropdown relative inline-flex">
                    <button type="button" className="hs-dropdown-toggle flex h-7.5 w-11.25 items-center justify-center font-semibold" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown" hs-dropdown-placement="bottom-end">
                      <Icon icon="dots-vertical" className="text-xl" />
                    </button>
                    <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
                      <div>
                        <a className="dropdown-item" href="">
                          <Icon icon="eye" className="text-xs" />
                          Overview
                        </a>
                        <a className="dropdown-item" href="">
                          <Icon icon="edit" className="text-xs" />
                          Edit
                        </a>
                        <a className="dropdown-item text-danger" href="">
                          <Icon icon="trash" className="text-xs" />
                          Delete
                        </a>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ActiveTable
