import clsx from 'clsx'
import Icon from './wrappers/Icon'

type PropsType = {
  rating: number
  className?: string
}

const Rating = ({ rating, className }: PropsType) => {
  const fullStars = Math.floor(rating)
  const halfStar = rating % 1 !== 0
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0)

  return (
    <span className={clsx('text-warning', className)}>
      {[...Array(fullStars)].map((_, i) => (
        <Icon icon="star-filled" key={`full-${i}`} />
      ))}
      {halfStar && <Icon icon="star-half-filled" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Icon icon="star" key={`empty-${i}`} />
      ))}
    </span>
  )
}

export default Rating
