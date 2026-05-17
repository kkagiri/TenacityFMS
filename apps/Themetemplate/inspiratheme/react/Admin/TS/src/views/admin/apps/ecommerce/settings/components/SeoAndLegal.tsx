import { Button, FormControl, FormLabel } from 'react-bootstrap'
import { useWizard } from 'react-use-wizard'

const SeoAndLegal = () => {
  const { nextStep, previousStep } = useWizard()
  return (
    <div className="border border-dashed rounded p-4">
      <div className="mb-3">
        <FormLabel>Meta Title</FormLabel>
        <FormControl type="text" placeholder="Your Shop Title" />
      </div>

      <div className="mb-3">
        <FormLabel>Meta Description</FormLabel>
        <textarea className="form-control" rows={2} placeholder="Brief description for SEO" />
      </div>

      <div className="mb-3">
        <FormLabel>Privacy Policy URL</FormLabel>
        <FormControl type="url" placeholder="https://example.com/privacy" />
      </div>

      <div className="mb-3">
        <FormLabel>Terms & Conditions URL</FormLabel>
        <FormControl type="url" placeholder="https://example.com/terms" />
      </div>

      <div className="d-flex justify-content-between mt-3">
        <Button variant="secondary" type="button" onClick={previousStep}>
          ← Back
        </Button>

        <Button variant="primary" type="button" onClick={nextStep}>
          Next: Integrations →
        </Button>
      </div>
    </div>
  )
}

export default SeoAndLegal
