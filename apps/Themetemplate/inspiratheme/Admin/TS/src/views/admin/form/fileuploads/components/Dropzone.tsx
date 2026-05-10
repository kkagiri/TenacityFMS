import { FileType } from '@/types'
import { useState } from 'react'
import { Card, CardBody, CardHeader, CardTitle } from 'react-bootstrap'
import FileUploader from './FileUploader'

const Dropzone = () => {
  const [files, setFiles] = useState<FileType[]>([])

  return (
    <>
      <Card>
        <CardHeader className="d-block">
          <CardTitle as="h4" className="mb-1">
            Dropzone
          </CardTitle>
        </CardHeader>
        <CardBody className="pt-0">
          <br />
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
        </CardBody>
      </Card>
    </>
  )
}

export default Dropzone
