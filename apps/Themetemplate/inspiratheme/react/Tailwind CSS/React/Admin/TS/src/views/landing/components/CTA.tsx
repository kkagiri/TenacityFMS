import ctaImg from '@/assets/images/landing-cta.jpg'
import { Link } from 'react-router'

const CTA = () => {
  return (
    <section className="min-h-87.5 relative overflow-hidden bg-center bg-no-repeat bg-cover" style={{ backgroundImage: `url(${ctaImg})` }}>
      <div className="absolute top-0 bottom-0 inset-s-0 start-0 end-0 inset-e-0 rounded-xl flex items-center flex-col gap-5 justify-center bg-linear-to-t from-[#313a46] via-[rgba(49,58,70,0.8)] to-[rgba(49,58,70,0.5)] text-center">
        <h3 className="text-white text-2xl font-bold">Build Faster with Our Premium Admin Template</h3>
        <p className="text-white/75 text-base">
          Kickstart your project with a modern, responsive, and developer-friendly admin dashboard. <br />
          Try it free for 14 days — no credit card needed.
        </p>
        <Link to="" className="btn bg-light text-default-800 rounded-full hover:text-primary">
          Buy Our Template
        </Link>
      </div>
    </section>
  )
}

export default CTA
