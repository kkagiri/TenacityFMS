import logodark from '@/assets/images/logo-black.png'
import logolight from '@/assets/images/logo.png'
import Icon from '@/components/wrappers/Icon'
import Tour from '@rc-component/tour'
import { Link } from 'react-router'
import { useRef, useState } from 'react'
import { featuresData } from './data'

const TourPage = () => {
  const [openTour, setOpenTour] = useState(false)

  const step1Ref = useRef<HTMLAnchorElement | null>(null)
  const step2Ref = useRef<HTMLAnchorElement | null>(null)
  const step3Ref = useRef<HTMLDivElement | null>(null)
  const step4Ref = useRef<HTMLButtonElement | null>(null)
  return (
    <>
      <div className="container">
        <div className="flex justify-center">
          <div className="lg:w-1/2">
            <div className="mt-9 mb-18 text-center">
              <Link to="/" className="mb-9 flex justify-center">
                <img src={logodark} alt="dark logo" className="flex h-8 dark:hidden" />
                <img src={logolight} alt="logo" className="hidden h-8 dark:flex" />
              </Link>
              <h5 className="mb-3 text-base">Versatile &amp; Scalable Admin Panel Template</h5>
              <p className="text-default-400 mx-11 text-sm">
                Build modern web applications faster with our feature-rich admin panel. Compatible with multiple frameworks and packed with diverse demos, it offers seamless customization and a consistent UI across all your projects.
              </p>
              <div className="mt-9 flex flex-wrap justify-center gap-3">
                <button
                  id="tourTrigger"
                  className="btn bg-primary hover:bg-primary-hover text-white"
                  onClick={() => {
                    if (step1Ref.current) {
                      setOpenTour(true)
                    }
                  }}
                >
                  <Icon icon="player-play" className="me-1" />
                  Start Guided Tour
                </button>
                <Link to="" ref={step1Ref} className="btn bg-dark hover:bg-dark-hover text-white" data-tg-order={1} data-tg-tour="Click here to get started and explore our framework-rich admin panel. 🚀" data-tg-title="Getting Started">
                  <Icon icon="compass" className="me-1" />
                  Discover Features
                </Link>
                <Link to="" target="_blank" ref={step2Ref} className="btn bg-danger hover:bg-danger-hover text-white" data-tg-order={2} data-tg-tour="Ready to supercharge your project? Click here to purchase the template!" data-tg-title="Buy Now">
                  <Icon icon="shopping-cart" className="me-1" />
                  Get the Template
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div data-tg-order={3} data-tg-tour="Learn more about the versatile services and modules we provide to enhance development." ref={step3Ref}>
          <div className="grid xl:grid-cols-4 gap-base">
            {featuresData.map((feature, idx) => (
              <div className="card h-full p-3" key={idx}>
                <div className="card-body pb-0">
                  <div className="mb-5">
                    <span className="avatar-title bg-secondary flex size-12 items-center justify-center rounded-full text-2xl text-white">
                      <Icon icon={feature.icon} />
                    </span>
                  </div>
                  <h4 className="mb-3 text-lg font-semibold">{feature.title}</h4>
                  <p className="text-default-400 mb-5">{feature.description}</p>
                </div>
                <div className="card-footer border-0 pt-0">
                  <Link className="text-primary font-semibold hover:text-primary-hover flex gap-1 items-center" to="">
                    Know more
                    <Icon icon="arrow-right" className="ms-1 align-middle" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Tour
          defaultCurrent={1}
          open={openTour}
          onClose={() => setOpenTour(false)}
          animated
          mask
          steps={[
            {
              title: 'Getting Started',
              description: 'Click here to get started and explore our framework-rich admin panel. 🚀',
              target: () => step1Ref.current!,
              placement: 'left',
            },
            {
              title: 'Buy Now',
              description: 'Ready to supercharge your project ? Click here to purchase the template!',
              target: () => step2Ref.current!,
              placement: 'left',
            },
            {
              title: 'Core Features',
              description: 'Learn more about the versatile services and modules we provide to enhance development',
              target: () => step3Ref.current!,
              placement: 'top',
            },
            {
              title: 'Documentation',
              description: 'Thanks for exploring! Read the documentation to get the most out of this template.',
              target: () => step4Ref.current!,
              placement: 'top',
            },
          ]}
        />
      </div>
    </>
  )
}

export default TourPage
