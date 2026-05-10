import { Masonry } from 'masonic'
import BlogCard from './BlogCard'
import { BlogType, blogsData } from './data'



const MasonryBlogs = () => {
  return (
    <div>
      <Masonry items={blogsData} columnGutter={20} columnWidth={350} overscanBy={2} render={({ data }) => <BlogCard blog={data} />} />
    </div>
  )
}

export default MasonryBlogs
