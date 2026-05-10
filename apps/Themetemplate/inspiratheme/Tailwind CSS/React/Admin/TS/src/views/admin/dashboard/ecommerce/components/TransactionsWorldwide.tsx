import ComponentCard from '@/components/cards/ComponentCard'
import BaseVectorMap from '@/components/wrappers/BaseVectorMap'
import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { getWorldMapOptions, transactions } from './data'

const TransactionsWorldwide = () => {
  return (
    <>
      <ComponentCard title="Transactions Worldwide" isCloseable isCollapsible isRefreshable>
        <div>
          <div className="grid xl:grid-cols-2 grid-cols-1 gap-base">
            <div>
              <div className="overflow-x-auto">
                <table className="table table-custom table-nowrap table-hover table-centered whitespace-nowrap min-w-full">
                  <thead className="bg-light/25 align-middle thead-sm">
                    <tr className="uppercase text-2xs">
                      <th className="text-default-400">Tran. No.</th>
                      <th className="text-default-400">Order</th>
                      <th className="text-default-400">Date</th>
                      <th className="text-default-400">Amount</th>
                      <th className="text-default-400">Status</th>
                      <th className="text-default-400">Payment Method</th>
                    </tr>
                  </thead>
                  <tbody className="border-b border-default-300">
                    {transactions.map((transaction, index) => (
                      <tr key={index}>
                        <td>
                          <a href="" className="hover:text-primary font-semibold">
                            {transaction.id}
                          </a>
                        </td>
                        <td>{transaction.order}</td>
                        <td>
                          {transaction.date} <small className="text-default-400">{transaction.time}</small>
                        </td>
                        <td className="font-semibold">{transaction.amount}</td>
                        <td>
                          <span className={clsx('badge text-2xs', transaction.statusVariant)}>
                            <Icon icon="point-filled" />
                            {transaction.status}
                          </span>
                        </td>
                        <td className="flex items-center">
                          <img src={transaction.paymentMethod} alt="" width={28} height={28} className="me-2.5 h-7" /> xxxx {transaction.lastFour}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-center mt-5">
                <a href="" className="underline font-semibold hover:text-primary flex gap-1 items-center justify-center">
                  View All Transactions <Icon icon="send-2" />
                </a>
              </div>
            </div>
            <div>
              <BaseVectorMap id="world-map" options={getWorldMapOptions()} style={{ height: 297 }} />
            </div>
          </div>
        </div>
      </ComponentCard>
    </>
  )
}

export default TransactionsWorldwide
