import { Button, FormControl, FormLabel } from 'react-bootstrap'
import { useWizard } from 'react-use-wizard'

const Integrations = () => {
  const { nextStep, previousStep } = useWizard()
  return (
    <div className="border border-dashed rounded p-4">
      <div className="mb-3">
        <FormLabel>Google Analytics ID</FormLabel>
        <FormControl type="text" placeholder="UA-XXXXX-Y" />
      </div>

      <div className="mb-3">
        <FormLabel>Facebook Pixel ID</FormLabel>
        <FormControl type="text" placeholder="1234567890" />
      </div>

      <div className="mb-3">
        <FormLabel>Mailchimp API Key</FormLabel>
        <FormControl type="text" placeholder="key-xxxxx" />
      </div>

      <div className="d-flex justify-content-between mt-3">
        <Button variant="secondary" type="button" onClick={previousStep}>
          ← Back
        </Button>

        <Button variant="primary" type="button" onClick={nextStep}>
          Next: Backup & Restore →
        </Button>
      </div>
    </div>
  )
}

export default Integrations
