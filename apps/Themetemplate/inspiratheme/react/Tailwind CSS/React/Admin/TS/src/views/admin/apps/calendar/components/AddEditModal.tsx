import Icon from '@/components/wrappers/Icon'
import { cn } from '@/utils/helpers'
import { yupResolver } from '@hookform/resolvers/yup'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import type { CalendarFormType, SubmitEventType } from './data'

const AddEditModal = ({ eventData, isEditable, onAddEvent, onRemoveEvent, onUpdateEvent }: CalendarFormType) => {
  const schema = yup.object({
    title: yup.string().required('Please provide a valid event name'),
    category: yup.string().required('Please select a valid event category'),
  })

  type FormValues = yup.InferType<typeof schema>

  const {
    handleSubmit,
    setValue,
    reset,
    register,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      title: eventData?.title ?? '',
      category: eventData?.className ? String(eventData.className) : 'bg-danger/10 !text-danger',
    },
  })

  const onSubmitEvent = (data: SubmitEventType) => {
    if (isEditable) {
      onUpdateEvent(data)
    } else {
      onAddEvent(data)
    }
  }

  useEffect(() => {
    if (eventData?.title) {
      setValue('title', String(eventData.title))
      setValue('category', String(eventData.className))
    }
  }, [eventData])

  return (
    <div id="event-modal" className="hs-overlay hidden size-full fixed top-0 start-0 z-80 overflow-x-hidden overflow-y-auto pointer-events-none" role="dialog" tabIndex={-1} aria-labelledby="event-modal-label">
      <div className="hs-overlay-animation-target hs-overlay-open:scale-100 hs-overlay-open:opacity-100 scale-95 opacity-0 ease-in-out transition-all duration-200 sm:max-w-lg sm:w-full m-3 sm:mx-auto min-h-[calc(100%-56px)] flex items-center">
        <div className="card w-full flex flex-col border border-default-200 shadow-2xs pointer-events-auto">
          <div className="card-header">
            <h3 id="modal-title" className="font-semibold text-base text-default-800 dark:text-white">
              Add Event
            </h3>
            <button type="button" className="size-5 text-default-800" aria-label="Close" data-hs-overlay="#event-modal">
              <span className="sr-only">Close</span>
              <Icon icon="x" className="size-5"></Icon>
            </button>
          </div>

          <form className="needs-validation" onSubmit={handleSubmit(onSubmitEvent)} name="event-form" id="form-event">
            <div className="card-body">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="event-title" className="form-label">
                    Event Name
                  </label>
                  <input type="text" id="event-title" className={cn('form-input', { 'border-danger': errors.title })} placeholder="Event name" {...register('title')} />

                  {errors.title && <p className="text-danger text-sm mt-1">{errors.title.message}</p>}
                </div>

                <div>
                  <label htmlFor="event-category" className="form-label">
                    Category
                  </label>
                  <select {...register('category')} className={cn('form-input flex items-center', { 'border-danger': errors.category })} name="event-category" id="event-category">
                    <option>Select Category</option>
                    <option value="bg-primary/10 !text-primary">Primary</option>
                    <option value="bg-success/10 !text-success">Success</option>
                    <option value="bg-info/10 !text-info">Info</option>
                    <option value="bg-warning/10 !text-warning">Warning</option>
                    <option value="bg-danger/10 !text-danger">Danger</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="card-footer flex gap-2 md:justify-end">
              <button type="reset" data-hs-overlay="#event-modal" className="btn bg-light hover:text-primary">
                Cancel
              </button>

              {isEditable && (
                <button type="reset" id="btn-delete-event" className="btn bg-light hover:text-primary" onClick={onRemoveEvent}>
                  Delete
                </button>
              )}

              <button type="submit" id="btn-save-event" className="btn bg-primary text-white hover:bg-primary-hover">
                {isEditable ? 'Edit Event' : 'Add Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AddEditModal
