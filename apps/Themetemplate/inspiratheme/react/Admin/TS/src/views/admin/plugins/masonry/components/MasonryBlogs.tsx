import { Masonry } from 'masonic'
import BlogCard from './BlogCard'
import { blogsData, BlogType } from './data'



const MasonryBlogs = () => {
  return (
    <div style={{ width: '100%' }}>
      <Masonry items={blogsData} columnGutter={20} columnWidth={350} overscanBy={2} render={({ data }) => <BlogCard blog={data} />} />
    </div>
  )
}

export default MasonryBlogs
