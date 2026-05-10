import Icon from '@/components/wrappers/Icon'
import { cn, formatBytes } from '@/utils/helpers'
import { Link } from 'react-router'
import { HTMLAttributes, type SVGProps, useCallback, useEffect } from 'react'
import Dropzone, { DropzoneProps, DropzoneState, FileRejection } from 'react-dropzone'

type FileUploaderProps = HTMLAttributes<HTMLDivElement> & {
  files?: File[]
  onValueChange?: (files: File[]) => void
  onUpload?: (files: File[]) => Promise<void>
  accept?: DropzoneProps['accept']
  maxSize?: DropzoneProps['maxSize']
  maxFileCount?: DropzoneProps['maxFiles']
  multiple?: boolean
  disabled?: boolean
  setFiles: (files: File[] | undefined) => void
}

export type FileWithPreview = File & { preview: string }

export type FilePreviewProps = {
  file: FileWithPreview
}

type FileCardProps = {
  file: File
  onRemove: () => void
}

function isFileWithPreview(file: File): file is File & { preview: string } {
  return 'preview' in file && typeof file.preview === 'string'
}

const FileExtensionWithPreview = ({ extension, ...props }: SVGProps<SVGSVGElement> & { extension: string }) => {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M4 4C4 1.79086 5.79086 0 8 0H24L36 12V36C36 38.2091 34.2091 40 32 40H8C5.79086 40 4 38.2091 4 36V4Z" fill="white" />
      <path opacity="0.3" d="M24 0L36 12H28C25.7909 12 24 10.2091 24 8V0Z" fill="currentColor" />
      <text x="50%" y="70%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="10" fontFamily="Arial, sans-serif">
        {extension.toUpperCase()}
      </text>
    </svg>
  )
}

const FileUploader = (props: FileUploaderProps) => {
  const {
    files,
    setFiles,
    onUpload,
    accept = {
      'image/*': [],
    },
    maxSize = 1024 * 1024 * 2,
    maxFileCount = 1,
    multiple = false,
    disabled = false,
    className,
    ...dropzoneProps
  } = props

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      if (!multiple && maxFileCount === 1 && acceptedFiles.length > 1) {
        // showNotification({ message: 'Cannot upload more than 1 file at a time', variant: 'danger' })
        return
      }

      if ((files?.length ?? 0) + acceptedFiles.length > maxFileCount) {
        // showNotification({ message: `Cannot upload more than ${maxFileCount} files`, variant: 'danger' })
        return
      }

      const newFiles = acceptedFiles.map((file: File) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      )

      const updatedFiles = files ? [...files, ...newFiles] : newFiles

      setFiles(updatedFiles)

      if (rejectedFiles.length > 0) {
        rejectedFiles.forEach(({ file }: FileRejection) => {
          // showNotification({ message: `File ${file.name} was rejected`, variant: 'danger' })
        })
      }

      if (onUpload && updatedFiles.length > 0 && updatedFiles.length <= maxFileCount) {
        const target = updatedFiles.length > 0 ? `${updatedFiles.length} files` : `file`

        onUpload(updatedFiles)
          .then(() => {
            // showNotification({ message: `${target} uploaded`, variant: 'success' })
            setFiles([])
          })
          .catch(() => {
            // showNotification({ message: `Failed to upload ${target}`, variant: 'danger' })
          })
      }
    },

    [files, maxFileCount, multiple, onUpload, setFiles]
  )

  function onRemove(index: number) {
    if (!files) return
    const newFiles = files.filter((_: File, i: number) => i !== index)
    setFiles(newFiles)
  }

  useEffect(() => {
    return () => {
      if (!files) return
      files.forEach((file) => {
        if (isFileWithPreview(file)) {
          URL.revokeObjectURL(file.preview)
        }
      })
    }
  }, [])

  const isDisabled = disabled || (files?.length ?? 0) >= maxFileCount

  return (
    <div>
      <Dropzone onDrop={onDrop} accept={accept} maxSize={maxSize} minSize={9} maxFiles={maxFileCount} multiple={maxFileCount > 1 || multiple} disabled={isDisabled}>
        {({ getRootProps, getInputProps }: DropzoneState) => (
          <div className={cn('min-h-37.5 border-2 border-default-300 border-dashed rounded-lg p-5 dz-clickable', className)} {...getRootProps()} {...dropzoneProps}>
            <div className="my-8 dz-clickable">
              <input {...getInputProps()} />

              <div className="dz-message needsclick">
                <div className="mx-auto mb-5 size-11">
                  <span className="btn btn-icon bg-info/15 text-info size-11 rounded-full">
                    <Icon icon="cloud-upload" className="text-2xl" />
                  </span>
                </div>
                <h4 className="mb-3 text-lg text-center">Drop files here or click to upload.</h4>
                <p className="text-default-400 mb-5 text-center italic">You can drag images here, or browse files via the button below.</p>
                <div className="flex justify-center">
                  <button type="button" className="btn btn-sm border-default-300 border shadow">
                    Browse Images
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Dropzone>

      {!!files?.length && files?.map((file: File, index: number) => <FileCard key={index} file={file} onRemove={() => onRemove(index)} />)}
    </div>
  )
}

function FileCard({ file, onRemove }: FileCardProps) {
  return (
    <div className="dropzone-previews mt-5" id="file-previews">
      <div className="card mt-1 border border-dashed border-default-300">
        <div className="p-3">
          <div className="flex items-center">
            <div className="px-3">{isFileWithPreview(file) && <FilePreview file={file} />}</div>
            <div>
              <Link to="" className="font-semibold text-primary">
                {file.name}
              </Link>
              <p className="text-default-400">{formatBytes(file.size)}</p>
            </div>
            <div className="ms-auto">
              <button className="btn btn-sm text-danger" onClick={onRemove}>
                <Icon icon="x" className="size-5 dropzone-close" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FilePreview({ file }: FilePreviewProps) {
  if (file.type.startsWith('image/')) {
    return <img src={file.preview} alt={file.name} width={32} height={32} loading="lazy" className="size-8 rounded bg-light" />
  }

  return (
    <>
      <FileExtensionWithPreview extension={file.name.split('.').pop() ?? ''} />
    </>
  )
}

export default FileUploader
