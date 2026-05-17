import Quill from '@/components/wrappers/Quill'
import { useState } from 'react'
import { Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'

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
      <h3>A powerful and responsive admin dashboard template built on Bootstrap.</h3>
      <p>
        <br />
      </p>
      <ul>
        <li>Fully responsive layout with a sleek and modern design.</li>
        <li>Multiple pre-built pages such as login, registration, dashboard, charts, tables, and more.</li>
        <li>Includes various components like modals, alerts, navigation menus, etc.</li>
        <li>Easy to customize and extend to suit your project’s needs.</li>
        <li>Built with Bootstrap 5x, ensuring compatibility with a wide range of devices.</li>
      </ul>
      <p>
        <br />
      </p>
      <p>MyAdmin Admin is the perfect choice for your next admin project. Get started today and create a stunning interface for your application.</p>
    </div>`
  )
  return (
    <>
      <Card>
        <CardHeader className="d-block">
          <CardTitle as="h4" className="mb-1">
            Quilljs
          </CardTitle>
          <p className="text-muted mb-0">Quill is a modern WYSIWYG editor built for compatibility and extensibility</p>
        </CardHeader>
        <CardBody>
          <CardTitle as="h5" className="mb-1">
            Snow Editor
          </CardTitle>
          <p className="text-muted">Snow is a clean, flat toolbar theme.</p>
          <Quill theme="snow" modules={modules} value={value} onChange={setValue} />
        </CardBody>
        <div className="border-top border-dashed" />
        <CardBody>
          <CardTitle as="h5" className="mb-2">
            Bubble Editor
          </CardTitle>
          <p className="text-muted">Bubble is a simple tooltip based theme.</p>
          <Quill theme="bubble" value={value} onChange={setValue} />
        </CardBody>
      </Card>
    </>
  )
}

export default SnowEditor
