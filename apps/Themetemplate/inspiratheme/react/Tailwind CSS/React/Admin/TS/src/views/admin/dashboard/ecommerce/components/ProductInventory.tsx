import Rating from '@/components/Rating'
import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { products } from './data'

const ProductInventory = () => {
  return (
    <>
      <div data-table data-table-rows-per-page={5} className="card">
        <div className="card-header justify-between items-center border-dashed">
          <h4 className="card-title mb-0">Product Inventory</h4>
          <div className="flex gap-2.5">
            <a href="" className="btn btn-sm text-sm bg-secondary/15 text-secondary hover:text-white hover:bg-secondary">
              {' '}
              <Icon icon="plus" className="me-1" /> Add Product{' '}
            </a>
            <a href="" className="btn btn-sm text-sm bg-primary text-white hover:bg-primary-hover">
              {' '}
              <Icon icon="file-export" /> Export CSV{' '}
            </a>
          </div>
        </div>
        <div className="table-wrapper whitespace-nowrap">
          <table className="table table-sm table-hover">
            <tbody>
              {products.map((product, idx) => (
                <tr key={idx}>
                  <td className="ps-4">
                    <div className="flex items-center">
                      <img src={product.image} alt="" className="size-8 rounded-full me-2.5" />
                      <div>
                        <h5 className="text-sm my-1.25">
                          <a href="" className="text-default-800">
                            {product.name}
                          </a>
                        </h5>
                        <span className="text-default-400 text-xs">{product.category}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-default-400 text-xs">Stock</span>
                    <h5 className="text-sm mt-1.25 mb-2 font-normal">{product.stock}</h5>
                  </td>
                  <td>
                    <span className="text-default-400 text-xs">Price</span>
                    <h5 className="text-sm mt-1.25 mb-2 font-normal">{product.price}</h5>
                  </td>
                  <td>
                    <span className="text-default-400 text-xs">Ratings</span>
                    <h5 className="text-sm mt-1.25 mb-2 font-normal">
                      <Rating rating={product.ratings} className={'d-inline-flex align-items-center gap-1'} />
                      <span className="ms-1.25">
                        <a href="/apps/ecommerce/reviews" className="font-semibold hover:text-primary">
                          ({product.reviews})
                        </a>
                      </span>
                    </h5>
                  </td>
                  <td>
                    <span className="text-default-400 text-xs">Status</span>
                    <h5 className="text-sm mt-1.25 mb-2 font-normal flex gap-1">
                      <Icon icon="circle-filled" className={clsx('fs-xs', product.statusVariant)} /> {product.status}
                    </h5>
                  </td>
                  <td style={{ width: 30 }} className="text-end pe-4.5">
                    <div className="relative ms-auto">
                      <div className="hs-dropdown inline-flex [--placement:bottom-right]">
                        <button type="button" className="hs-dropdown-toggle" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
                          <Icon icon="dots-vertical" className="text-lg text-default-400" />
                        </button>
                        <div className="hs-dropdown-menu" role="menu" aria-orientation="vertical">
                          <div className="space-y-0.5">
                            <a href="" className="dropdown-item">
                              {' '}
                              Edit Product{' '}
                            </a>
                            <a href="" className="dropdown-item">
                              {' '}
                              Remove{' '}
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-footer">
          <TablePagination totalItems={5} start={1} end={5} itemsName="products" showInfo previousPage={() => {}} canPreviousPage={false} pageCount={1} pageIndex={0} setPageIndex={() => {}} nextPage={() => {}} canNextPage={false} />
        </div>
      </div>
    </>
  )
}

export default ProductInventory
