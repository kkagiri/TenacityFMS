import Icon from '@/components/wrappers/Icon'
import clsx from 'clsx'
import { Card, CardBody, Col, Nav, Row } from 'react-bootstrap'
import { useWizard, Wizard } from 'react-use-wizard'
import Advanced from './Advanced'
import BackupAndRestore from './BackupAndRestore'
import Branding from './Branding'
import CurrencyAndTax from './CurrencyAndTax'
import { settingStepsData } from './data'
import GeneralInfo from './GeneralInfo'
import Integrations from './Integrations'
import Invoices from './Invoices'
import Notifications from './Notifications'
import Payments from './Payments'
import SeoAndLegal from './SeoAndLegal'
import Shipping from './Shipping'
import StoreDetails from './StoreDetails'

const ShopSettings = () => {
  return (
    <Card>
      <CardBody>
        <div className="ins-wizard">
          <Row>
            <Wizard
              header={
                <Col md={4} xxl={3}>
                  <Header />
                </Col>
              }
              wrapper={<Col md={8} xxl={9} />}
            >
              <GeneralInfo />
              <StoreDetails />
              <Branding />
              <CurrencyAndTax />
              <Shipping />
              <Payments />
              <Notifications />
              <Invoices />
              <SeoAndLegal />
              <Integrations />
              <BackupAndRestore />
              <Advanced />
            </Wizard>
          </Row>
        </div>
      </CardBody>
    </Card>
  )
}

export default ShopSettings

const Header = () => {
  const { goToStep, activeStep } = useWizard()
  return (
    <Nav as="ul" className="nav flex-column wizard-bordered wizard-tabs nav-pills w-100" role="tablist">
      {settingStepsData.map((step, idx) => (
        <li key={idx} className="nav-item">
          <button className={clsx('nav-link w-100', activeStep === idx && 'active', activeStep > idx && 'wizard-item-done')} onClick={() => goToStep(idx)}>
            <span className="d-flex align-items-center text-start">
              <div className="avatar-md">
                <span className="avatar-title bg-light rounded">
                  <Icon icon={step.icon} className="fs-24" />
                </span>
              </div>
              <span className="ms-2 text-truncate d-inline-lock">
                <span className="fw-semibold text-body d-block fs-base">{step.title}</span>
                <span className="fs-xs mb-0 ms-0 ps-0">{step.subtitle}</span>
              </span>
            </span>
          </button>
        </li>
      ))}
    </Nav>
  )
}
