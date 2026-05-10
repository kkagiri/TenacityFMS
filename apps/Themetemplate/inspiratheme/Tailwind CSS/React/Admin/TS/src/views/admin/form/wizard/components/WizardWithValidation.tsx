import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { useState } from 'react'

export const Step1 = ({ form, errors, onChange }: any) => {
  return (
    <>
      <div>
        <label className="form-label">Full Name</label>
        <input type="text" name="fullName" value={form.fullName} onChange={onChange} className={cn('form-input ', errors.fullName && 'is-invalid')} placeholder="Enter your full name" />
      </div>

      <div>
        <label className="form-label">Email</label>
        <input type="email" name="email" value={form.email} onChange={onChange} className={cn('form-input ', errors.email && 'is-invalid')} placeholder="Enter your email" />
      </div>

      <div>
        <label className="form-label">Phone Number</label>
        <input type="text" name="phone" value={form.phone} onChange={onChange} className={cn('form-input ', errors.phone && 'is-invalid')} placeholder="Enter your phone number" />
      </div>

      <div>
        <label className="form-label">Date of Birth</label>
        <input type="date" name="dob" value={form.dob} onChange={onChange} className={cn('form-input ', errors.dob && 'is-invalid')} />
      </div>
    </>
  )
}

export const Step2 = ({ form, errors, onChange }: any) => {
  return (
    <>
      <div>
        <label className="form-label">Street Address</label>
        <input type="text" name="address" value={form.address} onChange={onChange} className={cn('form-input ', errors.address && 'is-invalid')} placeholder="123 Main St" />
      </div>

      <div>
        <label className="form-label">City</label>
        <input type="text" name="city" value={form.city} onChange={onChange} className={cn('form-input', errors.city && 'is-invalid')} placeholder="e.g., New York" />
      </div>

      <div>
        <label className="form-label">State</label>
        <input type="text" name="state" value={form.state} onChange={onChange} className={cn('form-input', errors.state && 'is-invalid')} placeholder="e.g., California" />
      </div>

      <div>
        <label className="form-label">Zip Code</label>
        <input type="text" name="zip" value={form.zip} onChange={onChange} className={cn('form-input', errors.zip && 'is-invalid')} placeholder="e.g., 10001" />
      </div>
    </>
  )
}

export const Step3 = ({ form, errors, onChange }: any) => {
  return (
    <>
      <div>
        <label className="form-label">Choose Course</label>
        <select name="course" value={form.course} onChange={onChange} className={cn('form-input ', errors.course && 'is-invalid')}>
          <option value="">Select</option>
          <option value="Engineering">Engineering</option>
          <option value="Medical">Medical</option>
          <option value="Business">Business</option>
        </select>
      </div>

      <div>
        <label className="form-label">Enrollment Type</label>
        <select name="enrollment" value={form.enrollment} onChange={onChange} className={cn('form-input ', errors.enrollment && 'is-invalid')}>
          <option value="">Select</option>
          <option value="Full Time">Full Time</option>
          <option value="Part Time">Part Time</option>
        </select>
      </div>

      <div>
        <label className="form-label">Preferred Batch Time</label>
        <select name="batchTime" value={form.batchTime} onChange={onChange} className={cn('form-input ', errors.batchTime && 'is-invalid')}>
          <option value="">Select Time</option>
          <option value="Morning">Morning</option>
          <option value="Afternoon">Afternoon</option>
          <option value="Evening">Evening</option>
        </select>
      </div>

      <div>
        <label className="form-label">Mode of Study</label>
        <select name="mode" value={form.mode} onChange={onChange} className={cn('form-input ', errors.mode && 'is-invalid')}>
          <option value="">Select Mode</option>
          <option value="Offline">Offline</option>
          <option value="Online">Online</option>
          <option value="Hybrid">Hybrid</option>
        </select>
      </div>
    </>
  )
}

export const Step4 = ({ form, errors, onChange }: any) => {
  return (
    <>
      <div>
        <label className="form-label">Parent/Guardian Name</label>
        <input type="text" name="parentName" value={form.parentName} onChange={onChange} className={cn('form-input ', errors.parentName && 'is-invalid')} />
      </div>

      <div>
        <label className="form-label">Relation</label>
        <input type="text" name="relation" value={form.relation} onChange={onChange} className={cn('form-input ', errors.relation && 'is-invalid')} />
      </div>

      <div>
        <label className="form-label">Parent Phone</label>
        <input type="text" name="parentPhone" value={form.parentPhone} onChange={onChange} className={cn('form-input ', errors.parentPhone && 'is-invalid')} />
      </div>

      <div>
        <label className="form-label">Parent Email</label>
        <input type="text" name="parentEmail" value={form.parentEmail} onChange={onChange} className={cn('form-input ', errors.parentEmail && 'is-invalid')} />
      </div>
    </>
  )
}

