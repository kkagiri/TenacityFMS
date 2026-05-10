import Icon from '@/components/wrappers/Icon'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
const VoteConfirmation = () => {
  return (
    <OverlayTrigger placement="top" overlay={<Tooltip>Thank you for voting</Tooltip>}>
      <Icon icon="checks" className="ms-auto  fs-36 text-success text-opacity-25" />
    </OverlayTrigger>
  )
}
export default VoteConfirmation
