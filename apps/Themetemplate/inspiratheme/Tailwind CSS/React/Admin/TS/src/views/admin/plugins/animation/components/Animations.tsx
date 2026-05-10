import blogImg from '@/assets/images/blog/blog-1.jpg'
import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { useRef } from 'react'
import { animationGroups } from './data'

const Animations = () => {
  const imageRef = useRef<HTMLImageElement>(null)

  const animate = (animation: string) => {
    if (imageRef.current) {
      imageRef.current.classList.add('animate__animated', `animate__${animation}`)

      imageRef.current.addEventListener(
        'animationend',
        () => {
          imageRef.current?.classList.remove('animate__animated', `animate__${animation}`)
        },
        { once: true }
      )
    }
  }
  return (
    <div className="grid grid-cols-1 gap-base">
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Animate.css</h4>
        </div>
        <div className="card-body">
          <p className="text-default-400 mb-4">A cross-browser library of CSS animations. Animate.css is a bunch of cool, fun, and cross-browser animations for you to use in your projects. Great for emphasis, home pages, sliders, and general just-add-water-awesomeness.</p>
          <div className="grid lg:grid-cols-3 grid-cols-1 gap-base">
            <div>
              <div className="card sticky top-20 overflow-hidden">
                <div className="card-body">
                  <div id="animation_box" className="animate__animated" ref={imageRef}>
                    <img src={blogImg} className="img-fluid rounded" alt="user" />
                  </div>
                  <p className="text-default-400 mt-3 text-center">Example box for animation effect.</p>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-info/15 text-info mb-4 flex items-center rounded px-4 py-3">Click any of the buttons below to see the animation effect applied to the box on the left.</div>
              <div className="hs-accordion-group divide-default-200 border-default-300 divide-y rounded border" id="animationAccordion">
                {animationGroups.map((item, idx) => (
                  <div className={cn('hs-accordion', { 'active': idx === 0 })} key={idx}>
                    <button className="hs-accordion-toggle hs-accordion-active:bg-default-100 font-secondary flex w-full items-center justify-between px-5 py-4 font-semibold transition" type="button" data-bs-toggle="collapse" data-bs-target="#collapseAttention">
                      {item.name}
                      <Icon icon="chevron-down" className="hs-accordion-active:rotate-180 transition-transform text-base" />
                    </button>
                    <div id="collapseAttention" className={cn('hs-accordion-content border-default-300 w-full overflow-hidden border-t transition-[height] duration-300', { 'hidden': idx !== 0 })} data-bs-parent="#animationAccordion">
                      <div className="flex flex-wrap gap-3 px-5 py-4">
                        {item.animations.map((animation, idx) => (
                          <button className="btn bg-light animation_select" onClick={() => animate(animation)} key={idx}>
                            {animation}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Animations
