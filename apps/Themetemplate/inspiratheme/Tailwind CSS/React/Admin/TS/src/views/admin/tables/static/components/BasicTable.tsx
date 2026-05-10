import { toPascalCase } from '@/utils/helpers'
import { productsTable } from './data'

const BasicTable = () => {
  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">Basic Table</h4>
      </div>
      <div className="card-body">
        <div className="table-wrapper">
          <table className="table">
            <thead className="font-semibold">
              <tr>
                {productsTable.header.map((header, idx) => (
                  <th key={idx}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productsTable.data.map((product, idx) => (
                <tr key={idx}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>${product.price.toFixed(2)}</td>
                  <td>{product.stock}</td>
                  <td>{product.rating} ★</td>
                  <td>
                    <span className={`badge badge-label ${product.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{toPascalCase(product.status)}</span>
                  </td>
                  <td className="flex gap-1.5">
                    <button className="btn btn-sm bg-primary text-white hover:bg-primary-hover">Edit</button>
                    <button className="btn btn-sm bg-danger text-white hover:bg-danger-hover">Delete</button>
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

export default BasicTable
