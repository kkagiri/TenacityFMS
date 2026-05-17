import { Button, FormCheck } from 'react-bootstrap'
import { useWizard } from 'react-use-wizard'

const Notifications = () => {
  const { previousStep, nextStep } = useWizard()
  return (
    <div className="border border-dashed rounded p-4">
      <FormCheck type="switch" label="Enable Order Emails" defaultChecked className="mb-3" />

      <FormCheck type="switch" label="Enable Low Stock Alerts" className="mb-3" />

      <FormCheck type="switch" label="Enable SMS Notifications" className="mb-3" />

      <div className="d-flex justify-content-between mt-3">
        <Button variant="secondary" type="button" onClick={previousStep}>
          ← Back
        </Button>

        <Button variant="primary" type="button" onClick={nextStep}>
          Next: Invoices & Receipts →
        </Button>
      </div>
    </div>
  )
}

export default Notifications
