import { FilePondFile, FilePondInitialFile, registerPlugin } from 'filepond'
import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation'
import FilePondPluginImagePreview from 'filepond-plugin-image-preview'
import { useState } from 'react'
import { FilePond } from 'react-filepond'

registerPlugin(FilePondPluginImageExifOrientation, FilePondPluginImagePreview)

const FilePondUploader = () => {
  const [files, setFiles] = useState<(string | FilePondInitialFile | Blob)[]>([])
  const [files2, setFiles2] = useState<(string | FilePondInitialFile | Blob)[]>([])
  const [files3, setFiles3] = useState<(string | FilePondInitialFile | Blob)[]>([])
  return (
    <>
      <div className="card">
        <div className="card-header block">
          <h4 className="card-title mb-1.25">Filepond</h4>
          <p className="text-default-400">A JavaScript library that can upload anything you throw at it, optimizes images for faster uploads, and offers a great, accessible, silky smooth user experience.</p>
        </div>

        <div className="card-body">
          <div className="mb-5">
            <h5 className="mb-5">Basic Example</h5>
            <div className="filepond-uploader">
              <FilePond
                className="filepond filepond-input-multiple"
                files={files}
                onupdatefiles={(fileItems: FilePondFile[]) => {
                  setFiles(fileItems.map((fileItem) => fileItem.file))
                }}
                allowMultiple={true}
                maxFiles={5}
                allowReorder={true}
                server="/api"
              />
            </div>
          </div>

          <div className="mb-5">
            <h5 className="mb-5">Two Grid Example</h5>
            <div className="filepond-uploader two-grid">
              <FilePond
                className="filepond filepond-input-multiple"
                files={files2}
                onupdatefiles={(fileItems: FilePondFile[]) => {
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
            <h5 className="mb-5">Three Grid Example</h5>
            <div className="filepond-uploader three-grid">
              <FilePond
                className="filepond filepond-input-multiple"
                files={files3}
                onupdatefiles={(fileItems: FilePondFile[]) => {
                  setFiles3(fileItems.map((fileItem) => fileItem.file))
                }}
                allowMultiple={true}
                maxFiles={5}
                allowReorder={true}
                server="/api"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-dashed border-default-300"></div>

        <div className="card-body">
          <h4 className="card-title mb-3">Profile Picture</h4>
          <p className="text-default-400 mb-4">FilePond is a JavaScript library with profile picture-shaped file upload variation.</p>

          <div className="grid grid-cols-2 gap-base">
            <div className="col-span-1">
              <div className="size-19.5">
                <FilePond
                  className="filepond filepond-input-circle rounded-full!"
                  allowMultiple={false}
                  maxFiles={1}
                  acceptedFileTypes={['image/png', 'image/jpeg', 'image/gif']}
                  stylePanelAspectRatio="1:1"
                  labelIdle='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M5 7h1a2 2 0 0 0 2-2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2"/><path d="M9 13a3 3 0 1 0 6 0a3 3 0 0 0-6 0"/></g></svg>'
                />
              </div>
            </div>
            <div className="col-span-1">
              <div className="size-19.5">
                <FilePond
                  className="filepond filepond-input-circle rounded!"
                  allowMultiple={false}
                  maxFiles={1}
                  acceptedFileTypes={['image/png', 'image/jpeg', 'image/gif']}
                  stylePanelAspectRatio="1:1"
                  labelIdle='<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M5 7h1a2 2 0 0 0 2-2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2"/><path d="M9 13a3 3 0 1 0 6 0a3 3 0 0 0-6 0"/></g></svg>'
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default FilePondUploader
