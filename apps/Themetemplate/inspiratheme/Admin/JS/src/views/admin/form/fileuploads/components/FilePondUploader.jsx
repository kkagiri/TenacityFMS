import { registerPlugin } from 'filepond'
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation'
import FilePondPluginImagePreview from 'filepond-plugin-image-preview'
import { useState } from 'react'
import { Card, CardBody, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import { FilePond } from 'react-filepond'
registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview)
const FilePondUploader = () => {
  const [files, setFiles] = useState([])
  const [files2, setFiles2] = useState([])
  const [files3, setFiles3] = useState([])
  return (
    <>
      <Card>
        <CardHeader className="d-block">
          <CardTitle as="h4" className="mb-1">
            Filepond
          </CardTitle>
          <p className="text-muted mb-0">A JavaScript library that can upload anything you throw at it, optimizes images for faster uploads, and offers a great, accessible, silky smooth user experience.</p>
        </CardHeader>

        <CardBody>
          <div className="mb-3">
            <h5 className="mb-3">Basic Example</h5>
            <div className="filepond-uploader">
              <FilePond
                className="filepond"
                files={files}
                onupdatefiles={(fileItems) => {
                  setFiles(fileItems.map((fileItem) => fileItem.file))
                }}
                allowMultiple={true}
                maxFiles={5}
                allowReorder={true}
                server="/api"
              />
            </div>
          </div>
          <div className="mb-3">
            <h5 className="mb-3">Two Grid Example</h5>
            <div className="filepond-uploader two-grid">
              <FilePond
                className="filepond"
                files={files2}
                onupdatefiles={(fileItems) => {
                  setFiles2(fileItems.map((fileItem) => fileItem.file))
                }}
                allowMultiple={true}
                maxFiles={5}
                allowReorder={true}
                server="/api"
              />
            </div>
          </div>
          <div>
            <h5 className="mb-3">Three Grid Example</h5>
            <div className="filepond-uploader three-grid">
              <FilePond
                className="filepond"
                files={files3}
                onupdatefiles={(fileItems) => {
                  setFiles3(fileItems.map((fileItem) => fileItem.file))
                }}
                allowMultiple={true}
                maxFiles={5}
                allowReorder={true}
                server="/api"
              />
            </div>
          </div>
        </CardBody>
        <div className="border-top border-dashed" />
        <CardBody>
          <CardTitle as="h4" className="mb-2">
            Profile Picture
          </CardTitle>
          <p className="text-muted">FilePond is a JavaScript library with profile picture-shaped file upload variation.</p>
          <Row>
            <Col sm={6}>
              <div className="avatar-xxl">
                <FilePond
                  className="filepond filepond-input-circle"
                  allowMultiple={false}
                  maxFiles={1}
                  acceptedFileTypes={['image/png', 'image/jpeg', 'image/gif']}
                  stylePanelAspectRatio="1:1"
                  labelIdle='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M5 7h1a2 2 0 0 0 2-2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2"/><path d="M9 13a3 3 0 1 0 6 0a3 3 0 0 0-6 0"/></g></svg>'
                />
              </div>
            </Col>
            <Col sm={6}>
              <div className="avatar-xxl">
                <FilePond
                  className="filepond filepond-input-circle rounded"
                  allowMultiple={false}
                  maxFiles={1}
                  acceptedFileTypes={['image/png', 'image/jpeg', 'image/gif']}
                  stylePanelAspectRatio="1:1"
                  labelIdle='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M5 7h1a2 2 0 0 0 2-2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2"/><path d="M9 13a3 3 0 1 0 6 0a3 3 0 0 0-6 0"/></g></svg>'
                />
              </div>
            </Col>
          </Row>
        </CardBody>
      </Card>
    </>
  )
}
export default FilePondUploader
