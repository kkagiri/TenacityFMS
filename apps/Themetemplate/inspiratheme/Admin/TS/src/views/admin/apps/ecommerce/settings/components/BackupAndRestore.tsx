import { Button, FormCheck, FormControl, FormLabel } from 'react-bootstrap'
import { useWizard } from 'react-use-wizard'

const BackupAndRestore = () => {
  const { nextStep, previousStep } = useWizard()
  return (
    <div className="border border-dashed rounded p-4">
      <div className="mb-3">
        <Button variant="outline-primary" className="w-100">
          Create Manual Backup
        </Button>
      </div>

      <div className="mb-3">
        <FormLabel>Restore from File</FormLabel>
        <FormControl type="file" />
      </div>

      <FormCheck type="switch" label="Enable Auto Backups (Weekly)" className="mb-3" />

      <div className="d-flex justify-content-between mt-3">
        <Button variant="secondary" type="button" onClick={previousStep}>
          ← Back
        </Button>

        <Button variant="primary" type="button" onClick={nextStep}>
          Next: Advanced →
        </Button>
      </div>
    </div>
  )
}

export default BackupAndRestore
