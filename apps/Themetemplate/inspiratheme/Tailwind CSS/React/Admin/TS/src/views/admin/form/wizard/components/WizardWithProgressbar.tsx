import Icon from '@/components/wrappers/Icon'
import { useState } from 'react'
import { Step1, Step2, Step3, Step4, Step5 } from './Steps'

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

const WizardWithProgressbar = () => {
  const TOTAL_STEPS = 5
  const [currentStep, setCurrentStep] = useState<number>(1)
  const progressWidth = (currentStep / TOTAL_STEPS) * 100

  return (
    <div className="card-body">
      <div data-hs-stepper="">
        <div className="mb-5">
          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-default-100 dark:bg-default-100">
            <div className="hs-stepper-progress-bar bg-primary flex flex-col justify-center overflow-hidden whitespace-nowrap text-center text-xs text-white transition-all duration-300" style={{ width: `${progressWidth}%` }}></div>
          </div>
        </div>

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
              <Step1 />
            </div>
          )}

          {currentStep === 2 && (
            <div className="col-span-1 grid pb-base md:grid-cols-2 gap-base">
              <Step2 />
            </div>
          )}

          {currentStep === 3 && (
            <div className="col-span-1 grid pb-base md:grid-cols-2 gap-base">
              <Step3 />
            </div>
          )}

          {currentStep === 4 && (
            <div className="col-span-1 grid pb-base md:grid-cols-2 gap-base">
              <Step4 />
            </div>
          )}

          {currentStep === 5 && (
            <div className="grid grid-cols-1 pb-base gap-base">
              <Step5 />
            </div>
          )}

          <div className="mt-base flex flex-wrap items-center justify-between gap-2">
            <button type="button" className="btn bg-secondary w-full text-white md:w-auto" disabled={currentStep === 1} onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}>
              ← Back
            </button>

            <button type="button" className="btn bg-primary w-full text-white md:w-auto" disabled={currentStep === TOTAL_STEPS} onClick={() => setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS))}>
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WizardWithProgressbar
