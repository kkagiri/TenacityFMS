import Icon from '@/components/wrappers/Icon'
import { Card, CardBody, CardHeader } from 'react-bootstrap'
import { profileData } from './data'

const PersonalInformation = () => {
  return (
    <>
      <Card>
        <CardHeader>
          <h4 className="card-title">Personal Information</h4>
        </CardHeader>
        <CardBody>
          <div>
            {profileData.map((item, idx) => (
              <div className="d-flex align-items-center gap-2 mb-2" key={idx}>
                <div className="avatar-sm bg-light d-flex align-items-center justify-content-center rounded">
                  <Icon icon={item.icon} className="fs-xl text-secondary" />
                </div>
                <p className="mb-0 fs-sm">
                  {item.label}&nbsp;
                  {item.value && <span className="text-dark fw-semibold">{item.value}</span>}
                  {item.link && (
                    <a href={`mailto:${item.link}`} className="text-primary fw-semibold">
                      {item.link}
                    </a>
                  )}
                </p>
              </div>
            ))}

            <div className="d-flex justify-content-center gap-2 mt-4 mb-2">
              <a href="#!" className="btn btn-icon rounded-circle btn-primary" title="Facebook">
                <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-facebook">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M7 10v4h3v7h4v-7h3l1 -4h-4v-2a1 1 0 0 1 1 -1h3v-4h-3a5 5 0 0 0 -5 5v2h-3" />
                </svg>
              </a>
              <a href="#!" className="btn btn-icon rounded-circle btn-info" title="Twitter-x">
                <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-x">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
                  <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
                </svg>
              </a>
              <a href="#!" className="btn btn-icon rounded-circle btn-danger" title="Instagram">
                <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-instagram">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M4 8a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z" />
                  <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                  <path d="M16.5 7.5v.01" />
                </svg>
              </a>
              <a href="#!" className="btn btn-icon rounded-circle btn-success" title="Dribbble">
                <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-dribbble">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                  <path d="M9 3.6c5 6 7 10.5 7.5 16.2" />
                  <path d="M6.4 19c3.5 -3.5 6 -6.5 14.5 -6.4" />
                  <path d="M3.1 10.75c5 0 9.814 -.38 15.314 -5" />
                </svg>
              </a>
              <a href="#!" className="btn btn-icon rounded-circle btn-secondary" title="LinkedIn">
                <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-linkedin">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M8 11v5" />
                  <path d="M8 8v.01" />
                  <path d="M12 16v-5" />
                  <path d="M16 16v-3a2 2 0 1 0 -4 0" />
                  <path d="M3 7a4 4 0 0 1 4 -4h10a4 4 0 0 1 4 4v10a4 4 0 0 1 -4 4h-10a4 4 0 0 1 -4 -4z" />
                </svg>
              </a>
              <a href="#!" className="btn btn-icon rounded-circle btn-danger" title="YouTube">
                <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icons-tabler-outline icon-tabler-brand-youtube">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M2 8a4 4 0 0 1 4 -4h12a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4v-8z" />
                  <path d="M10 9l5 3l-5 3z" />
                </svg>
              </a>
            </div>
          </div>
        </CardBody>
      </Card>
    </>
  )
}

export default PersonalInformation
