import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { Card, CardBody } from 'react-bootstrap'
import { useWizard, Wizard } from 'react-use-wizard'
import BillingInfo from './BillingInfo'
import InvoiceDetail from './InvoiceDetail'
import PaymentInfo from './PaymentInfo'
import ShippingInfo from './ShippingInfo'

const Header = ({ className }: { className?: string }) => {
  const { goToStep, activeStep } = useWizard()
  return (
    <ul className={clsx('nav nav-tabs nav-justified wizard-tabs mb-3', className)} role="tablist">
      <li className="nav-item">
        <button className={clsx('nav-link py-2', activeStep === 0 && 'active', activeStep > 0 && 'wizard-item-done')} onClick={() => goToStep(0)}>
          <span className="d-flex align-items-center justify-content-center">
            <Icon icon="user-circle" className="fs-24" />
            <span className="ms-2 text-truncate">
              <span className="mb-0 lh-base d-block fw-semibold text-body fs-md">Billing Info</span>
            </span>
          </span>
        </button>
      </li>

      <li className="nav-item">
        <button className={clsx('nav-link py-2', activeStep === 1 && 'active', activeStep > 1 && 'wizard-item-done')} onClick={() => goToStep(1)}>
          <span className="d-flex align-items-center justify-content-center">
            <Icon icon="truck" className="fs-24" />
            <span className="ms-2 text-truncate">
              <span className="mb-0 lh-base d-block fw-semibold text-body fs-md">Shipping Info</span>
            </span>
          </span>
        </button>
      </li>

      <li className="nav-item">
        <button className={clsx('nav-link py-2', activeStep === 2 && 'active', activeStep > 2 && 'wizard-item-done')} onClick={() => goToStep(2)}>
          <span className="d-flex align-items-center justify-content-center">
            <Icon icon="credit-card" className="fs-24" />
            <span className="ms-2 text-truncate">
              <span className="mb-0 lh-base d-block fw-semibold text-body fs-md">Payment Info</span>
            </span>
          </span>
        </button>
      </li>

      <li className="nav-item">
        <button className={clsx('nav-link py-2', activeStep === 3 && 'active', activeStep > 3 && 'wizard-item-done')} onClick={() => goToStep(3)}>
          <span className="d-flex align-items-center justify-content-center">
            <Icon icon="checks" className="fs-24" />
            <span className="ms-2 text-truncate">
              <span className="mb-0 lh-base d-block fw-semibold text-body fs-md">Finish</span>
            </span>
          </span>
        </button>
      </li>
    </ul>
  )
}

const Checkout = () => {
  return (
    <Card>
      <CardBody>
        <div className="ins-wizard">
          <Wizard header={<Header />}>
            <BillingInfo />
            <ShippingInfo />
            <PaymentInfo />
            <InvoiceDetail />
          </Wizard>
        </div>
      </CardBody>
    </Card>
  )
}

export default Checkout
