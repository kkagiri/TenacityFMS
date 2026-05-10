import { useMemo, useState } from 'react'
import { RowsPhotoAlbum } from 'react-photo-album'
import Lightbox from 'yet-another-react-lightbox'

import img1 from '@/assets/images/gallery/1.jpg'
import img10 from '@/assets/images/gallery/10.jpg'
import img11 from '@/assets/images/gallery/11.jpg'
import img12 from '@/assets/images/gallery/12.jpg'
import img13 from '@/assets/images/gallery/13.jpg'
import img14 from '@/assets/images/gallery/14.jpg'
import img2 from '@/assets/images/gallery/2.jpg'
import img3 from '@/assets/images/gallery/3.jpg'
import img4 from '@/assets/images/gallery/4.jpg'
import img5 from '@/assets/images/gallery/5.jpg'
import img6 from '@/assets/images/gallery/6.jpg'
import img7 from '@/assets/images/gallery/7.jpg'
import img8 from '@/assets/images/gallery/8.jpg'
import img9 from '@/assets/images/gallery/9.jpg'
import Icon from '@/components/wrappers/Icon'

const breakpoints = [3840, 1920, 1080, 640, 384, 256]

const photos = [
  { src: img1, width: 640, height: 427, category: 'machine-learning' },
  { src: img2, width: 640, height: 360, category: 'computer-vision' },
  { src: img3, width: 640, height: 854, category: 'nlp' },
  { src: img4, width: 640, height: 640, category: 'robotics' },
  { src: img5, width: 640, height: 960, category: 'machine-learning' },
  { src: img6, width: 640, height: 800, category: 'machine-learning' },
  { src: img7, width: 640, height: 425, category: 'computer-vision' },
  { src: img8, width: 640, height: 480, category: 'nlp' },
  { src: img9, width: 640, height: 960, category: 'robotics' },
  { src: img10, width: 640, height: 962, category: 'robotics' },
  { src: img11, width: 640, height: 427, category: 'machine-learning' },
  { src: img12, width: 640, height: 359, category: 'computer-vision' },
  { src: img13, width: 640, height: 359, category: 'nlp' },
  { src: img14, width: 640, height: 960, category: 'nlp' },
].map((item) => ({
  ...item,
  srcSet: breakpoints.map((bp) => ({
    src: item,
    width: bp,
    height: Math.round((item.height / item.width) * bp),
  })),
}))

const categories = [
  { label: 'All', value: 'all' },
  { label: 'Machine Learning', value: 'machine-learning' },
  { label: 'Computer Vision', value: 'computer-vision' },
  { label: 'NLP', value: 'nlp' },
  { label: 'Robotics', value: 'robotics' },
]

const Gallery = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [search, setSearch] = useState('')

  const filteredPhotos = useMemo(() => {
    return photos.filter((photo) => {
      const matchCategory = selectedCategory === 'all' || photo.category === selectedCategory

      const matchSearch = search.length === 0 || photo.category.toLowerCase().includes(search.toLowerCase())

      return matchCategory && matchSearch
    })
  }, [selectedCategory, search])
  return (
    <>
      <div className="card">
        {/* HEADER */}
        <div className="card-header flex flex-wrap items-center justify-between gap-4">
          {/* SEARCH */}
          <div className="input-icon-group max-w-xs">
            <Icon icon="search" className="input-icon" />
            <input type="search" className="form-input" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {/* FILTER BUTTONS */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`btn btn-sm font-semibold text-sm  transition
                    ${selectedCategory === cat.value ? 'bg-primary/20 text-primary' : 'text-primary hover:bg-primary hover:text-white'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* BODY */}
        <div className="card-body">
          <RowsPhotoAlbum photos={filteredPhotos} targetRowHeight={240} onClick={({ index }) => setLightboxIndex(index)} />

          <Lightbox slides={filteredPhotos} open={lightboxIndex >= 0} index={lightboxIndex} close={() => setLightboxIndex(-1)} controller={{ closeOnBackdropClick: true }} />
        </div>
      </div>
    </>
  )
}

export default Gallery
