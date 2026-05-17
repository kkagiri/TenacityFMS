import { Button, FormCheck, FormLabel } from 'react-bootstrap'
import { useWizard } from 'react-use-wizard'

const Advanced = () => {
  const { previousStep } = useWizard()
  return (
    <div className="border border-dashed rounded p-4">
      <FormCheck type="switch" label="Enable Maintenance Mode" className="mb-3" />

      <FormCheck type="switch" label="Debug Mode" className="mb-3" />

      <div className="mb-3">
        <FormLabel>Custom Script (Footer)</FormLabel>
        <textarea className="form-control" rows={3} placeholder="Paste custom JavaScript here" />
      </div>

      <div className="d-flex justify-content-between mt-3">
        <Button variant="secondary" type="button" onClick={previousStep}>
          ← Back
        </Button>

        <Button variant="success" type="button">
          Save All Settings
        </Button>
      </div>
    </div>
  )
}

export default Advanced
