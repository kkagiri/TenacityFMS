import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { pricingPlans } from './components/data'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Pricing" subtitle="Pages" />

      <div className="container">
        <div className="text-center">
          <h3 className="font-bold text-xl mt-7.5 mb-2">Find the Perfect Fit</h3>
          <div className="text-primary flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" height={24} viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.874 13C15.4299 14.7252 13.8638 16 12 16C10.1362 16 8.57006 14.7252 8.12602 13H3V11H8.12602C8.57006 9.27477 10.1362 8 12 8C13.8638 8 15.4299 9.27477 15.874 11H21V13H15.874ZM12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" />
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" height={24} viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.874 13C15.4299 14.7252 13.8638 16 12 16C10.1362 16 8.57006 14.7252 8.12602 13H3V11H8.12602C8.57006 9.27477 10.1362 8 12 8C13.8638 8 15.4299 9.27477 15.874 11H21V13H15.874ZM12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" />
            </svg>
          </div>
          <p className="italic mb-4 text-md">Not sure which plan suits you best? Check out our Pricing Guide for detailed insights.</p>
        </div>

        <div className="my-15 xl:px-7.5">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-base">
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`card h-full rounded-xl relative ${plan.highlighted ? 'border-success border-2' : ''}`}>
                <div className="card-body lg:px-7.5 p-15 pb-2.5 text-center">
                  <div>
                    <h3 className="font-bold mb-1.25 text-xl">{plan.title}</h3>
                    <p className="text-default-400">{plan.description}</p>
                  </div>
                  <div className="my-7.5">
                    <h1 className="lg:text-[40px] md:text-[33px] text-[27px] font-bold">{plan.price}</h1>
                    {plan.notes.map((note, i) => (
                      <small key={i} className="block text-default-400 text-sm font-medium">
                        {note}
                      </small>
                    ))}
                  </div>

                  <ul className="text-start text-sm font-medium">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="mb-2.5 flex">
                        {feature.included ? <Icon icon="check" className="me-2.5 text-success" /> : <Icon icon="x" className="me-2.5 text-danger" />}
                        &nbsp;{feature.label}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="card-footer bg-transparent border-0 px-15 pb-7.5">
                  <a href="" className={`btn w-full py-2.5 font-semibold rounded-full ${plan.highlighted ? 'bg-primary text-white hover:bg-primary-hover' : 'bg-dark text-white'}`}>
                    {plan.buttonText}
                  </a>
                </div>
                {plan.highlighted && <span className="absolute text-xs top-0 inset-s-1/2 -translate-x-1/2 left-1/2 badge bg-primary/15 text-primary rounded-full px-3 py-1.5 mt-5 leading-normal">Popular Choice</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
