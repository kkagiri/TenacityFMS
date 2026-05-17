import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Step1, Step2, Step3, Step4, Step5 } from './components/Steps'
import WizardWithProgressbar from './components/WizardWithProgressbar'
import WizardWithValidation from './components/WizardWithValidation'


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

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Form Wizard" subtitle="Forms" />
      <div className="container">
        <div className="grid grid-cols-1 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Basic Wizard</h4>
            </div>

            <div className="card-body">
              <div data-hs-stepper="">
                <ul className="relative flex flex-wrap gap-1.25">
                  {steps.map((step) => (
                    <li className="group items-center gap-x-2" data-hs-stepper-nav-item={`{"index": ${step.index}}`} key={step.index}>
                      <span className="group inline-flex items-center align-middle text-xs focus:outline-hidden disabled:pointer-events-none disabled:opacity-50">
                        <span className="border-default-300 hs-stepper-active:bg-default-50 hs-stepper-active:text-default-700 hs-stepper-success:bg-success/10 hs-stepper-success:border-success hs-stepper-success:text-success flex shrink-0 items-center justify-center gap-3 rounded border border-dashed px-4 py-2 font-medium">
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
                  <div data-hs-stepper-content-item='{"index": 1}' style={{ display: 'none' }}>
                    <div className="col-span-1 grid pb-base md:grid-cols-2 grid-cols-1 gap-base">
                      <Step1 />
                    </div>
                  </div>

                  <div data-hs-stepper-content-item='{"index": 2}' style={{ display: 'none' }}>
                    <div className="col-span-1 grid pb-base md:grid-cols-2 gap-base">
                      <Step2 />
                    </div>
                  </div>

                  <div data-hs-stepper-content-item='{"index": 3}' style={{ display: 'none' }}>
                    <div className="col-span-1 grid pb-base md:grid-cols-2 gap-base">
                      <Step3 />
                    </div>
                  </div>

                  <div data-hs-stepper-content-item='{"index": 4}' style={{ display: 'none' }}>
                    <div className="col-span-1 grid pb-base md:grid-cols-2 gap-base">
                      <Step4 />
                    </div>
                  </div>

                  <div data-hs-stepper-content-item='{"index": 5}' style={{ display: 'none' }}>
                    <div className="grid grid-cols-1 pb-base gap-base">
                      <Step5 />
                    </div>
                  </div>

                  <div className="mt-base flex flex-wrap items-center justify-between gap-2">
                    <button type="button" className="btn bg-secondary w-full text-white md:w-auto" data-hs-stepper-back-btn="">
                      ← Back
                    </button>

                    <button type="button" className="btn bg-primary w-full text-white md:w-auto" data-hs-stepper-complete-step-btn='{"completedText": "This step is completed"}'>
                      Next →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Validation Support</h4>
            </div>
            <WizardWithValidation />
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Progressbar Support</h4>
            </div>
            <WizardWithProgressbar />
          </div>
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Vertical Wizard</h4>
            </div>

            <div className="card-body">
              <div data-hs-stepper="">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-base">
                  <div>
                    <ul className="relative flex flex-col gap-1.25">
                      {steps.map((step) => (
                        <li className="group active flex w-full flex-1 shrink basis-0 items-center gap-x-2" data-hs-stepper-nav-item={`{"index": ${step.index}}`} key={step.index}>
                          <span className="group inline-flex w-full items-center align-middle text-xs focus:outline-hidden disabled:pointer-events-none disabled:opacity-50">
                            <span className="hs-stepper-active:bg-default-50 hs-stepper-active:text-default-700 hs-stepper-success:bg-success/10 hs-stepper-success:border-success hs-stepper-success:text-success hs-stepper-success:border-s-3 flex w-full shrink-0 items-center gap-2 rounded px-4 py-3 font-medium">
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
                  </div>

                  <div className="border-default-300 col-span-1 rounded border border-dashed p-7.5 md:col-span-2">
                    <div>
                      <div data-hs-stepper-content-item='{"index": 1}' style={{ display: 'none' }}>
                        <div className="col-span-1 grid pb-base md:grid-cols-2 grid-cols-1 gap-base">
                          <Step1 />
                        </div>
                      </div>

                      <div data-hs-stepper-content-item='{"index": 2}' style={{ display: 'none' }}>
                        <div className="col-span-1 grid pb-base md:grid-cols-2 gap-base">
                          <Step2 />
                        </div>
                      </div>

                      <div data-hs-stepper-content-item='{"index": 3}' style={{ display: 'none' }}>
                        <div className="col-span-1 grid pb-base md:grid-cols-2 gap-base">
                          <Step3 />
                        </div>
                      </div>

                      <div data-hs-stepper-content-item='{"index": 4}' style={{ display: 'none' }}>
                        <div className="col-span-1 grid pb-base md:grid-cols-2 gap-base">
                          <Step4 />
                        </div>
                      </div>

                      <div data-hs-stepper-content-item='{"index": 5}' style={{ display: 'none' }}>
                        <div className="grid grid-cols-1 pb-base gap-base">
                          <Step5 />
                        </div>
                      </div>

                      <div className="mt-base flex flex-wrap items-center justify-between gap-2">
                        <button type="button" className="btn bg-secondary w-full text-white md:w-auto" data-hs-stepper-back-btn="">
                          ← Back
                        </button>

                        <button type="button" className="btn bg-primary w-full text-white md:w-auto" data-hs-stepper-complete-step-btn='{"completedText": "This step is completed"}'>
                          Next →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
