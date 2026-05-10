import Icon from '@/components/wrappers/Icon'
import { Card, CardBody, CardHeader } from 'react-bootstrap'
import { socialFeedData } from './data'
const SocialFeed = () => {
  return (
    <>
      <Card>
        <CardHeader>
          <h4 className="card-title">My Social Feed</h4>
        </CardHeader>
        <CardBody>
          {socialFeedData.map((item, index) => (
            <div
              key={index}
              className={`d-flex justify-content-between align-items-center 
      ${index === 0 ? 'border-bottom pb-2' : index === socialFeedData.length - 1 ? 'pt-2' : 'border-bottom py-2'}`}
            >
              <div className="d-flex align-items-center gap-2">
                <div className="avatar avatar-sm">
                  <img src={item.image} alt={item.name} className="img-fluid rounded" />
                </div>

                <div>
                  <h5 className="fs-sm mb-0 lh-base">{item.name}</h5>
                  {item.text && <p className="text-muted fs-xs mb-0">{item.text}</p>}
                </div>

                {item.badge && (
                  <div>
                    <span className={`badge badge-soft-${item.badge.variant}`}>{item.badge.text}</span>
                  </div>
                )}
              </div>

              <div className="d-flex align-items-center gap-1">
                {item.time && <small className="text-muted fs-xxs">{item.time}</small>}

                {item.actionIcons &&
                  item.actionIcons.map((action, i) => (
                    <a key={i} href="" className={`btn btn-sm btn-icon btn-${action.variant}`}>
                      <Icon icon={action.icon} className="fs-lg" />
                    </a>
                  ))}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </>
  )
}
export default SocialFeed
