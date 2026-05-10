import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { Link } from 'react-router'
import { useState } from 'react'
import { PinNoteType, pinNoteData } from './data'

const PinboardPage = () => {
  const [pinNotes, setPinNotes] = useState<PinNoteType[]>(pinNoteData)

  const handleAddNote = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const title = (form.elements.namedItem('noteTitle') as HTMLInputElement).value
    const description = (form.elements.namedItem('noteContent') as HTMLTextAreaElement).value
    const className = (form.elements.namedItem('noteColor') as HTMLSelectElement).value

    const newNote: PinNoteType = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString(),
      title,
      description,
      className: className,
    }

    setPinNotes((prev) => [...prev, newNote])
    window.HSOverlay?.close('#addNoteModal')
    form.reset()
  }

  const handleDelete = (id: string) => {
    setPinNotes((prev) => prev.filter((note) => note.id !== id))
  }
  return (
    <>
      <div className="card bg-transparent! shadow-none">
        <div className="card-body">
          <div className="p-7.5">
            <div className="flex flex-wrap justify-center gap-5">
              {pinNotes.map((note, idx) => (
                <div className={cn('hs-removing:hidden relative size-52.5 p-3.5 shadow-[4px_3px_7px_rgba(49,58,70,0.1)] transition-transform duration-300 hover:scale-110', note.className)} id="pin-1" key={idx}>
                  <p className="mb-4 text-end text-2xs">{note.timestamp}</p>
                  <h4 className="text-md mb-2">{note.title}</h4>
                  <p className="mb-4">{note.description}</p>
                  <Link
                    to=""
                    className="absolute end-3 bottom-3"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(note.id)
                    }}
                  >
                    <Icon icon="trash" className="text-base" />
                  </Link>
                </div>
              ))}

              <div className="flex size-52.5 items-center justify-center p-3.5 transition-transform duration-300" id="pin-9">
                <button className="btn btn-icon bg-primary btn-sm relative size-9.25 text-white transition-transform duration-300 hover:scale-110" aria-haspopup="dialog" aria-expanded="false" aria-controls="addNoteModal" data-hs-overlay="#addNoteModal">
                  <Icon icon="plus" className="text-base" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="addNoteModal" className="hs-overlay hs-overlay-open:opacity-100 hs-overlay-open:duration-500 pointer-events-none fixed start-0 top-0 z-80 hidden size-full overflow-x-hidden overflow-y-auto" role="dialog" tabIndex={-1} aria-labelledby="addNoteModalLabel">
        <div className="hs-overlay-animation-target hs-overlay-open:scale-100 hs-overlay-open:opacity-100 m-3 flex min-h-[calc(100%-56px)] scale-95 items-center opacity-0 transition-all duration-200 ease-in-out md:mx-auto md:w-full md:max-w-lg">
          <div className="card pointer-events-auto flex w-full flex-col">
            <div className="card-header">
              <h3 id="addNoteModalLabel" className="text-sm font-bold">
                Add New Note
              </h3>
              <button type="button" aria-label="Close" data-hs-overlay="#addNoteModal">
                <Icon icon="x" className="text-xl" />
              </button>
            </div>
            <form onSubmit={handleAddNote}>
              <div className="card-body overflow-y-auto">
                <div className="mb-5">
                  <label className="form-label">Title</label>
                  <input type="text" name="noteTitle" className="form-input" placeholder="Enter note title" />
                </div>
                <div className="mb-5">
                  <label className="form-label">Note Content</label>
                  <textarea rows={3} name="noteContent" className="form-textarea" placeholder="Write your note..." defaultValue={''} />
                </div>
                <div className="mb-5">
                  <label className="form-label">Color Theme</label>
                  <select name="noteColor" className="form-select">
                    <option value="bg-success/10">Green (Success)</option>
                    <option value="bg-primary/10">Blue (Primary)</option>
                    <option value="bg-warning/10">Yellow (Warning)</option>
                    <option value="bg-danger/10">Red (Danger)</option>
                    <option value="bg-light">Light</option>
                  </select>
                </div>
              </div>
              <div className="border-default-300 flex items-center justify-end gap-x-2 border-t p-5">
                <button type="button" className="btn bg-secondary text-white hover:bg-secondary-hover" data-hs-overlay="#addNoteModal">
                  Cancel
                </button>
                <button type="submit" className="btn bg-primary text-white hover:bg-primary-hover">
                  Add Note
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}

export default PinboardPage
