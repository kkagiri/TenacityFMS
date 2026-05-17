
import FileUploader from '@/components/FileUploader'
import { FileType } from '@/types'
import { useState } from 'react'

const ProductImage = () => {
  const [files, setFiles] = useState<FileType[]>([])

  return (
    <div className="card">
      <div className="card-header p-5">
        <div>
          <h4 className="card-title mb-1.25">Product Image</h4>
          <p className="text-default-400">To upload a product image, please use the option below to select and upload the relevant file.</p>
        </div>
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
          className="mb-3"
        />
      </div>
    </div>
  )
}

export default ProductImage
