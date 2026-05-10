import TablePagination from '@/components/table/TablePagination'
import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { orders } from './data'

const RecentOrders = () => {
  return (
    <>
      <div data-table data-table-rows-per-page={5} className="card">
        <div className="card-header justify-between items-center border-dashed">
          <h4 className="card-title mb-0">Product Inventory</h4>
          <div className="flex gap-2.5">
            <a href="" className="btn btn-sm text-sm bg-secondary/15 text-secondary hover:text-white hover:bg-secondary">
              {' '}
              <Icon icon="plus" /> Add Order{' '}
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
              {orders.map((order, idx) => (
                <tr key={idx}>
                  <td className="ps-4">
                    <div className="flex items-center">
                      <img src={order.userImage} alt="" className="size-8 rounded-full me-2.5" />
                      <div>
                        <h5 className="text-sm my-1.25">
                          <a href="" className="text-body">
                            {' '}
                            #{order.id}
                          </a>
                        </h5>
                        <span className="text-default-400 text-xs">{order.userName}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-default-400 text-xs">Product</span>
                    <h5 className="text-sm mt-1.25 mb-2 font-normal">{order.product}</h5>
                  </td>
                  <td>
                    <span className="text-default-400 text-xs">Date</span>
                    <h5 className="text-sm mt-1.25 mb-2 font-normal">{order.date}</h5>
                  </td>
                  <td>
                    <span className="text-default-400 text-xs">Amount</span>
                    <h5 className="text-sm mt-1.25 mb-2 font-normal">{order.amount}</h5>
                  </td>
                  <td>
                    <span className="text-default-400 text-xs">Status</span>
                    <h5 className="text-sm mt-1.25 mb-2 font-normal flex gap-1">
                      <Icon icon="circle-filled" className={clsx('iconify fs-xs', order.statusVariant)} /> {order.status}
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
                              View Details{' '}
                            </a>
                            <a href="" className="dropdown-item">
                              {' '}
                              Cancel Order{' '}
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
          <TablePagination totalItems={5} start={1} end={5} itemsName="orders" showInfo previousPage={() => {}} canPreviousPage={false} pageCount={1} pageIndex={0} setPageIndex={() => {}} nextPage={() => {}} canNextPage={false} />
        </div>
      </div>
    </>
  )
}

export default RecentOrders
