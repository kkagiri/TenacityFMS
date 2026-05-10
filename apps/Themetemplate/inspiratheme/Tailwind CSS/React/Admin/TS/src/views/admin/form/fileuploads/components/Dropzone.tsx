import FileUploader from '@/components/FileUploader'
import { FileType } from '@/types'
import { useState } from 'react'

const Dropzone = () => {
  const [files, setFiles] = useState<FileType[]>([])

  return (
    <div className="card">
      <div className="card-header block">
        <h4 className="card-title mb-1.25">Dropzone</h4>
        <p className="text-default-400">DropzoneJS is an open source library that provides drag’n’drop file uploads with image previews.</p>
      </div>

      <div className="card-body">
        <FileUploader
          files={files}
          setFiles={(newFiles) => setFiles(newFiles as FileType[])}
          accept={{
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
          }}
          maxSize={1024 * 1024 * 10}
          maxFileCount={10}
          multiple
        />
      </div>
    </div>
  )
}

export default Dropzone
