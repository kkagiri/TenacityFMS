import * as Ladda from 'ladda'
import { ButtonHTMLAttributes, ReactNode, useRef } from 'react'
type LaddaButtonProps = {
  children: ReactNode
  className?: string
} & ButtonHTMLAttributes<HTMLButtonElement>

const LaddaButton = ({ children, className = '', ...props }: LaddaButtonProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleClick = () => {
    if (!buttonRef.current) return

    const instance = Ladda.create(buttonRef.current)
    instance.start()

    let progress = 0
    const interval = setInterval(() => {
      progress = Math.min(progress + Math.random() * 0.1, 1)
      instance.setProgress(progress)

      if (progress === 1) {
        instance.stop()
        clearInterval(interval)
      }
    }, 200)
  }

  return (
    <button ref={buttonRef} className={`btn ladda-button text-white ${className}`} {...props} onClick={handleClick}>
      {children}
    </button>
  )
}

const LoadingButtons = () => {
  return (
    <div className="card">
      <div className="card-header block">
        <h4 className="card-title mb-1">Ladda</h4>
        <p className="text-default-400">
          A UI concept which merges loading indicators into the action that invoked them. Primarily intended for use with forms where it gives users immediate feedback upon submit rather than leaving them wondering while the browser does its thing.
        </p>
      </div>
      <div className="card-body">
        <div className="table-responsive-sm">
          <table className="table">
            <tbody>
              <tr>
                <td style={{ width: '50%' }}>
                  <h5>Expand Left</h5>
                </td>
                <td>
                  <LaddaButton className=" bg-primary hover:bg-primary-hover " data-style="expand-left">
                    Submit
                  </LaddaButton>
                </td>
              </tr>
              <tr>
                <td>
                  <h5>Expand Right</h5>
                </td>
                <td>
                  <LaddaButton className="bg-primary hover:bg-primary-hover " data-style="expand-right">
                    Submit
                  </LaddaButton>
                </td>
              </tr>
              <tr>
                <td>
                  <h5>Expand Up</h5>
                </td>
                <td>
                  <LaddaButton className="bg-primary hover:bg-primary-hover " data-style="expand-up">
                    Submit
                  </LaddaButton>
                </td>
              </tr>
              <tr>
                <td>
                  <h5>Expand Down</h5>
                </td>
                <td>
                  <LaddaButton className="bg-primary hover:bg-primary-hover " data-style="expand-down">
                    Submit
                  </LaddaButton>
                </td>
              </tr>
              <tr>
                <td>
                  <h5>Contract</h5>
                </td>
                <td>
                  <LaddaButton className="bg-warning hover:bg-warning-hover " data-style="contract">
                    Submit
                  </LaddaButton>
                </td>
              </tr>
              <tr>
                <td>
                  <h5>Zoom In</h5>
                </td>
                <td>
                  <LaddaButton className="bg-warning hover:bg-warning-hover " data-style="zoom-in">
                    Submit
                  </LaddaButton>
                </td>
              </tr>
              <tr>
                <td>
                  <h5>Zoom Out</h5>
                </td>
                <td>
                  <LaddaButton className="bg-warning hover:bg-warning-hover " data-style="zoom-out">
                    Submit
                  </LaddaButton>
                </td>
              </tr>
              <tr>
                <td>
                  <h5>Slide Left</h5>
                </td>
                <td>
                  <LaddaButton className="bg-info hover:bg-info-hover " data-style="slide-left">
                    Submit
                  </LaddaButton>
                </td>
              </tr>
              <tr>
                <td>
                  <h5>Slide Right</h5>
                </td>
                <td>
                  <LaddaButton className="bg-info hover:bg-info-hover " data-style="slide-right">
                    Submit
                  </LaddaButton>
                </td>
              </tr>
              <tr>
                <td>
                  <h5>Slide Up</h5>
                </td>
                <td>
                  <LaddaButton className="bg-info hover:bg-info-hover " data-style="slide-up">
                    Submit
                  </LaddaButton>
                </td>
              </tr>
              <tr>
                <td>
                  <h5>Slide Down</h5>
                </td>
                <td>
                  <LaddaButton className="bg-info hover:bg-info-hover " data-style="slide-down">
                    Submit
                  </LaddaButton>
                </td>
              </tr>
              <tr>
                <td>
                  <h5>Expand Right (Progress)</h5>
                </td>
                <td>
                  <LaddaButton className="bg-danger hover:bg-danger-hover " data-style="expand-right">
                    Submit
                  </LaddaButton>
                </td>
              </tr>
              <tr>
                <td>
                  <h5>Contract (Progress)</h5>
                </td>
                <td>
                  <LaddaButton className="bg-danger hover:bg-danger-hover " data-style="contract">
                    Submit
                  </LaddaButton>
                </td>
              </tr>
              <tr>
                <td>
                  <h5>Contract Overlay</h5>
                </td>
                <td>
                  <LaddaButton className="bg-danger hover:bg-danger-hover " data-style="contract-overlay" style={{ zIndex: 1000 }}>
                    Submit
                  </LaddaButton>
                </td>
              </tr>
              <tr>
                <td>
                  <h5>Zoom In (API demo)</h5>
                </td>
                <td>
                  <LaddaButton className="button-demo btn bg-primary hover:bg-primary-hover " data-style="zoom-in">
                    Submit
                  </LaddaButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default LoadingButtons
