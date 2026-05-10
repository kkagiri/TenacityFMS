import Quill from '@/components/wrappers/Quill'


import { useState } from 'react'

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

const SnowEditor = () => {
  const [value, setValue] = useState<string>(
    `<div>
      <h3>A powerful and responsive admin dashboard template built on Tailwind.</h3>
      <p>
        <br />
      </p>
      <ul>
        <li>Fully responsive layout with a sleek and modern design.</li>
        <li>Multiple pre-built pages such as login, registration, dashboard, charts, tables, and more.</li>
        <li>Includes various components like modals, alerts, navigation menus, etc.</li>
        <li>Easy to customize and extend to suit your project’s needs.</li>
        <li>Built with TailwindCSS 4x,, ensuring compatibility with a wide range of devices.</li>
      </ul>
      <p>
        <br />
      </p>
      <p>MyAdmin Admin is the perfect choice for your next admin project. Get started today and create a stunning interface for your application.</p>
    </div>`
  )
  return (
    <div className="card">
      <div className="card-header block">
        <h4 className="card-title mb-1.25">Quilljs</h4>
        <p className="text-default-400">Quill is a modern WYSIWYG editor built for compatibility and extensibility</p>
      </div>

      <div className="card-body">
        <h5 className="card-title mb-1.25">Snow Editor</h5>
        <p className="text-default-400 mb-4">Snow is a clean, flat toolbar theme.</p>

        <Quill theme="snow" modules={modules} value={value} onChange={setValue} />
      </div>

      <div className="border-t border-default-300 border-dashed"></div>

      <div className="card-body">
        <h4 className="card-title mb-1.25">Bubble Editor</h4>
        <p className="text-default-400 mb-4">Bubble is a simple tooltip based theme.</p>

        <Quill theme="bubble" value={value} onChange={setValue} />
      </div>
    </div>
  )
}

export default SnowEditor
