import Quill from '@/components/wrappers/Quill'
import { useState } from 'react'


const PostContent = () => {
  const modules = {
    toolbar: [
      [{ font: [] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ script: 'super' }, { script: 'sub' }],
      [{ header: [false, 1, 2, 3, 4, 5, 6] }],
      ['blockquote', 'code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
      [{ align: [] }],
      ['link', 'image', 'video'],
      ['clean'],
    ],
  }
  const [value, setValue] = useState<string>(
    `   <h3>Create, manage, and publish engaging blog articles effortlessly.</h3>
                  <p>
                    <br />
                  </p>
                  <ul>
                    <li>Write and format posts with an intuitive rich-text editor.</li>
                    <li>Organize articles by categories, tags, and authors for easy navigation.</li>
                    <li>Built-in SEO tools to help your content rank higher on search engines.</li>
                    <li>Preview articles before publishing to ensure perfect layout and style.</li>
                    <li>Fully responsive design ensures your blog looks great on any device.</li>
                  </ul>
                  <p>
                    <br />
                  </p>
                  <p>The Blog Article module helps you create professional-looking posts quickly. Ideal for personal blogs, news platforms, or content-driven websites.</p>
                </div>`
  )
  return (
    <>
      <div id="snow-editor" style={{ height: 300 }}>
        <Quill theme="snow" modules={modules} value={value} onChange={setValue} />
      </div>
    </>
  )
}

export default PostContent
