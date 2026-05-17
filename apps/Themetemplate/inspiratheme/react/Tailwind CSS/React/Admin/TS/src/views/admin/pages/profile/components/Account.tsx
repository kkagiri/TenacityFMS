import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import BlogCard from './BlogCard'
import { blogData, statisticsData } from './data'
import TaskOverview from './TaskOverview'

const Account = () => {
  return (
    <>
      <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-base mb-5">
        {statisticsData.map((item, index) => (
          <div key={index} className="card">
            <div className="card-body">
              <div className="flex justify-between items-center mb-2">
                <h5 title={item.title} className="card-title">
                  {item.title}
                </h5>

                <a href="">
                  <Icon icon="external-link" className="size-4.5 text-default-400"></Icon>
                </a>
              </div>

              <div className="flex items-center gap-2.5 my-5">
                <div className={cn('btn btn-icon rounded-full size-9', item.iconClassName)}>
                  <Icon icon={item.icon} className="size-4.5 text-white"></Icon>
                </div>

                <h3 className="text-default-800 text-xl">
                  {item.count.prefix}
                  {item.count.value}
                  {item.count.suffix}
                </h3>

                <span className={cn('ms-auto badge text-xs font-medium', item.className)}>{item.badge}</span>
              </div>

              <div className="flex items-center justify-between text-sm text-default-400">
                <div className="flex items-center gap-1">
                  <span className={item.pointIconClassName}>
                    <Icon icon="circle" className="align-middle"></Icon>
                  </span>
                  <span> {item.description}</span>
                </div>
                <span className="font-semibold text-default-800">
                  {item.totalCount.prefix}
                  {item.totalCount.value}
                  {item.totalCount.suffix}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card mb-5">
        <div className="card-header">
          <h4 className="card-title">About Me</h4>
        </div>
        <div className="card-body">
          <p className="mb-4">
            I'm a Product Designer and template author passionate about crafting clean, scalable, and high-performing UI solutions. With a focus on frontend technologies and modern design systems, I create user-centric digital products that are both functional and visually
            appealing.
          </p>
          <p>As a template creator, I specialize in building developer-friendly UI kits and dashboards using frameworks like Tailwind CSS, Bootstrap, React, Next.js, Vue, and Laravel. My work powers countless web apps, helping developers save time and build faster.</p>
          <div className="mt-5">
            <h5 className="card-title mb-2.5">My Approach :</h5>
            <p>
              I take a user-first approach to design—blending thoughtful UX with clean code. From wireframes to fully responsive templates, I focus on creating intuitive and aesthetic experiences. Whether you're launching a SaaS dashboard, admin panel, or marketing site, I strive
              to deliver pixel-perfect results that elevate your product.
            </p>
          </div>
        </div>
      </div>

      <TaskOverview />

      <h4 className="text-lg font-semibold text-default-800 my-7.5">My Blog Posts</h4>

      <div className="grid xl:grid-cols-3 md:grid-cols-2 gap-base">
        {blogData.map((blog, index) => (
          <BlogCard blog={blog} key={index} />
        ))}
      </div>
    </>
  )
}

export default Account