export const Step5 = ({ errors, onFileChange }: any) => {
  return (
    <>
      <div>
        <label className="form-label">Upload ID Proof</label>
        <input type="file" onChange={(e) => onFileChange('idProof', e)} className={cn('form-input ', errors.idProof && 'is-invalid')} />
      </div>

      <div>
        <label className="form-label">Upload Previous Marksheet</label>
        <input type="file" onChange={(e) => onFileChange('marksheet', e)} className={cn('form-input ', errors.marksheet && 'is-invalid')} />
      </div>
    </>
  )
}

type StepType = {
  index: number
  icon: string
  title: string
  subtitle: string
}

const steps: StepType[] = [
  {
    index: 1,
    icon: 'user-circle',
    title: 'Student Info',
    subtitle: 'Personal details',
  },
  {
    index: 2,
    icon: 'map-pin',
    title: 'Address Info',
    subtitle: 'Where you live',
  },
  {
    index: 3,
    icon: 'book',
    title: 'Course Info',
    subtitle: 'Select your course',
  },
  {
    index: 4,
    icon: 'users',
    title: 'Parent Info',
    subtitle: 'Guardian details',
  },
  {
    index: 5,
    icon: 'folder-open',
    title: 'Documents',
    subtitle: 'Upload certificates',
  },
]

const WizardWithValidation = () => {
  const [currentStep, setCurrentStep] = useState(1)

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    dob: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    course: '',
    enrollment: '',
    batchTime: '',
    mode: '',
    parentName: '',
    relation: '',
    parentPhone: '',
    parentEmail: '',
    idProof: null,
    marksheet: null,
  })

  const [errors, setErrors] = useState<any>({})

  const onChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value })

  const onFileChange = (name: string, e: any) => setForm({ ...form, [name]: e.target.files[0] })

  const validateStep = (step: number) => {
    const err: Record<string, boolean> = {}

    const fields: Record<number, (keyof typeof form)[]> = {
      1: ['fullName', 'email', 'phone', 'dob'],
      2: ['address', 'city', 'state', 'zip'],
      3: ['course', 'enrollment', 'batchTime', 'mode'],
      4: ['parentName', 'relation', 'parentPhone', 'parentEmail'],
      5: ['idProof', 'marksheet'],
    }

    fields[step]?.forEach((f) => {
      if (!form[f]) err[f] = true
    })

    setErrors(err)
    return Object.keys(err).length === 0
  }
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => prev + 1)
    }
  }
  const handleBack = () => {
    setErrors({})
    setCurrentStep((prev) => prev - 1)
  }

  return (
    <div className="card-body">
      <div data-hs-stepper="">
        <ul className="relative flex flex-wrap gap-1.25">
          {steps.map((step) => (
            <li
              key={step.index}
              className="group cursor-pointer"
              onClick={() => {
                if (step.index <= currentStep) {
                  setCurrentStep(step.index)
                }
              }}
            >
              <span className="group inline-flex items-center align-middle text-xs">
                <span
                  className={`flex shrink-0 items-center justify-center gap-3 rounded border border-dashed px-4 py-2 font-medium
      ${currentStep === step.index ? 'bg-default-50 text-default-700 border-default-300' : step.index < currentStep ? 'bg-success/10 text-success border-success' : 'border-default-300'}`}
                >
                  <Icon icon={step.icon} className="size-8" />
                  <div>
                    <span className="block text-sm font-semibold">{step.title}</span>
                    <span className="text-2xs">{step.subtitle}</span>
                  </div>
                </span>
              </span>
            </li>
          ))}
        </ul>

        <div className="pt-6">
          {currentStep === 1 && (
            <div className="col-span-1 grid pb-base md:grid-cols-2 gap-base">
              <Step1 form={form} errors={errors} onChange={onChange} />
            </div>
          )}

          {currentStep === 2 && (
            <div className="col-span-1 grid pb-base md:grid-cols-2 gap-base">
              <Step2 form={form} errors={errors} onChange={onChange} />
            </div>
          )}

          {currentStep === 3 && (
            <div className="col-span-1 grid pb-base md:grid-cols-2 gap-base">
              <Step3 form={form} errors={errors} onChange={onChange} />
            </div>
          )}

          {currentStep === 4 && (
            <div className="col-span-1 grid pb-base md:grid-cols-2 gap-base">
              <Step4 form={form} errors={errors} onChange={onChange} />
            </div>
          )}

          {currentStep === 5 && (
            <div className="grid grid-cols-1 pb-base gap-base">
              <Step5 errors={errors} onFileChange={onFileChange} />
            </div>
          )}

          <div className="mt-base flex flex-wrap items-center justify-between gap-2">
            <button type="button" className="btn bg-secondary text-white" disabled={currentStep === 1} onClick={handleBack}>
              ← Back
            </button>

            <button type="button" className="btn bg-primary text-white" onClick={handleNext}>
              {currentStep === 5 ? 'Submit' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WizardWithValidation
