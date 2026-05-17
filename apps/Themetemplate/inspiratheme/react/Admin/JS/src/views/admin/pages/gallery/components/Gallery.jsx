import gallery1 from '@/assets/images/gallery/1.jpg'
import gallery10 from '@/assets/images/gallery/10.jpg'
import gallery11 from '@/assets/images/gallery/11.jpg'
import gallery12 from '@/assets/images/gallery/12.jpg'
import gallery13 from '@/assets/images/gallery/13.jpg'
import gallery14 from '@/assets/images/gallery/14.jpg'
import gallery2 from '@/assets/images/gallery/2.jpg'
import gallery3 from '@/assets/images/gallery/3.jpg'
import gallery4 from '@/assets/images/gallery/4.jpg'
import gallery5 from '@/assets/images/gallery/5.jpg'
import gallery6 from '@/assets/images/gallery/6.jpg'
import gallery7 from '@/assets/images/gallery/7.jpg'
import gallery8 from '@/assets/images/gallery/8.jpg'
import gallery9 from '@/assets/images/gallery/9.jpg'
import Icon from '@/components/wrappers/Icon'
import { useMemo, useState } from 'react'
import { Button, CardBody, CardHeader, FormControl } from 'react-bootstrap'
import { RowsPhotoAlbum } from 'react-photo-album'
import Lightbox from 'yet-another-react-lightbox'
const breakpoints = [3840, 1920, 1080, 640, 384, 256, 128]
const slides = [
  {
    asset: gallery1,
    width: 640,
    height: 427,
    category: 'beautiful',
  },
  {
    asset: gallery2,
    width: 640,
    height: 854,
    category: 'nature',
  },
  {
    asset: gallery3,
    width: 640,
    height: 640,
    category: 'beautiful',
  },
  {
    asset: gallery6,
    width: 640,
    height: 360,
    category: 'nature',
  },
  {
    asset: gallery4,
    width: 640,
    height: 480,
    category: 'nature',
  },
  {
    asset: gallery5,
    width: 640,
    height: 960,
    category: 'travel',
  },
  {
    asset: gallery7,
    width: 640,
    height: 425,
    category: 'city',
  },
  {
    asset: gallery9,
    width: 640,
    height: 960,
    category: 'travel',
  },
  {
    asset: gallery10,
    width: 640,
    height: 962,
    category: 'beautiful',
  },
  {
    asset: gallery11,
    width: 640,
    height: 427,
    category: 'nature',
  },
  {
    asset: gallery12,
    width: 640,
    height: 359,
    category: 'city',
  },
  {
    asset: gallery13,
    width: 640,
    height: 359,
    category: 'city',
  },
  {
    asset: gallery8,
    width: 640,
    height: 800,
    category: 'city',
  },
  {
    asset: gallery14,
    width: 640,
    height: 960,
    category: 'travel',
  },
].map(({ asset, width, height, category }) => ({
  src: asset,
  width,
  height,
  srcSet: breakpoints.map((breakpoint) => ({
    src: asset,
    width: breakpoint,
    height: Math.round((height / width) * breakpoint),
  })),
  category,
}))
const Gallery = () => {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const filteredItems = useMemo(() => {
    return selectedCategory === 'All' ? slides : slides.filter((item) => item.category === selectedCategory)
  }, [selectedCategory])
  const [index, setIndex] = useState(-1)
  return (
    <>
      <CardHeader className="flex-wrap justify-content-between w-100 gap-3">
        <div className="flex-grow-1">
          <div className="app-search">
            <FormControl type="search" name="search" placeholder="Search ..." className="topbar-search" />
            <Icon icon="search" className="app-search-icon text-muted" />
          </div>
        </div>

        <div className="d-flex flex-wrap gap-1 filter-buttons">
          <Button size="sm" className={`btn-ghost-primary ${selectedCategory === 'All' ? 'active' : ''}`} onClick={() => setSelectedCategory('All')}>
            All
          </Button>
          <Button size="sm" className={`btn-ghost-primary ${selectedCategory === 'beautiful' ? 'active' : ''}`} onClick={() => setSelectedCategory('beautiful')}>
            Beautiful
          </Button>
          <Button size="sm" className={`btn-ghost-primary ${selectedCategory === 'nature' ? 'active' : ''}`} onClick={() => setSelectedCategory('nature')}>
            Nature
          </Button>
          <Button size="sm" className={`btn-ghost-primary ${selectedCategory === 'travel' ? 'active' : ''}`} onClick={() => setSelectedCategory('travel')}>
            Travel
          </Button>
          <Button size="sm" className={`btn-ghost-primary ${selectedCategory === 'city' ? 'active' : ''}`} onClick={() => setSelectedCategory('city')}>
            City
          </Button>
        </div>
      </CardHeader>

      <CardBody>
        <div className="w-100">
          <RowsPhotoAlbum photos={filteredItems} onClick={({ index: current }) => setIndex(current)} />

          <Lightbox
            index={index}
            slides={filteredItems}
            open={index >= 0}
            close={() => setIndex(-1)}
            controller={{
              closeOnBackdropClick: true,
            }}
          />
        </div>
      </CardBody>
    </>
  )
}
export default Gallery
