import ComponentCard from '@/components/cards/ComponentCard'
import BaseVectorMap from '@/components/maps/BaseVectorMap'
import Icon from '@/components/wrappers/Icon'
import { Col, Row, Table } from 'react-bootstrap'
import { getWorldMapOptions, transactions } from './data'
const TransactionsWorldwide = () => {
  return (
    <ComponentCard title="Transactions Worldwide" isCloseable isCollapsible isRefreshable bodyClassName={'pt-2'}>
      <Row className="align-items-center">
        <Col xl={6}>
          <div className="table-responsive">
            <Table className="table-custom table-nowrap table-hover table-centered mb-0">
              <thead className="bg-light align-middle bg-opacity-25 thead-sm">
                <tr className="text-uppercase fs-xxs">
                  <th className="text-muted">Tran. No.</th>
                  <th className="text-muted">Order</th>
                  <th className="text-muted">Date</th>
                  <th className="text-muted">Amount</th>
                  <th className="text-muted">Status</th>
                  <th className="text-muted">Payment Method</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      <a href="#!" className="link-reset fw-semibold">
                        {transaction.id}
                      </a>
                    </td>
                    <td>{transaction.order}</td>
                    <td>
                      {transaction.date} <small className="text-muted">{transaction.time}</small>
                    </td>
                    <td className="fw-semibold">{transaction.amount}</td>
                    <td>
                      <span className={`badge fs-xxs d-inline-flex align-items-center gap-1 badge-soft-${transaction.statusVariant}`}>
                        <Icon icon="point-filled" /> {transaction.status}
                      </span>
                    </td>
                    <td>
                      <img src={transaction.paymentMethod} className="me-2" height={28} alt="" /> xxxx {transaction.lastFour}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          <div className="text-center mt-3">
            <a href="" className="link-reset text-decoration-underline fw-semibold link-offset-3">
              View All Transactions <Icon icon="send-2" />
            </a>
          </div>
        </Col>
        <Col xl={6}>
          <BaseVectorMap
            id="world-map"
            options={getWorldMapOptions()}
            style={{
              height: 297,
            }}
          />
        </Col>
      </Row>
    </ComponentCard>
  )
}
export default TransactionsWorldwide
