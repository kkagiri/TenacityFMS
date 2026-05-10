import Icon from '@/components/wrappers/Icon'
import { toPascalCase } from '@/utils/helpers'
import { productsTable } from './data'

const HoverableRows = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Hoverable Rows</h4>
      </div>
      <div className="card-body">
        <div className="table-wrapper">
          <table className="table table-hover">
            <thead className="font-semibold">
              <tr>
                {productsTable.header.map((header, idx) => (
                  <th key={idx}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productsTable.data.slice(0, 3).map((product, idx) => (
                <tr key={idx}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>${product.price.toFixed(2)}</td>
                  <td>{product.stock}</td>
                  <td>{product.rating} ★</td>
                  <td>
                    <span className={`badge badge-label ${product.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{toPascalCase(product.status)}</span>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default HoverableRows
