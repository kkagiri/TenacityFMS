import { Button, FormCheck, FormControl, FormLabel } from 'react-bootstrap'
import { useWizard } from 'react-use-wizard'

const Invoices = () => {
  const { previousStep, nextStep } = useWizard()
  return (
    <div className="border border-dashed rounded p-4">
      <div className="mb-3">
        <FormLabel>Invoice Prefix</FormLabel>
        <FormControl type="text" placeholder="INV-" />
      </div>

      <FormCheck type="switch" label="Include Tax Breakdown" defaultChecked className="mb-3" />

      <FormCheck type="switch" label="Enable PDF Download" className="mb-3" />

      <div className="d-flex justify-content-between mt-3">
        <Button variant="secondary" type="button" onClick={previousStep}>
          ← Back
        </Button>

        <Button variant="primary" type="button" onClick={nextStep}>
          Next: SEO & Legal →
        </Button>
      </div>
    </div>
  )
}

export default Invoices
