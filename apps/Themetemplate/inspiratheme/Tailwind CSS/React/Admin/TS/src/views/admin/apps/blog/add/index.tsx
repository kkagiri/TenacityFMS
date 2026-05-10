import PageBreadcrumb from '@/components/PageBreadcrumb'
import Flatpickr from '@/components/wrappers/Flatpickr'
import PostContent from './components/PostContent'


const Page = () => {
  return (
    <>
      <PageBreadcrumb subtitle="Blog" title="Create Article" />
      <div className="container">
        <div className="card">
          <div className="card-header">
            <h5 className="card-title">Create New Blog Post</h5>
            <small className="text-default-400">Last saved: just now</small>
          </div>
          <div className="card-body">
            <form className="space-y-5">
              <div>
                <label htmlFor="title" className="form-label">
                  Post Title
                </label>
                <input type="text" className="form-input" id="title" placeholder="Enter your blog title" required />
              </div>

              <div>
                <label htmlFor="slug" className="form-label">
                  Slug
                </label>
                <input type="text" className="form-input" id="slug" placeholder="e.g. how-to-build-a-blog" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-base">
                <div>
                  <label htmlFor="author" className="form-label">
                    Author
                  </label>
                  <input type="text" className="form-input" id="author" placeholder="Enter author name" />
                </div>
                <div>
                  <label htmlFor="publishDate" className="form-label">
                    Publish Date &amp; Time
                  </label>
                  <Flatpickr type="text" options={{ dateFormat: 'd M, Y H:i', defaultDate: new Date() }} className="form-input" id="publishDate" />
                </div>
              </div>

              <div>
                <label htmlFor="category" className="form-label">
                  Category
                </label>
                <select id="category" className="form-select" defaultValue="Select category">
                  <option>Select category</option>
                  <option>Technology</option>
                  <option>Design</option>
                  <option>Development</option>
                  <option>Business</option>
                  <option>Lifestyle</option>
                </select>
              </div>

              <div>
                <label htmlFor="profilephoto" className="form-label">
                  Featured Image
                </label>
                <input type="file" name="file-input" id="profilephoto" className="form-input" />
                <small className="text-default-400">Recommended size: 1200x600px</small>
              </div>

              <div>
                <label className="form-label">Post Content</label>
                <PostContent />
              </div>

              <div>
                <label htmlFor="excerpt" className="form-label">
                  Excerpt (Short Summary)
                </label>
                <textarea className="form-textarea" id="excerpt" rows={2} placeholder="Enter a short summary for your post..." />
              </div>

              <div>
                <label htmlFor="tags" className="form-label">
                  Tags
                </label>
                <input type="text" className="form-input" id="tags" placeholder="e.g. TailwindCSS, web design, ui, frontend" />
                <small className="text-default-400">Separate tags with commas.</small>
              </div>

              <div className="border-default-300 mt-7.5 space-y-5 border-t pt-5">
                <h5 className="text-default-400 text-sm font-bold uppercase">SEO Settings</h5>
                <div>
                  <label htmlFor="metaTitle" className="form-label">
                    Meta Title
                  </label>
                  <input type="text" className="form-input" id="metaTitle" placeholder="Enter SEO title" />
                </div>
                <div>
                  <label htmlFor="metaDescription" className="form-label">
                    Meta Description
                  </label>
                  <textarea className="form-textarea" id="metaDescription" rows={2} placeholder="Short description for search engines" />
                </div>
                <div>
                  <label htmlFor="metaKeywords" className="form-label">
                    Meta Keywords
                  </label>
                  <input type="text" className="form-input" id="metaKeywords" placeholder="e.g. blog, TailwindCSS, tutorial" />
                </div>
              </div>

              <div className="border-default-300 mt-7.5 space-y-5 border-t pt-5">
                <h5 className="text-default-400 text-sm font-bold uppercase">Visibility</h5>
                <div className="flex items-center gap-2">
                  <input className="form-switch" type="checkbox" id="featured" />
                  <label className="form-check-label" htmlFor="featured">
                    Mark as Featured Post
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input className="form-switch" type="checkbox" id="commentsEnabled" defaultChecked />
                  <label className="form-check-label" htmlFor="commentsEnabled">
                    Allow Comments
                  </label>
                </div>
              </div>

              <div className="mt-7.5 mb-5 space-y-5">
                <label className="text-default-400 text-sm font-bold uppercase">Status</label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input className="form-radio rounded-full!" type="radio" name="status" id="draft" defaultValue="draft" defaultChecked />
                    <label className="form-check-label" htmlFor="draft">
                      Draft
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input className="form-radio rounded-full!" type="radio" name="status" id="published" defaultValue="published" />
                    <label className="form-check-label" htmlFor="published">
                      Published
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button type="reset" className="btn border-secondary hover:bg-secondary text-secondary hover:text-white">
                  Reset
                </button>
                <button type="submit" className="btn bg-success text-white">
                  Save as Draft
                </button>
                <button type="submit" className="btn bg-primary text-white hover:bg-primary-hover">
                  Publish Post
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
